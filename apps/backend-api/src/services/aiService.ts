import { createOllama } from "ollama-ai-provider-v2";
import { generateText, streamText, generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import OpenAI from "openai";
import { db } from "../db";
import { aiConfigurations, systemPrompts } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { encryptionService } from "./encryptionService";
import { z } from "zod";
import type {
  OllamaConfigSettings,
  HttpApiConfigSettings,
  GeminiConfigSettings,
  AIProvider,
  SystemPrompt,
  JsonField,
  SystemPromptCategory,
} from "@athena/shared";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content:
    | string
    | Array<{
        type: "text" | "image";
        text?: string;
        image?: string; // base64 data URL
      }>;
}

export interface ChatRequest {
  messages: ChatMessage[];
  userId: string;
  configurationId?: string;
  sessionId?: string;
  systemPromptId?: string;
  files?: Array<{
    name: string;
    type: string;
    data: string; // base64 encoded
  }>;
  attachmentFiles?: Array<{
    messageId: string;
    attachments: Array<{
      id: string;
      filename: string;
      mimeType: string;
      data: Buffer;
    }>;
  }>;
}

export interface ChatResponse {
  message: string;
  model: string;
  finishReason: string;
  reasoning?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Helper function to convert multimodal messages for Gemini
function convertMessagesForGemini(
  messages: ChatMessage[],
  attachmentFiles?: Array<{
    messageId: string;
    attachments: Array<{
      id: string;
      filename: string;
      mimeType: string;
      data: Buffer;
    }>;
  }>
) {
  // Create a map of message content to message IDs for attachment lookup
  // Since we don't have message IDs in the messages array, we'll need to match by content
  const messageAttachmentMap = new Map<string, Array<{
    id: string;
    filename: string;
    mimeType: string;
    data: Buffer;
  }>>();

  // For now, we'll add all attachments to the last user message
  // This assumes the most recent user message is the one with attachments
  if (attachmentFiles && attachmentFiles.length > 0) {
    // Find the last user message and attach all images to it
    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        lastUserMessageIndex = i;
        break;
      }
    }

    if (lastUserMessageIndex >= 0) {
      const lastUserMessage = messages[lastUserMessageIndex];
      const messageKey = typeof lastUserMessage.content === "string" 
        ? lastUserMessage.content 
        : JSON.stringify(lastUserMessage.content);
      
      // Combine all attachments from all attachment files
      const allAttachments: Array<{
        id: string;
        filename: string;
        mimeType: string;
        data: Buffer;
      }> = [];

      for (const attachmentFile of attachmentFiles) {
        allAttachments.push(...attachmentFile.attachments);
      }

      messageAttachmentMap.set(messageKey, allAttachments);
    }
  }

  return messages.map((msg) => {
    const contentParts: any[] = [];

    if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === "text" && part.text) {
          contentParts.push({ type: "text", text: part.text });
        }
        if (part.type === "image" && part.image) {
          // Convert existing image format to AI SDK format
          const base64Data = part.image.includes(",")
            ? part.image.split(",")[1]
            : part.image;

          // Determine media type from data URL or default to jpeg
          let mediaType = "image/jpeg";
          if (part.image.includes("data:")) {
            const match = part.image.match(/data:([^;]+)/);
            if (match) mediaType = match[1];
          }

          contentParts.push({
            type: "file",
            data: Buffer.from(base64Data, "base64"),
            mediaType,
          });
        }
      }
    } else if (typeof msg.content === "string") {
      contentParts.push({ type: "text", text: msg.content });
    }


    // Add attachments from database for this message
    const messageKey = typeof msg.content === "string" 
      ? msg.content 
      : JSON.stringify(msg.content);
    
    const messageAttachments = messageAttachmentMap.get(messageKey);
    if (msg.role === "user" && messageAttachments?.length) {
      for (const attachment of messageAttachments) {
        if (attachment.mimeType.startsWith("image/")) {
          contentParts.push({
            type: "file",
            data: attachment.data,
            mediaType: attachment.mimeType,
          });
        }
      }
    }

    // Return AI SDK compatible format
    return {
      role: msg.role,
      content:
        contentParts.length === 1 && contentParts[0].type === "text"
          ? contentParts[0].text
          : contentParts,
    };
  });
}

// Helper function to convert JsonField array to Zod schema
function buildZodSchema(fields: JsonField[]): z.ZodObject<Record<string, any>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    let zodType: z.ZodTypeAny;

    switch (field.type) {
      case "string":
        zodType = z.string();
        if (field.description) {
          zodType = zodType.describe(field.description);
        }
        break;
      case "number":
        zodType = z.number();
        if (field.description) {
          zodType = zodType.describe(field.description);
        }
        break;
      case "boolean":
        zodType = z.boolean();
        if (field.description) {
          zodType = zodType.describe(field.description);
        }
        break;
      case "object":
        if (field.children && field.children.length > 0) {
          zodType = buildZodSchema(field.children);
        } else {
          zodType = z.object({});
        }
        if (field.description) {
          zodType = zodType.describe(field.description);
        }
        break;
      case "array":
        if (field.arrayItemType) {
          switch (field.arrayItemType) {
            case "string":
              zodType = z.array(z.string());
              break;
            case "number":
              zodType = z.array(z.number());
              break;
            case "boolean":
              zodType = z.array(z.boolean());
              break;
            case "object":
              if (field.children && field.children.length > 0) {
                zodType = z.array(buildZodSchema(field.children));
              } else {
                zodType = z.array(z.object({}));
              }
              break;
            default:
              zodType = z.array(z.string()); // Default to string array for safety
          }
        } else {
          zodType = z.array(z.string()); // Default to string array for safety
        }
        if (field.description) {
          zodType = zodType.describe(field.description);
        }
        break;
      default:
        console.warn(`Unknown field type: ${field.type}, defaulting to string`);
        zodType = z.string(); // Default to string for unknown types
    }

    if (field.required) {
      shape[field.name] = zodType;
    } else {
      shape[field.name] = zodType.optional();
    }
  }

  const schema = z.object(shape);
  return schema;
}

async function getSystemPrompt(
  userId: string,
  systemPromptId: string
): Promise<SystemPrompt | null> {
  const result = await db
    .select()
    .from(systemPrompts)
    .where(
      and(
        eq(systemPrompts.id, systemPromptId),
        eq(systemPrompts.userId, userId)
      )
    )
    .limit(1);

  if (!result.length) {
    return null;
  }

  const prompt = result[0];
  return {
    id: prompt.id,
    userId: prompt.userId,
    title: prompt.title,
    description: prompt.description,
    category: prompt.category,
    content: prompt.content,
    jsonSchema: prompt.jsonSchema || undefined,
    jsonDescription: prompt.jsonDescription || undefined,
    createdAt: prompt.createdAt,
    updatedAt: prompt.updatedAt,
  };
}

async function getAIConfig(
  userId: string,
  configurationId?: string
): Promise<{
  provider: AIProvider;
  settings: OllamaConfigSettings | HttpApiConfigSettings | GeminiConfigSettings;
}> {
  let config: Array<{
    id: string;
    userId: string;
    name: string;
    provider: "gemini" | "ollama" | "http-api";
    settings: unknown;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;

  if (configurationId) {
    // Get specific configuration
    config = await db
      .select()
      .from(aiConfigurations)
      .where(
        and(
          eq(aiConfigurations.id, configurationId),
          eq(aiConfigurations.userId, userId),
          eq(aiConfigurations.isActive, true)
        )
      )
      .limit(1);
  } else {
    // Get default active AI configuration for user (prefer http-api, then ollama)
    config = await db
      .select()
      .from(aiConfigurations)
      .where(
        and(
          eq(aiConfigurations.userId, userId),
          eq(aiConfigurations.isActive, true)
        )
      )
      .limit(1);
  }

  if (!config.length) {
    throw new Error("No active AI configuration found for user");
  }

  const provider = config[0].provider as AIProvider;

  // Parse the settings
  const settingsData = config[0].settings;
  let parsedSettings: any;

  // Handle different data formats
  if (typeof settingsData === "string") {
    try {
      parsedSettings = JSON.parse(settingsData);
    } catch (parseError) {
      console.error("Failed to parse settings JSON:", parseError);
      console.error("Settings data:", settingsData);
      throw new Error(`Invalid JSON in settings: ${settingsData}`);
    }
  } else {
    parsedSettings = settingsData;
  }

  // Try to decrypt sensitive fields if they exist
  let decryptedSettings: any;
  try {
    decryptedSettings = await encryptionService.decryptSensitiveFields(provider, parsedSettings);
  } catch (decryptError) {
    console.warn(
      "Decryption failed, using settings as-is (might be unencrypted):",
      decryptError
    );
    decryptedSettings = parsedSettings;
  }

  return {
    provider,
    settings: decryptedSettings as
      | OllamaConfigSettings
      | HttpApiConfigSettings
      | GeminiConfigSettings,
  };
}

export async function generateChatResponse(
  request: ChatRequest
): Promise<ChatResponse> {
  const { messages, userId, configurationId, systemPromptId, attachmentFiles } = request;

  try {
    // Get AI configuration from database
    const { provider, settings } = await getAIConfig(userId, configurationId);

    // Get system prompt if provided
    let systemPrompt: SystemPrompt | null = null;

    if (systemPromptId) {
      systemPrompt = await getSystemPrompt(userId, systemPromptId);
    }

    let result: { text: string; finishReason?: string; reasoning?: any; usage?: any };

    if (provider === "gemini") {
      const geminiSettings = settings as GeminiConfigSettings;

      // Create Google provider with API key
      const googleProvider = createGoogleGenerativeAI({
        apiKey: geminiSettings.apiKey,
      });

      // Convert messages specifically for Gemini format
      const convertedMessages = convertMessagesForGemini(messages, attachmentFiles);

      // Handle structured output prompts vs regular prompts
      if (systemPrompt && systemPrompt.category === "Structured Output" && systemPrompt.jsonSchema) {
        // Use generateObject for structured outputs
        const zodSchema = buildZodSchema(systemPrompt.jsonSchema);
        
        // Enhanced system prompt for strict schema compliance
        const enhancedSystemPrompt = `${systemPrompt.content}

          CRITICAL: You MUST respond with valid JSON that matches the exact schema above. 
          - Include ONLY the fields defined in the schema
          - Use the exact field names specified
          - Match the exact data types specified  
          - Do NOT add any additional fields, explanations, or context
          - Do NOT provide analysis beyond what's requested
          - Your response must be parseable as JSON with only the specified structure

          Schema fields: ${systemPrompt.jsonSchema.map(field => `${field.name} (${field.type})${field.required ? ' *required*' : ''}`).join(', ')}`;
        
        const { object, reasoning, finishReason, usage } = await generateObject({
          model: googleProvider(geminiSettings.model),
          messages: convertedMessages,
          system: enhancedSystemPrompt,
          schema: zodSchema,
          temperature: 0.1, // Lower temperature for more consistent structured output
          topP: geminiSettings.topP,
          providerOptions: {
            google: {
              structuredOutputs: true, // Ensure structured outputs are enabled
              thinkingConfig: {
                thinkingBudget: 1024, // Reduce thinking to focus on schema compliance
                includeThoughts: false, // Disable thoughts to avoid confusion
              },
            },
          },
        });
        
        // Validate the generated object against expected fields
        const expectedFields = systemPrompt.jsonSchema.filter(f => f.required).map(f => f.name);
        const actualFields = Object.keys(object);
        const missingFields = expectedFields.filter(field => !(field in object));
        const extraFields = actualFields.filter(field => !systemPrompt.jsonSchema.some(f => f.name === field));
        
        if (missingFields.length > 0) {
          console.warn("Missing required fields:", missingFields);
        }
        if (extraFields.length > 0) {
          console.warn("Extra fields not in schema:", extraFields);
        }
        
        // Convert object to formatted JSON string - use compact format for simple objects
        const isSimpleObject = Object.keys(object).length <= 3 && 
          Object.values(object).every(v => typeof v !== 'object' || v === null);
        
        const text = isSimpleObject ? JSON.stringify(object) : JSON.stringify(object, null, 2);
        result = { text, reasoning, finishReason, usage };
      } else {
        // Use generateText for regular prompts or topic-specific prompts
        const { text, reasoning, finishReason, usage } = await generateText({
          model: googleProvider(geminiSettings.model),
          messages: convertedMessages,
          system: systemPrompt?.content, // Add system prompt as system instruction
          temperature: geminiSettings.temperature,
          topP: geminiSettings.topP,
          providerOptions: {
            google: {
              thinkingConfig: {
                thinkingBudget: -1, // Number of thinking tokens (0 to disable)
                includeThoughts: true, // Get thought summaries in response
              },
            },
          },
        });

        result = { text, reasoning, finishReason, usage };
      }

      // Debug: Log the result
      console.log("Gemini result:", result);
    } else if (provider === "ollama") {
      const ollamaSettings = settings as OllamaConfigSettings;
      const ollama = createOllama({
        baseURL: ollamaSettings.serverUrl,
      });

      // For non-Gemini providers, convert to text-only
      const textMessages = messages.map((msg) => ({
        role: msg.role,
        content: Array.isArray(msg.content)
          ? msg.content
              .filter((part) => part.type === "text")
              .map((part) => part.text)
              .join(" ")
          : msg.content,
      }));

      result = await generateText({
        model: ollama(ollamaSettings.model),
        messages: textMessages,
        system: systemPrompt?.content, // Add system prompt as system instruction
        temperature: ollamaSettings.temperature,
      });
    } else if (provider === "http-api") {
      const httpSettings = settings as HttpApiConfigSettings;

      // Use OpenAI SDK directly for HTTP API
      const openai = new OpenAI({
        baseURL: httpSettings.baseUrl,
        apiKey: httpSettings.apiKey || "not-needed",
      });

      // For HTTP API, convert to text-only
      let textMessages = messages.map((msg) => ({
        role: msg.role as "system" | "user" | "assistant",
        content: Array.isArray(msg.content)
          ? msg.content
              .filter((part) => part.type === "text")
              .map((part) => part.text)
              .join(" ")
          : msg.content,
      }));

      // Add system prompt as system message if provided
      if (systemPrompt?.content) {
        textMessages = [
          { role: "system", content: systemPrompt.content },
          ...textMessages
        ];
      }

      const response = await openai.chat.completions.create({
        model: httpSettings.model,
        messages: textMessages,
        temperature: httpSettings.temperature,
      });

      result = {
        text: response.choices[0]?.message?.content || "",
        finishReason: response.choices[0]?.finish_reason || "stop",
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
      };
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    const modelName =
      provider === "ollama"
        ? (settings as OllamaConfigSettings).model
        : provider === "gemini"
          ? (settings as GeminiConfigSettings).model
          : (settings as HttpApiConfigSettings).model;

    return {
      message: result.text,
      model: modelName,
      finishReason: result.finishReason || "stop",
      reasoning: result.reasoning || undefined,
      usage: result.usage
        ? {
            promptTokens: result.usage.promptTokens || 0,
            completionTokens: result.usage.completionTokens || 0,
            totalTokens: result.usage.totalTokens || 0,
          }
        : undefined,
    };
  } catch (error) {
    console.error("Error generating chat response:", error);
    throw new Error("Failed to generate AI response");
  }
}

export async function streamChatResponse(request: ChatRequest) {
  const { messages, userId, configurationId, systemPromptId, attachmentFiles } = request;

  try {
    // Get AI configuration from database
    const { provider, settings } = await getAIConfig(userId, configurationId);

    // Get system prompt if provided
    let systemPrompt: SystemPrompt | null = null;
    if (systemPromptId) {
      systemPrompt = await getSystemPrompt(userId, systemPromptId);
    }

    let result: { textStream: any };

    if (provider === "gemini") {
      const geminiSettings = settings as GeminiConfigSettings;

      // Create Google provider with API key
      const googleProvider = createGoogleGenerativeAI({
        apiKey: geminiSettings.apiKey,
      });

      // Convert messages specifically for Gemini format
      const convertedMessages = convertMessagesForGemini(messages, attachmentFiles);

      // Note: For streaming, we only support text generation, not structured output
      result = streamText({
        model: googleProvider(geminiSettings.model),
        messages: convertedMessages,
        system: systemPrompt?.content, // Add system prompt as system instruction
        temperature: geminiSettings.temperature,
        topP: geminiSettings.topP,
        providerOptions: {
          google: {
            thinkingConfig: {
              thinkingBudget: 8192, // Number of thinking tokens (0 to disable)
              includeThoughts: true, // Get thought summaries in response
            },
          },
        },
      });
    } else if (provider === "ollama") {
      const ollamaSettings = settings as OllamaConfigSettings;
      const ollama = createOllama({
        baseURL: ollamaSettings.serverUrl,
      });

      // For non-Gemini providers, convert to text-only
      const textMessages = messages.map((msg) => ({
        role: msg.role,
        content: Array.isArray(msg.content)
          ? msg.content
              .filter((part) => part.type === "text")
              .map((part) => part.text)
              .join(" ")
          : msg.content,
      }));

      result = streamText({
        model: ollama(ollamaSettings.model),
        messages: textMessages,
        system: systemPrompt?.content, // Add system prompt as system instruction
        temperature: ollamaSettings.temperature,
      });
    } else if (provider === "http-api") {
      const httpSettings = settings as HttpApiConfigSettings;

      // Use OpenAI SDK directly for HTTP API streaming
      const openai = new OpenAI({
        baseURL: httpSettings.baseUrl,
        apiKey: httpSettings.apiKey || "not-needed",
      });

      // For HTTP API, convert to text-only
      let textMessages = messages.map((msg) => ({
        role: msg.role as "system" | "user" | "assistant",
        content: Array.isArray(msg.content)
          ? msg.content
              .filter((part) => part.type === "text")
              .map((part) => part.text)
              .join(" ")
          : msg.content,
      }));

      // Add system prompt as system message if provided
      if (systemPrompt?.content) {
        textMessages = [
          { role: "system", content: systemPrompt.content },
          ...textMessages
        ];
      }

      const stream = await openai.chat.completions.create({
        model: httpSettings.model,
        messages: textMessages,
        temperature: httpSettings.temperature,
        stream: true,
      });

      return stream;
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    return result.textStream;
  } catch (error) {
    console.error("Error streaming chat response:", error);
    throw new Error("Failed to stream AI response");
  }
}

export async function getAvailableModels(
  userId: string,
  configurationId?: string
): Promise<string[]> {
  try {
    // Get AI configuration from database
    const { provider, settings } = await getAIConfig(userId, configurationId);

    if (provider === "ollama") {
      const ollamaSettings = settings as OllamaConfigSettings;
      // Call Ollama HTTP API directly for model listing
      const response = await fetch(
        `${ollamaSettings.serverUrl.replace("/api", "")}/api/tags`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch models");
      }
      const data = await response.json();
      return data.models?.map((model: { name: string }) => model.name) || [];
    }

    if (provider === "gemini") {
      // Return available Gemini models
      return [
        "gemini-2.5-pro",
        "gemini-2.5-flash",
        "gemini-1.5-pro",
        "gemini-1.5-flash",
        "gemini-1.0-pro",
      ];
    }

    if (provider === "http-api") {
      const httpSettings = settings as HttpApiConfigSettings;
      // For HTTP API, return the configured model since we can't list models
      return [httpSettings.model];
    }

    throw new Error(`Unsupported provider: ${provider}`);
  } catch (error) {
    console.error("Error fetching available models:", error);
    // Return default models if API call fails
    return ["llama3.2", "llama3.2:1b", "phi3", "qwen2"];
  }
}

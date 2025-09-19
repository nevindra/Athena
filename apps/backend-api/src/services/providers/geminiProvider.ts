import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { GeminiConfigSettings, SystemPrompt } from "@athena/shared";
import { generateObject, generateText, streamText } from "ai";
import { convertMessagesForGemini } from "../../utils/messageUtils";
import { buildZodSchema, formatJsonOutput, validateStructuredOutput } from "../../utils/schemaUtils";
import type { ChatMessage, AttachmentFile, StatelessFile } from "../../utils/messageUtils";

export interface GeminiResponse {
  text: string;
  finishReason?: string;
  reasoning?: any;
  usage?: any;
}

export class GeminiProvider {
  private settings: GeminiConfigSettings;
  private provider: any;

  constructor(settings: GeminiConfigSettings) {
    this.settings = settings;
    this.provider = createGoogleGenerativeAI({
      apiKey: settings.apiKey,
    });
  }

  async generateResponse(
    messages: ChatMessage[],
    systemPrompt?: SystemPrompt | null,
    attachmentFiles?: AttachmentFile[],
    files?: StatelessFile[]
  ): Promise<GeminiResponse> {
    // Convert messages specifically for Gemini format
    const convertedMessages = convertMessagesForGemini(
      messages,
      attachmentFiles,
      files
    );

    // Handle structured output prompts vs regular prompts
    if (
      systemPrompt &&
      systemPrompt.category === "Structured Output" &&
      systemPrompt.jsonSchema
    ) {
      return this.generateStructuredOutput(convertedMessages, systemPrompt);
    } else {
      return this.generateTextResponse(convertedMessages, systemPrompt);
    }
  }

  private async generateStructuredOutput(
    messages: any[],
    systemPrompt: SystemPrompt
  ): Promise<GeminiResponse> {
    if (!systemPrompt.jsonSchema) {
      throw new Error("JSON schema is required for structured output");
    }

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

Schema fields: ${systemPrompt.jsonSchema.map((field) => `${field.name} (${field.type})${field.required ? " *required*" : ""}`).join(", ")}`;

    const { object, reasoning, finishReason, usage } = await generateObject({
      model: this.provider(this.settings.model),
      messages,
      system: enhancedSystemPrompt,
      schema: zodSchema,
      temperature: 0.1, // Lower temperature for more consistent structured output
      topP: this.settings.topP,
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
    const { missingFields, extraFields } = validateStructuredOutput(
      object,
      systemPrompt.jsonSchema
    );

    if (missingFields.length > 0) {
      console.warn("Missing required fields:", missingFields);
    }
    if (extraFields.length > 0) {
      console.warn("Extra fields not in schema:", extraFields);
    }

    const text = formatJsonOutput(object);
    return { text, reasoning, finishReason, usage };
  }

  private async generateTextResponse(
    messages: any[],
    systemPrompt?: SystemPrompt | null
  ): Promise<GeminiResponse> {
    const { text, reasoning, finishReason, usage } = await generateText({
      model: this.provider(this.settings.model),
      messages,
      system: systemPrompt?.content, // Add system prompt as system instruction
      temperature: this.settings.temperature,
      topP: this.settings.topP,
      providerOptions: {
        google: {
          thinkingConfig: {
            thinkingBudget: -1, // Number of thinking tokens (0 to disable)
            includeThoughts: true, // Get thought summaries in response
          },
        },
      },
    });

    return { text, reasoning, finishReason, usage };
  }

  async streamResponse(
    messages: ChatMessage[],
    systemPrompt?: SystemPrompt | null,
    attachmentFiles?: AttachmentFile[],
    files?: StatelessFile[]
  ) {
    // Convert messages specifically for Gemini format
    const convertedMessages = convertMessagesForGemini(
      messages,
      attachmentFiles,
      files
    );

    // Note: For streaming, we only support text generation, not structured output
    const result = streamText({
      model: this.provider(this.settings.model),
      messages: convertedMessages,
      system: systemPrompt?.content, // Add system prompt as system instruction
      temperature: this.settings.temperature,
      topP: this.settings.topP,
      providerOptions: {
        google: {
          thinkingConfig: {
            thinkingBudget: 8192, // Number of thinking tokens (0 to disable)
            includeThoughts: true, // Get thought summaries in response
          },
        },
      },
    });

    return result.textStream;
  }

  async getAvailableModels(): Promise<string[]> {
    // Return available Gemini models
    return [
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "gemini-1.0-pro",
    ];
  }

  getModelName(): string {
    return this.settings.model;
  }
}
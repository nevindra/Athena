import type { AIProvider } from "@athena/shared";
import { getAIConfig, getSystemPrompt } from "./configurationService";
import { GeminiProvider } from "./providers/geminiProvider";
import { HttpApiProvider } from "./providers/httpApiProvider";
import { OllamaProvider } from "./providers/ollamaProvider";
import type {
  AttachmentFile,
  ChatMessage,
  StatelessFile,
} from "../utils/messageUtils";

export interface ChatRequest {
  messages: ChatMessage[];
  userId: string;
  configurationId?: string;
  sessionId?: string;
  systemPromptId?: string;
  files?: StatelessFile[];
  attachmentFiles?: AttachmentFile[];
}

export interface ChatResponse {
  message: string;
  finishReason: string;
  reasoning?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Helper function to create provider instances
function createProvider(provider: AIProvider, settings: any) {
  switch (provider) {
    case "gemini":
      return new GeminiProvider(settings);
    case "ollama":
      return new OllamaProvider(settings);
    case "http-api":
      return new HttpApiProvider(settings);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

export async function generateChatResponse(
  request: ChatRequest
): Promise<ChatResponse> {
  const {
    messages,
    userId,
    configurationId,
    systemPromptId,
    attachmentFiles,
    files,
  } = request;

  try {
    // Get AI configuration from database
    const { provider, settings } = await getAIConfig(userId, configurationId);

    // Get system prompt if provided
    let systemPrompt = null;
    if (systemPromptId) {
      systemPrompt = await getSystemPrompt(userId, systemPromptId);
    }

    // Create provider instance
    const providerInstance = createProvider(provider, settings);

    // Generate response using the provider
    const result = await providerInstance.generateResponse(
      messages,
      systemPrompt,
      attachmentFiles,
      files
    );

    return {
      message: result.text,
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
  const {
    messages,
    userId,
    configurationId,
    systemPromptId,
    attachmentFiles,
    files,
  } = request;

  try {
    // Get AI configuration from database
    const { provider, settings } = await getAIConfig(userId, configurationId);

    // Get system prompt if provided
    let systemPrompt = null;
    if (systemPromptId) {
      systemPrompt = await getSystemPrompt(userId, systemPromptId);
    }

    // Create provider instance
    const providerInstance = createProvider(provider, settings);

    // Stream response using the provider
    return await providerInstance.streamResponse(
      messages,
      systemPrompt,
      attachmentFiles,
      files
    );
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

    // Create provider instance
    const providerInstance = createProvider(provider, settings);

    // Get available models from the provider
    return await providerInstance.getAvailableModels();
  } catch (error) {
    console.error("Error fetching available models:", error);
    // Return default models if API call fails
    return ["llama3.2", "llama3.2:1b", "phi3", "qwen2"];
  }
}

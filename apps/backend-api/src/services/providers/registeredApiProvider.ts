import type { ApiRegistrationDB } from "../../db/schema";
import { getAIConfig } from "../configurationService";
import { GeminiProvider } from "./geminiProvider";
import { HttpApiProvider } from "./httpApiProvider";
import { OllamaProvider } from "./ollamaProvider";
import type {
  AttachmentFile,
  ChatMessage,
  StatelessFile,
} from "../../utils/messageUtils";

export interface RegisteredApiProviderResponse {
  text: string;
  finishReason?: string;
  reasoning?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export class RegisteredApiProvider {
  private registration: ApiRegistrationDB;
  private userId: string;

  constructor(registration: ApiRegistrationDB, userId: string) {
    this.registration = registration;
    this.userId = userId;
  }

  async generateResponse(
    messages: ChatMessage[],
    systemPrompt?: any,
    attachmentFiles?: AttachmentFile[],
    files?: StatelessFile[]
  ): Promise<RegisteredApiProviderResponse> {
    try {
      // Get the AI configuration for this registration
      const { provider, settings } = await getAIConfig(this.userId, this.registration.configurationId);

      // Create the appropriate provider instance
      let providerInstance: any;
      switch (provider) {
        case "gemini":
          providerInstance = new GeminiProvider(settings);
          break;
        case "ollama":
          providerInstance = new OllamaProvider(settings);
          break;
        case "http-api":
          providerInstance = new HttpApiProvider(settings);
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      // Use the provider to generate the response
      const result = await providerInstance.generateResponse(
        messages,
        systemPrompt,
        attachmentFiles,
        files
      );

      return {
        text: result.text,
        finishReason: result.finishReason || "stop",
        reasoning: result.reasoning,
        usage: result.usage,
      };
    } catch (error) {
      console.error("Registered API provider error:", error);
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async streamResponse(
    messages: ChatMessage[],
    systemPrompt?: any,
    attachmentFiles?: AttachmentFile[],
    files?: StatelessFile[]
  ): Promise<ReadableStream> {
    try {
      // Get the AI configuration for this registration
      const { provider, settings } = await getAIConfig(this.userId, this.registration.configurationId);

      // Create the appropriate provider instance
      let providerInstance: any;
      switch (provider) {
        case "gemini":
          providerInstance = new GeminiProvider(settings);
          break;
        case "ollama":
          providerInstance = new OllamaProvider(settings);
          break;
        case "http-api":
          providerInstance = new HttpApiProvider(settings);
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      // Use the provider to stream the response
      return await providerInstance.streamResponse(
        messages,
        systemPrompt,
        attachmentFiles,
        files
      );
    } catch (error) {
      console.error("Registered API provider streaming error:", error);
      throw new Error(`Failed to stream response: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      // Get the AI configuration for this registration
      const { provider, settings } = await getAIConfig(this.userId, this.registration.configurationId);

      // Create the appropriate provider instance
      let providerInstance: any;
      switch (provider) {
        case "gemini":
          providerInstance = new GeminiProvider(settings);
          break;
        case "ollama":
          providerInstance = new OllamaProvider(settings);
          break;
        case "http-api":
          providerInstance = new HttpApiProvider(settings);
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      // Use the provider to get available models
      return await providerInstance.getAvailableModels();
    } catch (error) {
      console.error("Error fetching available models:", error);
      return ["default-model"];
    }
  }
}
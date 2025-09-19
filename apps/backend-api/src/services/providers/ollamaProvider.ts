import type { OllamaConfigSettings, SystemPrompt } from "@athena/shared";
import { generateText, streamText } from "ai";
import { createOllama } from "ollama-ai-provider-v2";
import { convertMessagesToTextOnly } from "../../utils/messageUtils";
import type { ChatMessage, AttachmentFile, StatelessFile } from "../../utils/messageUtils";

export interface OllamaResponse {
  text: string;
  finishReason?: string;
  reasoning?: any;
  usage?: any;
}

export class OllamaProvider {
  private settings: OllamaConfigSettings;
  private provider: any;

  constructor(settings: OllamaConfigSettings) {
    this.settings = settings;
    this.provider = createOllama({
      baseURL: settings.serverUrl,
    });
  }

  async generateResponse(
    messages: ChatMessage[],
    systemPrompt?: SystemPrompt | null,
    _attachmentFiles?: AttachmentFile[],
    _files?: StatelessFile[]
  ): Promise<OllamaResponse> {
    // For Ollama, convert to text-only messages (no multimodal support yet)
    const textMessages = convertMessagesToTextOnly(messages);

    const result = await generateText({
      model: this.provider(this.settings.model),
      messages: textMessages,
      system: systemPrompt?.content, // Add system prompt as system instruction
      temperature: this.settings.temperature,
    });

    return {
      text: result.text,
      finishReason: result.finishReason,
      reasoning: result.reasoning,
      usage: result.usage,
    };
  }

  async streamResponse(
    messages: ChatMessage[],
    systemPrompt?: SystemPrompt | null,
    _attachmentFiles?: AttachmentFile[],
    _files?: StatelessFile[]
  ) {
    // For Ollama, convert to text-only messages
    const textMessages = convertMessagesToTextOnly(messages);

    const result = streamText({
      model: this.provider(this.settings.model),
      messages: textMessages,
      system: systemPrompt?.content, // Add system prompt as system instruction
      temperature: this.settings.temperature,
    });

    return result.textStream;
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      // Call Ollama HTTP API directly for model listing
      const response = await fetch(
        `${this.settings.serverUrl.replace("/api", "")}/api/tags`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch models from Ollama");
      }
      const data = await response.json();
      return data.models?.map((model: { name: string }) => model.name) || [];
    } catch (error) {
      console.error("Error fetching Ollama models:", error);
      // Return default models if API call fails
      return ["llama3.2", "llama3.2:1b", "phi3", "qwen2"];
    }
  }

  getModelName(): string {
    return this.settings.model;
  }
}
import type { HttpApiConfigSettings, SystemPrompt } from "@athena/shared";
import OpenAI from "openai";
import { convertMessagesToTextOnly } from "../../utils/messageUtils";
import type { ChatMessage, AttachmentFile, StatelessFile } from "../../utils/messageUtils";

export interface HttpApiResponse {
  text: string;
  finishReason?: string;
  reasoning?: any;
  usage?: any;
}

export class HttpApiProvider {
  private settings: HttpApiConfigSettings;
  private client: OpenAI;

  constructor(settings: HttpApiConfigSettings) {
    this.settings = settings;
    this.client = new OpenAI({
      baseURL: settings.baseUrl,
      apiKey: settings.apiKey || "not-needed",
    });
  }

  async generateResponse(
    messages: ChatMessage[],
    systemPrompt?: SystemPrompt | null,
    _attachmentFiles?: AttachmentFile[],
    _files?: StatelessFile[]
  ): Promise<HttpApiResponse> {
    // For HTTP API, convert to text-only messages
    let textMessages = convertMessagesToTextOnly(messages).map((msg) => ({
      role: msg.role as "system" | "user" | "assistant",
      content: msg.content,
    }));

    // Add system prompt as system message if provided
    if (systemPrompt?.content) {
      textMessages = [
        { role: "system", content: systemPrompt.content },
        ...textMessages,
      ];
    }

    const response = await this.client.chat.completions.create({
      model: this.settings.model,
      messages: textMessages,
      temperature: this.settings.temperature,
    });

    return {
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
  }

  async streamResponse(
    messages: ChatMessage[],
    systemPrompt?: SystemPrompt | null,
    _attachmentFiles?: AttachmentFile[],
    _files?: StatelessFile[]
  ) {
    // For HTTP API, convert to text-only messages
    let textMessages = convertMessagesToTextOnly(messages).map((msg) => ({
      role: msg.role as "system" | "user" | "assistant",
      content: msg.content,
    }));

    // Add system prompt as system message if provided
    if (systemPrompt?.content) {
      textMessages = [
        { role: "system", content: systemPrompt.content },
        ...textMessages,
      ];
    }

    const stream = await this.client.chat.completions.create({
      model: this.settings.model,
      messages: textMessages,
      temperature: this.settings.temperature,
      stream: true,
    });

    return stream;
  }

  async getAvailableModels(): Promise<string[]> {
    // For HTTP API, return the configured model since we can't list models generically
    return [this.settings.model];
  }

  getModelName(): string {
    return this.settings.model;
  }
}
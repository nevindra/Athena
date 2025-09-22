import type { AIProvider } from "@athena/shared";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { apiRegistrations } from "../db/schema";
import { getAIConfig, getSystemPrompt } from "./configurationService";
import { encryptionService } from "./encryptionService";
import { GeminiProvider } from "./providers/geminiProvider";
import { HttpApiProvider } from "./providers/httpApiProvider";
import { OllamaProvider } from "./providers/ollamaProvider";
import { RegisteredApiProvider } from "./providers/registeredApiProvider";
import type {
  AttachmentFile,
  ChatMessage,
  StatelessFile,
} from "../utils/messageUtils";

export interface ChatRequest {
  messages: ChatMessage[];
  userId: string;
  configurationId?: string;
  apiRegistrationId?: string;
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

interface ProviderCacheKey {
  provider: AIProvider;
  userId: string;
  configurationId?: string;
  apiRegistrationId?: string;
}

class ProviderCache {
  private cache = new Map<string, any>();
  private readonly maxSize = 100;
  private readonly ttl = 5 * 60 * 1000; // 5 minutes

  private createKey(key: ProviderCacheKey): string {
    return `${key.provider}:${key.userId}:${key.configurationId || 'default'}:${key.apiRegistrationId || 'none'}`;
  }

  get(key: ProviderCacheKey): any {
    const cacheKey = this.createKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.provider;
  }

  set(key: ProviderCacheKey, provider: any): void {
    const cacheKey = this.createKey(key);

    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(cacheKey, {
      provider,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

const providerCache = new ProviderCache();

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

async function getOrCreateProvider(
  userId: string,
  configurationId?: string,
  apiRegistrationId?: string
): Promise<any> {
  if (apiRegistrationId) {
    const cacheKey: ProviderCacheKey = {
      provider: "http-api",
      userId,
      apiRegistrationId,
    };

    let cachedProvider = providerCache.get(cacheKey);
    if (cachedProvider) {
      return cachedProvider;
    }

    const registration = await db.query.apiRegistrations.findFirst({
      where: and(
        eq(apiRegistrations.id, apiRegistrationId),
        eq(apiRegistrations.userId, userId),
        eq(apiRegistrations.isActive, true)
      ),
    });

    if (!registration) {
      throw new Error("API registration not found or inactive");
    }

    const decryptedApiKey = registration.apiKey
      ? encryptionService.decrypt(registration.apiKey)
      : undefined;

    const provider = new RegisteredApiProvider(registration, decryptedApiKey);
    providerCache.set(cacheKey, provider);
    return provider;
  } else {
    const { provider: providerType, settings } = await getAIConfig(userId, configurationId);

    const cacheKey: ProviderCacheKey = {
      provider: providerType,
      userId,
      configurationId,
    };

    let cachedProvider = providerCache.get(cacheKey);
    if (cachedProvider) {
      return cachedProvider;
    }

    const provider = createProvider(providerType, settings);
    providerCache.set(cacheKey, provider);
    return provider;
  }
}

export async function generateChatResponse(
  request: ChatRequest
): Promise<ChatResponse> {
  const {
    messages,
    userId,
    configurationId,
    apiRegistrationId,
    systemPromptId,
    attachmentFiles,
    files,
  } = request;

  try {
    const [systemPrompt, providerInstance] = await Promise.all([
      systemPromptId ? getSystemPrompt(userId, systemPromptId) : null,
      getOrCreateProvider(userId, configurationId, apiRegistrationId),
    ]);

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
    apiRegistrationId,
    systemPromptId,
    attachmentFiles,
    files,
  } = request;

  try {
    const [systemPrompt, providerInstance] = await Promise.all([
      systemPromptId ? getSystemPrompt(userId, systemPromptId) : null,
      getOrCreateProvider(userId, configurationId, apiRegistrationId),
    ]);

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
  configurationId?: string,
  apiRegistrationId?: string
): Promise<string[]> {
  try {
    const providerInstance = await getOrCreateProvider(userId, configurationId, apiRegistrationId);
    return await providerInstance.getAvailableModels();
  } catch (error) {
    console.error("Error fetching available models:", error);
    return ["llama3.2", "llama3.2:1b", "phi3", "qwen2"];
  }
}

export type AIProvider = "gemini" | "ollama" | "http-api";

export interface BaseAIConfig {
  id: string;
  userId: string;
  name: string;
  provider: AIProvider;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeminiConfigSettings {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  topK: number;
}

export interface OllamaConfigSettings {
  serverUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  topK: number;
  numCtx: number;
}

export interface HttpApiConfigSettings {
  baseUrl: string;
  apiKey?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  presencePenalty: number;
  frequencyPenalty: number;
  headers: Record<string, string>;
  authType: "bearer" | "api-key" | "custom" | "none";
  streamResponse: boolean;
}

export interface GeminiConfig extends BaseAIConfig {
  provider: "gemini";
  settings: GeminiConfigSettings;
}

export interface OllamaConfig extends BaseAIConfig {
  provider: "ollama";
  settings: OllamaConfigSettings;
}

export interface HttpApiConfig extends BaseAIConfig {
  provider: "http-api";
  settings: HttpApiConfigSettings;
}

export type AIConfiguration = GeminiConfig | OllamaConfig | HttpApiConfig;

export type AIConfigSettings =
  | GeminiConfigSettings
  | OllamaConfigSettings
  | HttpApiConfigSettings;

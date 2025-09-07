import type {
  GeminiConfigSettings,
  HttpApiConfigSettings,
  OllamaConfigSettings,
} from "@athena/shared";

export type ProviderType = "gemini" | "http-api" | "ollama";

export interface SliderOptions {
  min: number;
  max: number;
  step: number;
}

export interface SelectOption {
  value: string;
  label: string;
  badge?: string;
}

export interface ConditionalLogic {
  field: string;
  operator: "equals" | "not_equals" | "in" | "not_in";
  value: string | string[];
}

export interface FieldDefinition {
  key: string;
  label: string;
  type:
  | "text"
  | "password"
  | "url"
  | "select"
  | "slider"
  | "headers"
  | "textarea"
  | "checkbox";
  required?: boolean;
  placeholder?: string;
  description?: string;
  options?: SelectOption[] | SliderOptions;
  conditional?: ConditionalLogic;
  visibilityToggle?: boolean; // For password fields
}

export interface SpecialSection {
  type: "quick-setup" | "installation-guide" | "model-params";
  title?: string;
  props?: Record<string, unknown>;
}

export interface ProviderDefinition {
  name: string;
  displayName: string;
  fields: FieldDefinition[];
  defaultValues: Record<string, unknown>;
  specialSections: SpecialSection[];
  validation: {
    required: string[];
    custom?: (data: Record<string, unknown>) => string | null;
  };
}

const geminiProvider: ProviderDefinition = {
  name: "gemini",
  displayName: "Google Gemini",
  fields: [
    {
      key: "name",
      label: "Configuration Name",
      type: "text",
      required: true,
      placeholder: "e.g., 'My Gemini Pro Config'",
      description: "A friendly name to identify this configuration",
    },
    {
      key: "apiKey",
      label: "API Key",
      type: "password",
      required: true,
      placeholder: "Enter your Google Gemini API key",
      description:
        'Get your API key from the <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" class="underline hover:text-foreground">Google AI Studio</a>',
      visibilityToggle: true,
    },
    {
      key: "model",
      label: "Model",
      type: "select",
      options: [
        { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
        { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
        { value: "gemini-1.0-pro", label: "Gemini 1.0 Pro" },
      ],
    },
    {
      key: "temperature",
      label: "Temperature",
      type: "slider",
      description: "Higher values = more creative, lower = more focused",
      options: { min: 0, max: 2, step: 0.1 },
    },
    {
      key: "maxTokens",
      label: "Max Tokens",
      type: "slider",
      description: "Maximum response length in tokens",
      options: { min: 1, max: 8192, step: 1 },
    },
    {
      key: "topP",
      label: "Top-p",
      type: "slider",
      description: "Nucleus sampling - controls word choice diversity",
      options: { min: 0, max: 1, step: 0.1 },
    },
    {
      key: "topK",
      label: "Top-k",
      type: "slider",
      description:
        "Limits the number of highest probability tokens to consider for each step.",
      options: { min: 1, max: 100, step: 1 },
    },
    {
      key: "streamResponse",
      label: "Stream Response",
      type: "select",
      description: "Enable real-time streaming for immediate response feedback",
      options: [
        { value: "true", label: "Enabled" },
        { value: "false", label: "Disabled" },
      ],
    },
  ],
  defaultValues: {
    name: "",
    apiKey: "",
    model: "gemini-1.5-pro",
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.9,
    topK: 40,
    streamResponse: "true",
  },
  specialSections: [],
  validation: {
    required: ["name", "apiKey"],
  },
};

const httpApiProvider: ProviderDefinition = {
  name: "http-api",
  displayName: "HTTP API",
  fields: [
    {
      key: "name",
      label: "Configuration Name",
      type: "text",
      required: true,
      placeholder: "e.g., 'OpenAI API Config'",
      description: "A friendly name to identify this configuration",
    },
    {
      key: "baseUrl",
      label: "Base URL",
      type: "url",
      required: true,
      placeholder: "https://api.openai.com/v1",
      description:
        "The base URL for your API endpoint (without trailing slash)",
    },
    {
      key: "authType",
      label: "Authentication Type",
      type: "select",
      options: [
        { value: "bearer", label: "Bearer Token" },
        { value: "api-key", label: "API Key Header" },
        { value: "custom", label: "Custom Headers" },
        { value: "none", label: "No Authentication" },
      ],
    },
    {
      key: "apiKey",
      label: "API Key / Token",
      type: "password",
      placeholder: "Enter your API key or bearer token",
      visibilityToggle: true,
      conditional: {
        field: "authType",
        operator: "not_in",
        value: ["custom", "none"],
      },
    },
    {
      key: "model",
      label: "Model",
      type: "text",
      required: true,
      placeholder: "gpt-3.5-turbo",
      description: "The model identifier to use for requests",
    },
    {
      key: "headers",
      label: "Custom Headers",
      type: "headers",
      conditional: {
        field: "authType",
        operator: "equals",
        value: "custom",
      },
    },
    {
      key: "temperature",
      label: "Temperature",
      type: "slider",
      description: "Higher values = more creative, lower = more focused",
      options: { min: 0, max: 2, step: 0.1 },
    },
    {
      key: "maxTokens",
      label: "Max Tokens",
      type: "slider",
      description: "Maximum response length in tokens",
      options: { min: 1, max: 8192, step: 1 },
    },
    {
      key: "topP",
      label: "Top-p",
      type: "slider",
      description: "Nucleus sampling - controls word choice diversity",
      options: { min: 0, max: 1, step: 0.1 },
    },
    {
      key: "presencePenalty",
      label: "Presence Penalty",
      type: "slider",
      description: "Penalize topics that appear in the text",
      options: { min: -2, max: 2, step: 0.1 },
    },
    {
      key: "frequencyPenalty",
      label: "Frequency Penalty",
      type: "slider",
      description: "Penalize words that repeat frequently",
      options: { min: -2, max: 2, step: 0.1 },
    },
    {
      key: "streamResponse",
      label: "Stream Response",
      type: "select",
      description: "Enable real-time streaming for immediate response feedback",
      options: [
        { value: "true", label: "Enabled" },
        { value: "false", label: "Disabled" },
      ],
    },
  ],
  defaultValues: {
    name: "",
    baseUrl: "",
    apiKey: "",
    model: "gpt-3.5-turbo",
    temperature: 0.7,
    maxTokens: 2048,
    topP: 1.0,
    presencePenalty: 0,
    frequencyPenalty: 0,
    headers: {},
    authType: "bearer",
    streamResponse: "true",
  },
  specialSections: [{ type: "quick-setup" }],
  validation: {
    required: ["name", "baseUrl", "model"],
    custom: (data) => {
      if (
        data.authType !== "custom" &&
        data.authType !== "none" &&
        !(data.apiKey as string)?.trim?.()
      ) {
        return "Please enter your API key or token";
      }
      return null;
    },
  },
};

const ollamaProvider: ProviderDefinition = {
  name: "ollama",
  displayName: "Ollama",
  fields: [
    {
      key: "name",
      label: "Configuration Name",
      type: "text",
      required: true,
      placeholder: "e.g., 'Local Ollama Setup'",
      description: "A friendly name to identify this configuration",
    },
    {
      key: "serverUrl",
      label: "Server URL",
      type: "url",
      required: true,
      placeholder: "http://localhost:11434",
      description:
        "The URL where your Ollama server is running. Default is http://localhost:11434",
    },
    {
      key: "model",
      label: "Model",
      type: "select",
      required: true,
      options: [
        { value: "llama3.2:3b", label: "llama3.2:3b", badge: "Popular" },
        { value: "llama3.2:1b", label: "llama3.2:1b", badge: "Popular" },
        { value: "llama3.1:8b", label: "llama3.1:8b", badge: "Popular" },
        { value: "mistral:7b", label: "mistral:7b", badge: "Popular" },
        { value: "codellama:7b", label: "codellama:7b", badge: "Popular" },
        { value: "phi3:mini", label: "phi3:mini", badge: "Popular" },
        { value: "gemma2:9b", label: "gemma2:9b", badge: "Popular" },
        { value: "qwen2.5:7b", label: "qwen2.5:7b", badge: "Popular" },
      ],
      description:
        "Select a model from your local Ollama installation or choose a popular model to pull.",
    },
    {
      key: "temperature",
      label: "Temperature",
      type: "slider",
      description:
        "Controls randomness. Lower values make responses more focused and deterministic.",
      options: { min: 0, max: 2, step: 0.1 },
    },
    {
      key: "maxTokens",
      label: "Max Tokens",
      type: "slider",
      description: "Maximum number of tokens to generate in the response.",
      options: { min: 1, max: 8192, step: 1 },
    },
    {
      key: "topP",
      label: "Top-p",
      type: "slider",
      description:
        "Nucleus sampling. Only tokens with cumulative probability up to this value are considered.",
      options: { min: 0, max: 1, step: 0.1 },
    },
    {
      key: "topK",
      label: "Top-k",
      type: "slider",
      description:
        "Limits the number of highest probability tokens to consider for each step.",
      options: { min: 1, max: 100, step: 1 },
    },
    {
      key: "numCtx",
      label: "Context Length (num_ctx)",
      type: "slider",
      description:
        "Sets the size of the context window used to generate responses.",
      options: { min: 1024, max: 32768, step: 512 },
    },
  ],
  defaultValues: {
    name: "",
    serverUrl: "http://localhost:11434",
    model: "",
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.9,
    topK: 40,
    numCtx: 4096,
  },
  specialSections: [{ type: "installation-guide" }],
  validation: {
    required: ["name", "serverUrl", "model"],
  },
};

export const PROVIDER_DEFINITIONS: Record<ProviderType, ProviderDefinition> = {
  gemini: geminiProvider,
  "http-api": httpApiProvider,
  ollama: ollamaProvider,
};

export const getProviderDefinition = (
  provider: ProviderType
): ProviderDefinition => {
  return PROVIDER_DEFINITIONS[provider];
};

// Helper function to prepare settings for API based on provider
export const prepareSettingsForApi = (
  provider: ProviderType,
  data: Record<string, unknown>
): GeminiConfigSettings | HttpApiConfigSettings | OllamaConfigSettings => {
  const { name: _name, ...settings } = data;

  switch (provider) {
    case "gemini": {
      const settingsTyped = settings as Record<string, unknown>;
      return {
        ...settingsTyped,
        temperature:
          typeof settingsTyped.temperature === "string"
            ? Number.parseFloat(settingsTyped.temperature) || 0.7
            : settingsTyped.temperature,
        maxTokens:
          typeof settingsTyped.maxTokens === "string"
            ? Number.parseInt(settingsTyped.maxTokens, 10) || 2048
            : settingsTyped.maxTokens,
        topP:
          typeof settingsTyped.topP === "string"
            ? Number.parseFloat(settingsTyped.topP) || 0.9
            : settingsTyped.topP,
      } as GeminiConfigSettings;
    }

    case "http-api": {
      const settingsTyped = settings as Record<string, unknown>;
      const baseSettings = {
        ...settingsTyped,
        temperature:
          typeof settingsTyped.temperature === "string"
            ? Number.parseFloat(settingsTyped.temperature) || 0.7
            : settingsTyped.temperature,
        maxTokens:
          typeof settingsTyped.maxTokens === "string"
            ? Number.parseInt(settingsTyped.maxTokens, 10) || 2048
            : settingsTyped.maxTokens,
        topP:
          typeof settingsTyped.topP === "string"
            ? Number.parseFloat(settingsTyped.topP) || 1.0
            : settingsTyped.topP,
        presencePenalty:
          typeof settingsTyped.presencePenalty === "string"
            ? Number.parseFloat(settingsTyped.presencePenalty) || 0
            : settingsTyped.presencePenalty,
        frequencyPenalty:
          typeof settingsTyped.frequencyPenalty === "string"
            ? Number.parseFloat(settingsTyped.frequencyPenalty) || 0
            : settingsTyped.frequencyPenalty,
      };

      // Handle API key based on auth type
      if (
        settingsTyped.authType === "none" ||
        settingsTyped.authType === "custom" ||
        !(settingsTyped.apiKey as string)?.trim?.()
      ) {
        const { _, ...preparedSettings } = baseSettings as Record<
          string,
          unknown
        >;
        return preparedSettings as HttpApiConfigSettings;
      }

      return baseSettings as HttpApiConfigSettings;
    }

    case "ollama": {
      return settings as unknown as OllamaConfigSettings;
    }

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
};

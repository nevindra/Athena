import { z } from "zod";

export const aiProviderSchema = z.enum(["gemini", "ollama", "http-api"]);

export const geminiConfigSettingsSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  model: z.string().min(1, "Model is required"),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(1).max(32768),
  topP: z.number().min(0).max(1),
  topK: z.number().min(1).max(100),
});

export const ollamaConfigSettingsSchema = z.object({
  serverUrl: z.string().url("Invalid server URL"),
  model: z.string().min(1, "Model is required"),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(1).max(32768),
  topP: z.number().min(0).max(1),
  topK: z.number().min(1).max(100),
  numCtx: z.number().min(1024).max(32768),
});

export const httpApiConfigSettingsSchema = z.object({
  baseUrl: z.string().url("Invalid base URL"),
  apiKey: z.string().optional(),
  model: z.string().min(1, "Model is required"),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(1).max(32768),
  topP: z.number().min(0).max(1),
  presencePenalty: z.number().min(-2).max(2),
  frequencyPenalty: z.number().min(-2).max(2),
  headers: z.record(z.string()).default({}),
  authType: z.enum(["bearer", "api-key", "custom", "none"]),
  streamResponse: z.boolean().default(true),
});

export const createConfigRequestSchema = z
  .object({
    name: z.string().min(1, "Configuration name is required").max(100),
    provider: aiProviderSchema,
    settings: z.any(), // Will be validated based on provider
    isActive: z.boolean().optional().default(true),
  })
  .refine(
    (data) => {
      switch (data.provider) {
        case "gemini":
          return geminiConfigSettingsSchema.safeParse(data.settings).success;
        case "ollama":
          return ollamaConfigSettingsSchema.safeParse(data.settings).success;
        case "http-api":
          return httpApiConfigSettingsSchema.safeParse(data.settings).success;
        default:
          return false;
      }
    },
    {
      message: "Invalid settings for the selected provider",
      path: ["settings"],
    }
  );

export const updateConfigRequestSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    settings: z.any().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (!data.settings) return true;

      // Note: We need the provider to validate settings properly
      // This will be handled in the API layer where we have access to the existing config
      return true;
    },
    {
      message: "Invalid settings for the provider",
      path: ["settings"],
    }
  );

export const testConnectionRequestSchema = z
  .object({
    provider: aiProviderSchema,
    settings: z.any(),
  })
  .refine(
    (data) => {
      switch (data.provider) {
        case "gemini":
          return geminiConfigSettingsSchema.safeParse(data.settings).success;
        case "ollama":
          return ollamaConfigSettingsSchema.safeParse(data.settings).success;
        case "http-api":
          return httpApiConfigSettingsSchema.safeParse(data.settings).success;
        default:
          return false;
      }
    },
    {
      message: "Invalid settings for the selected provider",
      path: ["settings"],
    }
  );

export function validateSettingsForProvider(
  provider: string,
  settings: any
): boolean {
  switch (provider) {
    case "gemini":
      return geminiConfigSettingsSchema.safeParse(settings).success;
    case "ollama":
      return ollamaConfigSettingsSchema.safeParse(settings).success;
    case "http-api":
      return httpApiConfigSettingsSchema.safeParse(settings).success;
    default:
      return false;
  }
}

export function getSettingsSchemaForProvider(provider: string) {
  switch (provider) {
    case "gemini":
      return geminiConfigSettingsSchema;
    case "ollama":
      return ollamaConfigSettingsSchema;
    case "http-api":
      return httpApiConfigSettingsSchema;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

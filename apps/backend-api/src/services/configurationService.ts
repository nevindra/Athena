import type {
  AIProvider,
  GeminiConfigSettings,
  HttpApiConfigSettings,
  OllamaConfigSettings,
  SystemPrompt
} from "@athena/shared";
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { aiConfigurations, systemPrompts } from "../db/schema";
import { encryptionService } from "./encryptionService";

export async function getSystemPrompt(
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

export async function getAIConfig(
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
    if (configurationId) {
      throw new Error(`AI configuration with ID '${configurationId}' not found or inactive for user`);
    } else {
      throw new Error("No active AI configuration found for user. Please create and activate an AI configuration in the Models Hub.");
    }
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
    decryptedSettings = await encryptionService.decryptSensitiveFields(
      provider,
      parsedSettings
    );
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
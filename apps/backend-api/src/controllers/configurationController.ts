import type {
  AIConfiguration,
  ApiResponse,
  CreateConfigRequest,
  TestConnectionRequest,
  UpdateConfigRequest
} from "@athena/shared";
import { and, eq } from "drizzle-orm";
import { ulid } from "ulid";
import { db } from "../config/database";
import { aiConfigurations, users } from "../db/schema";
import { encryptionService } from "../services/encryptionService";

export class ConfigurationController {
  // Get all configurations for a user
  async getConfigurations(
    userId: string
  ): Promise<ApiResponse<AIConfiguration[]>> {
    try {
      const configs = await db
        .select()
        .from(aiConfigurations)
        .where(eq(aiConfigurations.userId, userId))
        .orderBy(aiConfigurations.createdAt);

      const decryptedConfigs: AIConfiguration[] = [];

      for (const config of configs) {
        const decryptedSettings =
          await encryptionService.decryptSensitiveFields(
            config.provider,
            config.settings
          );

        decryptedConfigs.push({
          id: config.id,
          userId: config.userId,
          name: config.name,
          provider: config.provider,
          settings: decryptedSettings,
          isActive: config.isActive,
          createdAt: config.createdAt,
          updatedAt: config.updatedAt,
        } as AIConfiguration);
      }

      return {
        success: true,
        data: decryptedConfigs,
      };
    } catch (error) {
      console.error("Failed to get configurations:", error);
      return {
        success: false,
        error: "Failed to retrieve configurations",
      };
    }
  }

  // Get a specific configuration by ID
  async getConfiguration(
    userId: string,
    configId: string
  ): Promise<ApiResponse<AIConfiguration>> {
    try {
      const config = await db
        .select()
        .from(aiConfigurations)
        .where(
          and(
            eq(aiConfigurations.id, configId),
            eq(aiConfigurations.userId, userId)
          )
        )
        .limit(1);

      if (config.length === 0) {
        return {
          success: false,
          error: "Configuration not found",
        };
      }

      const decryptedSettings = await encryptionService.decryptSensitiveFields(
        config[0].provider,
        config[0].settings
      );

      const result: AIConfiguration = {
        id: config[0].id,
        userId: config[0].userId,
        name: config[0].name,
        provider: config[0].provider,
        settings: decryptedSettings,
        isActive: config[0].isActive,
        createdAt: config[0].createdAt,
        updatedAt: config[0].updatedAt,
      } as AIConfiguration;

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("Failed to get configuration:", error);
      return {
        success: false,
        error: "Failed to retrieve configuration",
      };
    }
  }

  // Create a new configuration
  async createConfiguration(
    userId: string,
    request: CreateConfigRequest
  ): Promise<ApiResponse<AIConfiguration>> {
    try {
      // Encrypt sensitive fields
      const encryptedSettings = await encryptionService.encryptSensitiveFields(
        request.provider,
        request.settings
      );

      const newConfig = {
        id: ulid(),
        userId,
        name: request.name,
        provider: request.provider,
        settings: encryptedSettings,
        isActive: request.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(aiConfigurations).values(newConfig);

      // Return with decrypted settings
      const result: AIConfiguration = {
        ...newConfig,
        settings: request.settings, // Return original unencrypted settings
      } as AIConfiguration;

      return {
        success: true,
        data: result,
        message: "Configuration created successfully",
      };
    } catch (error) {
      console.error("Failed to create configuration:", error);
      return {
        success: false,
        error: "Failed to create configuration",
      };
    }
  }

  // Update an existing configuration
  async updateConfiguration(
    userId: string,
    configId: string,
    request: UpdateConfigRequest
  ): Promise<ApiResponse<AIConfiguration>> {
    try {
      // First, get the existing configuration
      const existing = await db
        .select()
        .from(aiConfigurations)
        .where(
          and(
            eq(aiConfigurations.id, configId),
            eq(aiConfigurations.userId, userId)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        return {
          success: false,
          error: "Configuration not found",
        };
      }

      const existingConfig = existing[0];

      // Prepare update data
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (request.name !== undefined) {
        updateData.name = request.name;
      }

      if (request.isActive !== undefined) {
        updateData.isActive = request.isActive;
      }

      if (request.settings !== undefined) {
        // Encrypt sensitive fields in the new settings
        updateData.settings = await encryptionService.encryptSensitiveFields(
          existingConfig.provider,
          request.settings
        );
      }

      // Update the configuration
      await db
        .update(aiConfigurations)
        .set(updateData)
        .where(
          and(
            eq(aiConfigurations.id, configId),
            eq(aiConfigurations.userId, userId)
          )
        );

      // Get the updated configuration
      const getResult = await this.getConfiguration(userId, configId);

      return {
        success: true,
        data: getResult.data,
        message: "Configuration updated successfully",
      };
    } catch (error) {
      console.error("Failed to update configuration:", error);
      return {
        success: false,
        error: "Failed to update configuration",
      };
    }
  }

  // Delete a configuration
  async deleteConfiguration(
    userId: string,
    configId: string
  ): Promise<ApiResponse<null>> {
    try {
      // First, check if the configuration exists and belongs to the user
      const existingConfig = await db
        .select()
        .from(aiConfigurations)
        .where(
          and(
            eq(aiConfigurations.id, configId),
            eq(aiConfigurations.userId, userId)
          )
        )
        .limit(1);

      if (existingConfig.length === 0) {
        return {
          success: false,
          error:
            "Configuration not found or you don't have permission to delete it",
        };
      }

      // Delete the configuration (cascade should handle related chat sessions)
      await db
        .delete(aiConfigurations)
        .where(
          and(
            eq(aiConfigurations.id, configId),
            eq(aiConfigurations.userId, userId)
          )
        );

      return {
        success: true,
        data: null,
        message: "Configuration deleted successfully",
      };
    } catch (error) {
      console.error("Failed to delete configuration:", error);

      // Provide more specific error messages based on error type
      if (error instanceof Error) {
        const errorMessage = error.message || "";

        // Check for common database constraint errors
        if (
          errorMessage.includes("foreign key constraint") ||
          errorMessage.includes("violates foreign key")
        ) {
          return {
            success: false,
            error:
              "Cannot delete configuration: it is being used by existing chat sessions",
          };
        }

        if (
          errorMessage.includes("permission denied") ||
          errorMessage.includes("access denied")
        ) {
          return {
            success: false,
            error: "Permission denied: you cannot delete this configuration",
          };
        }

        return {
          success: false,
          error: `Failed to delete configuration: ${errorMessage}`,
        };
      }

      return {
        success: false,
        error: "Failed to delete configuration: Unknown error",
      };
    }
  }

  // Test connection for a configuration
  async testConnection(request: TestConnectionRequest): Promise<
    ApiResponse<{
      success: boolean;
      latency?: number;
      model?: string;
      error?: string;
    }>
  > {
    try {
      // This is a mock implementation - in a real app, you would make actual API calls
      const { provider, settings } = request;

      // Simulate API call delay
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 1000)
      );

      // Mock success/failure based on provider
      const success = Math.random() > 0.2; // 80% success rate for demo

      if (!success) {
        return {
          success: false,
          error: `Failed to connect to ${provider} API`,
          data: {
            success: false,
            error: "Connection timeout or invalid credentials",
          },
        };
      }

      // Mock different responses based on provider
      let mockData: {
        success: boolean;
        latency?: number;
        model?: string;
        error?: string;
      } = { success: true };

      switch (provider) {
        case "gemini":
          mockData = {
            success: true,
            latency: Math.floor(200 + Math.random() * 300),
            model: settings.model || "gemini-1.5-pro",
          };
          break;

        case "ollama":
          mockData = {
            success: true,
            latency: Math.floor(50 + Math.random() * 100),
            model: settings.model || "llama3.2:3b",
          };
          break;

        case "http-api":
          mockData = {
            success: true,
            latency: Math.floor(100 + Math.random() * 400),
            model: settings.model || "gpt-3.5-turbo",
          };
          break;
      }

      return {
        success: true,
        data: mockData,
        message: "Connection test successful",
      };
    } catch (error) {
      console.error("Failed to test connection:", error);
      return {
        success: false,
        error: "Failed to test connection",
        data: {
          success: false,
          error: "Internal server error",
        },
      };
    }
  }

  // Ensure a user exists (simple user management for demo)
  async ensureUser(userId: string): Promise<void> {
    try {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (existingUser.length === 0) {
        await db.insert(users).values({
          id: userId, // Use provided userId (should be ULID format)
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error("Failed to ensure user exists:", error);
      // Don't throw here, as this is just for demo purposes
    }
  }
}

export const configurationController = new ConfigurationController();

import {
  createConfigRequestSchema,
  testConnectionRequestSchema,
  updateConfigRequestSchema,
  validateSettingsForProvider,
} from "@athena/shared";
import { Elysia, t } from "elysia";
import { configurationController } from "../controllers/configurationController";

export const configurationsRoutes = new Elysia({ prefix: "/configurations" })
  // Get all configurations for a user
  .get(
    "/",
    async ({ query }) => {
      const userId = query.userId;

      if (!userId) {
        return {
          success: false,
          error: "User ID is required",
        };
      }

      await configurationController.ensureUser(userId);
      return configurationController.getConfigurations(userId);
    },
    {
      query: t.Object({
        userId: t.String(),
      }),
    }
  )

  // Get specific configuration
  .get(
    "/:id",
    async ({ params, query }) => {
      const userId = query.userId;
      const configId = params.id;

      if (!userId) {
        return {
          success: false,
          error: "User ID is required",
        };
      }

      return configurationController.getConfiguration(userId, configId);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        userId: t.String(),
      }),
    }
  )

  // Create new configuration
  .post(
    "/",
    async ({ body, query }) => {
      const userId = query.userId;

      if (!userId) {
        return {
          success: false,
          error: "User ID is required",
        };
      }

      // Validate request body
      const validation = createConfigRequestSchema.safeParse(body);
      if (!validation.success) {
        return {
          success: false,
          error: "Invalid request data",
          details: validation.error.issues,
        };
      }

      // Additional validation for provider-specific settings
      if (
        !validateSettingsForProvider(
          validation.data.provider,
          validation.data.settings
        )
      ) {
        return {
          success: false,
          error: `Invalid settings for provider: ${validation.data.provider}`,
        };
      }

      await configurationController.ensureUser(userId);
      return configurationController.createConfiguration(
        userId,
        validation.data
      );
    },
    {
      body: t.Object({
        name: t.String(),
        provider: t.Union([
          t.Literal("gemini"),
          t.Literal("ollama"),
          t.Literal("http-api"),
        ]),
        settings: t.Any(),
        isActive: t.Optional(t.Boolean()),
      }),
      query: t.Object({
        userId: t.String(),
      }),
    }
  )

  // Update configuration
  .put(
    "/:id",
    async ({ params, body, query }) => {
      const userId = query.userId as string;
      const configId = params.id;

      if (!userId) {
        return {
          success: false,
          error: "User ID is required",
        };
      }

      // Validate request body
      const validation = updateConfigRequestSchema.safeParse(body);
      if (!validation.success) {
        return {
          success: false,
          error: "Invalid request data",
          details: validation.error.issues,
        };
      }

      // If settings are being updated, we need to validate them against the provider
      // We'll get the provider from the existing configuration in the controller

      return configurationController.updateConfiguration(
        userId,
        configId,
        validation.data
      );
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.Optional(t.String()),
        settings: t.Optional(t.Any()),
        isActive: t.Optional(t.Boolean()),
      }),
      query: t.Object({
        userId: t.String(),
      }),
    }
  )

  // Delete configuration
  .delete(
    "/:id",
    async ({ params, query }) => {
      const userId = query.userId as string;
      const configId = params.id;

      if (!userId) {
        return {
          success: false,
          error: "User ID is required",
        };
      }

      return configurationController.deleteConfiguration(userId, configId);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        userId: t.String(),
      }),
    }
  )

  // Test connection
  .post(
    "/test",
    async ({ body }) => {
      // Validate request body
      const validation = testConnectionRequestSchema.safeParse(body);
      if (!validation.success) {
        return {
          success: false,
          error: "Invalid request data",
          details: validation.error.issues,
        };
      }

      // Additional validation for provider-specific settings
      if (
        !validateSettingsForProvider(
          validation.data.provider,
          validation.data.settings
        )
      ) {
        return {
          success: false,
          error: `Invalid settings for provider: ${validation.data.provider}`,
        };
      }

      return configurationController.testConnection(validation.data);
    },
    {
      body: t.Object({
        provider: t.Union([
          t.Literal("gemini"),
          t.Literal("ollama"),
          t.Literal("http-api"),
        ]),
        settings: t.Any(),
      }),
    }
  );

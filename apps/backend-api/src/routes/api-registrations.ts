import {
  createApiRegistrationRequestSchema,
  updateApiRegistrationRequestSchema,
} from "@athena/shared";
import { Elysia, t } from "elysia";
import { apiRegistrationController } from "../controllers/apiRegistrationController";

export const apiRegistrationsRoutes = new Elysia({ prefix: "/api-registrations" })
  // Get all API registrations for a user
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

      await apiRegistrationController.ensureUser(userId);
      return apiRegistrationController.getApiRegistrations(userId);
    },
    {
      query: t.Object({
        userId: t.String(),
      }),
    }
  )

  // Get specific API registration
  .get(
    "/:id",
    async ({ params, query }) => {
      const userId = query.userId;
      const registrationId = params.id;

      if (!userId) {
        return {
          success: false,
          error: "User ID is required",
        };
      }

      return apiRegistrationController.getApiRegistration(userId, registrationId);
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

  // Create new API registration
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
      const validation = createApiRegistrationRequestSchema.safeParse(body);
      if (!validation.success) {
        return {
          success: false,
          error: "Invalid request data",
          details: validation.error.issues,
        };
      }

      await apiRegistrationController.ensureUser(userId);
      return apiRegistrationController.createApiRegistration(userId, validation.data);
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
        configurationId: t.String(),
        systemPromptId: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
      }),
      query: t.Object({
        userId: t.String(),
      }),
    }
  )

  // Update API registration
  .put(
    "/:id",
    async ({ params, body, query }) => {
      const userId = query.userId as string;
      const registrationId = params.id;

      if (!userId) {
        return {
          success: false,
          error: "User ID is required",
        };
      }

      // Validate request body
      const validation = updateApiRegistrationRequestSchema.safeParse(body);
      if (!validation.success) {
        return {
          success: false,
          error: "Invalid request data",
          details: validation.error.issues,
        };
      }

      return apiRegistrationController.updateApiRegistration(
        userId,
        registrationId,
        validation.data
      );
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        configurationId: t.Optional(t.String()),
        systemPromptId: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
      }),
      query: t.Object({
        userId: t.String(),
      }),
    }
  )

  // Delete API registration
  .delete(
    "/:id",
    async ({ params, query }) => {
      const userId = query.userId as string;
      const registrationId = params.id;

      if (!userId) {
        return {
          success: false,
          error: "User ID is required",
        };
      }

      return apiRegistrationController.deleteApiRegistration(userId, registrationId);
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


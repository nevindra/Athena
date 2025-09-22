import type {
  ApiRegistration,
  CreateApiRegistrationRequest,
  UpdateApiRegistrationRequest,
} from "@athena/shared";
import { eq, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { db } from "../db";
import { env } from "../config/env";
import {
  apiRegistrations,
  users,
  type ApiRegistrationDB,
  type NewApiRegistration,
} from "../db/schema";
import { encryptionService } from "../services/encryptionService";

class ApiRegistrationController {
  async ensureUser(userId: string) {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!existingUser) {
      await db.insert(users).values({ id: userId });
    }
  }

  async getApiRegistrations(userId: string) {
    try {
      const registrations = await db.query.apiRegistrations.findMany({
        where: eq(apiRegistrations.userId, userId),
        with: {
          configuration: {
            columns: {
              id: true,
              name: true,
              provider: true,
            },
          },
          systemPrompt: {
            columns: {
              id: true,
              title: true,
              category: true,
            },
          },
        },
      });

      // Map registrations for response
      const mappedRegistrations: ApiRegistration[] = registrations.map((reg) => ({
        id: reg.id,
        userId: reg.userId,
        name: reg.name,
        description: reg.description || "",
        baseUrl: reg.baseUrl,
        apiKey: reg.apiKey,
        configurationId: reg.configurationId,
        systemPromptId: reg.systemPromptId || undefined,
        isActive: reg.isActive,
        createdAt: reg.createdAt.toISOString(),
        updatedAt: reg.updatedAt.toISOString(),
      }));

      return {
        success: true,
        data: mappedRegistrations,
      };
    } catch (error) {
      console.error("Error fetching API registrations:", error);
      return {
        success: false,
        error: "Failed to fetch API registrations",
      };
    }
  }

  async getApiRegistration(userId: string, registrationId: string) {
    try {
      const registration = await db.query.apiRegistrations.findFirst({
        where: and(
          eq(apiRegistrations.id, registrationId),
          eq(apiRegistrations.userId, userId)
        ),
        with: {
          configuration: {
            columns: {
              id: true,
              name: true,
              provider: true,
            },
          },
          systemPrompt: {
            columns: {
              id: true,
              title: true,
              category: true,
            },
          },
        },
      });

      if (!registration) {
        return {
          success: false,
          error: "API registration not found",
        };
      }

      // Map registration for response
      const mappedRegistration: ApiRegistration = {
        id: registration.id,
        userId: registration.userId,
        name: registration.name,
        description: registration.description || "",
        baseUrl: registration.baseUrl,
        apiKey: registration.apiKey,
        configurationId: registration.configurationId,
        systemPromptId: registration.systemPromptId || undefined,
        isActive: registration.isActive,
        createdAt: registration.createdAt.toISOString(),
        updatedAt: registration.updatedAt.toISOString(),
      };

      return {
        success: true,
        data: mappedRegistration,
      };
    } catch (error) {
      console.error("Error fetching API registration:", error);
      return {
        success: false,
        error: "Failed to fetch API registration",
      };
    }
  }

  async createApiRegistration(userId: string, data: CreateApiRegistrationRequest) {
    try {
      // Generate API key and external endpoint URL
      const apiKey = `athena_${createId()}`;
      const registrationId = createId();
      const baseUrl = `${env.API_PREFIX || 'http://localhost:3000/api'}/external/${registrationId}`;

      const newRegistration: NewApiRegistration = {
        id: registrationId,
        userId,
        name: data.name,
        description: data.description || "",
        baseUrl,
        apiKey,
        configurationId: data.configurationId,
        systemPromptId: data.systemPromptId || null,
        isActive: data.isActive ?? true,
      };

      const [created] = await db.insert(apiRegistrations).values(newRegistration).returning();

      // Return registration data
      const registration: ApiRegistration = {
        id: created.id,
        userId: created.userId,
        name: created.name,
        description: created.description || "",
        baseUrl: created.baseUrl,
        apiKey: created.apiKey,
        configurationId: created.configurationId,
        systemPromptId: created.systemPromptId || undefined,
        isActive: created.isActive,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };

      return {
        success: true,
        data: registration,
      };
    } catch (error) {
      console.error("Error creating API registration:", error);
      return {
        success: false,
        error: "Failed to create API registration",
      };
    }
  }

  async updateApiRegistration(
    userId: string,
    registrationId: string,
    data: UpdateApiRegistrationRequest
  ) {
    try {
      // Check if registration exists and belongs to user
      const existing = await db.query.apiRegistrations.findFirst({
        where: and(
          eq(apiRegistrations.id, registrationId),
          eq(apiRegistrations.userId, userId)
        ),
      });

      if (!existing) {
        return {
          success: false,
          error: "API registration not found",
        };
      }

      // Prepare update data
      const updateData: Partial<NewApiRegistration> = {
        updatedAt: new Date(),
      };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.configurationId !== undefined) updateData.configurationId = data.configurationId;
      if (data.systemPromptId !== undefined) updateData.systemPromptId = data.systemPromptId || null;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      const [updated] = await db
        .update(apiRegistrations)
        .set(updateData)
        .where(
          and(
            eq(apiRegistrations.id, registrationId),
            eq(apiRegistrations.userId, userId)
          )
        )
        .returning();

      // Map updated registration for response
      const mappedRegistration: ApiRegistration = {
        id: updated.id,
        userId: updated.userId,
        name: updated.name,
        description: updated.description || "",
        baseUrl: updated.baseUrl,
        apiKey: updated.apiKey,
        configurationId: updated.configurationId,
        systemPromptId: updated.systemPromptId || undefined,
        isActive: updated.isActive,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };

      return {
        success: true,
        data: mappedRegistration,
      };
    } catch (error) {
      console.error("Error updating API registration:", error);
      return {
        success: false,
        error: "Failed to update API registration",
      };
    }
  }

  async deleteApiRegistration(userId: string, registrationId: string) {
    try {
      const deleted = await db
        .delete(apiRegistrations)
        .where(
          and(
            eq(apiRegistrations.id, registrationId),
            eq(apiRegistrations.userId, userId)
          )
        )
        .returning();

      if (deleted.length === 0) {
        return {
          success: false,
          error: "API registration not found",
        };
      }

      return {
        success: true,
        data: null,
      };
    } catch (error) {
      console.error("Error deleting API registration:", error);
      return {
        success: false,
        error: "Failed to delete API registration",
      };
    }
  }

}

export const apiRegistrationController = new ApiRegistrationController();
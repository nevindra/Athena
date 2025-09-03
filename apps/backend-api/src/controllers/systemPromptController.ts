import { eq, and } from "drizzle-orm";
import { ulid } from "ulid";
import { db } from "../config/database";
import { systemPrompts, users } from "../db/schema";
import type { 
  SystemPrompt, 
  CreateSystemPromptRequest, 
  UpdateSystemPromptRequest,
  ApiResponse,
  SystemPromptCategory
} from "@athena/shared";
import type { SystemPromptDB, NewSystemPrompt } from "../db/schema";

export class SystemPromptController {
  // Helper method to convert DB system prompt to API system prompt
  private dbSystemPromptToApiSystemPrompt(dbPrompt: SystemPromptDB): SystemPrompt {
    return {
      id: dbPrompt.id,
      userId: dbPrompt.userId,
      title: dbPrompt.title,
      description: dbPrompt.description,
      category: dbPrompt.category as SystemPromptCategory,
      content: dbPrompt.content,
      jsonSchema: dbPrompt.jsonSchema || undefined,
      jsonDescription: dbPrompt.jsonDescription || undefined,
      createdAt: new Date(dbPrompt.createdAt),
      updatedAt: new Date(dbPrompt.updatedAt),
    };
  }

  // Ensure user exists (similar to configuration controller)
  async ensureUser(userId: string): Promise<void> {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      await db.insert(users).values({
        id: userId,
        email: null,
        name: null,
      });
    }
  }

  // Get all system prompts for a user
  async getSystemPrompts(userId: string): Promise<ApiResponse<SystemPrompt[]>> {
    try {
      const prompts = await db
        .select()
        .from(systemPrompts)
        .where(eq(systemPrompts.userId, userId))
        .orderBy(systemPrompts.createdAt);

      const apiPrompts = prompts.map(prompt => this.dbSystemPromptToApiSystemPrompt(prompt));

      return {
        success: true,
        data: apiPrompts,
      };
    } catch (error) {
      console.error("Failed to get system prompts:", error);
      return {
        success: false,
        error: "Failed to retrieve system prompts",
      };
    }
  }

  // Get a specific system prompt by ID
  async getSystemPrompt(userId: string, promptId: string): Promise<ApiResponse<SystemPrompt>> {
    try {
      const prompt = await db
        .select()
        .from(systemPrompts)
        .where(
          and(
            eq(systemPrompts.id, promptId),
            eq(systemPrompts.userId, userId)
          )
        )
        .limit(1);

      if (prompt.length === 0) {
        return {
          success: false,
          error: "System prompt not found",
        };
      }

      const apiPrompt = this.dbSystemPromptToApiSystemPrompt(prompt[0]);

      return {
        success: true,
        data: apiPrompt,
      };
    } catch (error) {
      console.error("Failed to get system prompt:", error);
      return {
        success: false,
        error: "Failed to retrieve system prompt",
      };
    }
  }

  // Create a new system prompt
  async createSystemPrompt(userId: string, promptData: CreateSystemPromptRequest): Promise<ApiResponse<SystemPrompt>> {
    try {
      const newPromptData: NewSystemPrompt = {
        id: ulid(),
        userId,
        title: promptData.title,
        description: promptData.description || "",
        category: promptData.category,
        content: promptData.content,
        jsonSchema: promptData.jsonSchema || null,
        jsonDescription: promptData.jsonDescription || null,
      };

      const insertedPrompts = await db
        .insert(systemPrompts)
        .values(newPromptData)
        .returning();

      if (insertedPrompts.length === 0) {
        return {
          success: false,
          error: "Failed to create system prompt",
        };
      }

      const apiPrompt = this.dbSystemPromptToApiSystemPrompt(insertedPrompts[0]);

      return {
        success: true,
        data: apiPrompt,
      };
    } catch (error) {
      console.error("Failed to create system prompt:", error);
      return {
        success: false,
        error: "Failed to create system prompt",
      };
    }
  }

  // Update an existing system prompt
  async updateSystemPrompt(
    userId: string, 
    promptId: string, 
    promptData: UpdateSystemPromptRequest
  ): Promise<ApiResponse<SystemPrompt>> {
    try {
      // First check if the prompt exists and belongs to the user
      const existingPrompt = await db
        .select()
        .from(systemPrompts)
        .where(
          and(
            eq(systemPrompts.id, promptId),
            eq(systemPrompts.userId, userId)
          )
        )
        .limit(1);

      if (existingPrompt.length === 0) {
        return {
          success: false,
          error: "System prompt not found",
        };
      }

      // Prepare update data (only include defined fields)
      const updateData: Partial<SystemPromptDB> = {
        updatedAt: new Date(),
      };

      if (promptData.title !== undefined) updateData.title = promptData.title;
      if (promptData.description !== undefined) updateData.description = promptData.description;
      if (promptData.category !== undefined) updateData.category = promptData.category as SystemPromptCategory;
      if (promptData.content !== undefined) updateData.content = promptData.content;
      if (promptData.jsonSchema !== undefined) updateData.jsonSchema = promptData.jsonSchema;
      if (promptData.jsonDescription !== undefined) updateData.jsonDescription = promptData.jsonDescription;

      const updatedPrompts = await db
        .update(systemPrompts)
        .set(updateData)
        .where(
          and(
            eq(systemPrompts.id, promptId),
            eq(systemPrompts.userId, userId)
          )
        )
        .returning();

      if (updatedPrompts.length === 0) {
        return {
          success: false,
          error: "Failed to update system prompt",
        };
      }

      const apiPrompt = this.dbSystemPromptToApiSystemPrompt(updatedPrompts[0]);

      return {
        success: true,
        data: apiPrompt,
      };
    } catch (error) {
      console.error("Failed to update system prompt:", error);
      return {
        success: false,
        error: "Failed to update system prompt",
      };
    }
  }

  // Delete a system prompt
  async deleteSystemPrompt(userId: string, promptId: string): Promise<ApiResponse<null>> {
    try {
      const deletedPrompts = await db
        .delete(systemPrompts)
        .where(
          and(
            eq(systemPrompts.id, promptId),
            eq(systemPrompts.userId, userId)
          )
        )
        .returning({ id: systemPrompts.id });

      if (deletedPrompts.length === 0) {
        return {
          success: false,
          error: "System prompt not found",
        };
      }

      return {
        success: true,
        data: null,
      };
    } catch (error) {
      console.error("Failed to delete system prompt:", error);
      return {
        success: false,
        error: "Failed to delete system prompt",
      };
    }
  }
}

export const systemPromptController = new SystemPromptController();
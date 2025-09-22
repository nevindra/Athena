import type {
  ApiResponse,
  CreateSystemPromptRequest,
  SystemPrompt,
  UpdateSystemPromptRequest,
} from "@athena/shared";
import { apiClient, makeApiCall } from "~/lib/api-client";


export const systemPromptsApi = {
  // Get all system prompts for a user
  async getSystemPrompts(userId: string): Promise<SystemPrompt[]> {
    return makeApiCall(() =>
      apiClient
        .get(`system-prompts?userId=${userId}`)
        .json<ApiResponse<SystemPrompt[]>>()
    );
  },

  // Get a specific system prompt by ID
  async getSystemPrompt(promptId: string, userId: string): Promise<SystemPrompt> {
    return makeApiCall(() =>
      apiClient
        .get(`system-prompts/${promptId}?userId=${userId}`)
        .json<ApiResponse<SystemPrompt>>()
    );
  },

  // Create a new system prompt
  async createSystemPrompt(
    data: CreateSystemPromptRequest,
    userId: string
  ): Promise<SystemPrompt> {
    return makeApiCall(() =>
      apiClient
        .post(`system-prompts?userId=${userId}`, {
          json: data,
        })
        .json<ApiResponse<SystemPrompt>>()
    );
  },

  // Update an existing system prompt
  async updateSystemPrompt(
    promptId: string,
    data: UpdateSystemPromptRequest,
    userId: string
  ): Promise<SystemPrompt> {
    return makeApiCall(() =>
      apiClient
        .put(`system-prompts/${promptId}?userId=${userId}`, {
          json: data,
        })
        .json<ApiResponse<SystemPrompt>>()
    );
  },

  // Delete a system prompt
  async deleteSystemPrompt(promptId: string, userId: string): Promise<void> {
    await makeApiCall(() =>
      apiClient
        .delete(`system-prompts/${promptId}?userId=${userId}`)
        .json<ApiResponse<null>>()
    );
  },
};

// Export individual functions for easier importing
export const {
  getSystemPrompts,
  getSystemPrompt,
  createSystemPrompt,
  updateSystemPrompt,
  deleteSystemPrompt,
} = systemPromptsApi;

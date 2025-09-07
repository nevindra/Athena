import type {
  ApiResponse,
  CreateSystemPromptRequest,
  SystemPrompt,
  UpdateSystemPromptRequest,
} from "@athena/shared";
import { apiClient, makeApiCall } from "~/lib/api-client";

// Demo user ID (ULID format) - same as configurations
export const DEMO_USER_ID = "01HZXM0K1QRST9VWXYZ01234AB";

export const systemPromptsApi = {
  // Get all system prompts for the demo user
  async getSystemPrompts(): Promise<SystemPrompt[]> {
    return makeApiCall(() =>
      apiClient
        .get(`system-prompts?userId=${DEMO_USER_ID}`)
        .json<ApiResponse<SystemPrompt[]>>()
    );
  },

  // Get a specific system prompt by ID
  async getSystemPrompt(promptId: string): Promise<SystemPrompt> {
    return makeApiCall(() =>
      apiClient
        .get(`system-prompts/${promptId}?userId=${DEMO_USER_ID}`)
        .json<ApiResponse<SystemPrompt>>()
    );
  },

  // Create a new system prompt
  async createSystemPrompt(
    data: CreateSystemPromptRequest
  ): Promise<SystemPrompt> {
    return makeApiCall(() =>
      apiClient
        .post(`system-prompts?userId=${DEMO_USER_ID}`, {
          json: data,
        })
        .json<ApiResponse<SystemPrompt>>()
    );
  },

  // Update an existing system prompt
  async updateSystemPrompt(
    promptId: string,
    data: UpdateSystemPromptRequest
  ): Promise<SystemPrompt> {
    return makeApiCall(() =>
      apiClient
        .put(`system-prompts/${promptId}?userId=${DEMO_USER_ID}`, {
          json: data,
        })
        .json<ApiResponse<SystemPrompt>>()
    );
  },

  // Delete a system prompt
  async deleteSystemPrompt(promptId: string): Promise<void> {
    await makeApiCall(() =>
      apiClient
        .delete(`system-prompts/${promptId}?userId=${DEMO_USER_ID}`)
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

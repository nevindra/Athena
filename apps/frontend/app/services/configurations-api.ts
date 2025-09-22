import type {
  AIConfiguration,
  ApiResponse,
  CreateConfigRequest,
  TestConnectionRequest,
  UpdateConfigRequest,
} from "@athena/shared";
import { apiClient, makeApiCall } from "~/lib/api-client";


export const configurationsApi = {
  // Get all configurations for a user
  async getConfigurations(userId: string): Promise<AIConfiguration[]> {
    return makeApiCall(() =>
      apiClient
        .get(`configurations?userId=${userId}`)
        .json<ApiResponse<AIConfiguration[]>>()
    );
  },

  // Get a specific configuration by ID
  async getConfiguration(configId: string, userId: string): Promise<AIConfiguration> {
    return makeApiCall(() =>
      apiClient
        .get(`configurations/${configId}?userId=${userId}`)
        .json<ApiResponse<AIConfiguration>>()
    );
  },

  // Create a new configuration
  async createConfiguration(
    data: CreateConfigRequest,
    userId: string
  ): Promise<AIConfiguration> {
    return makeApiCall(() =>
      apiClient
        .post(`configurations?userId=${userId}`, {
          json: data,
        })
        .json<ApiResponse<AIConfiguration>>()
    );
  },

  // Update an existing configuration
  async updateConfiguration(
    configId: string,
    data: UpdateConfigRequest,
    userId: string
  ): Promise<AIConfiguration> {
    return makeApiCall(() =>
      apiClient
        .put(`configurations/${configId}?userId=${userId}`, {
          json: data,
        })
        .json<ApiResponse<AIConfiguration>>()
    );
  },

  // Delete a configuration
  async deleteConfiguration(configId: string, userId: string): Promise<void> {
    await makeApiCall(() =>
      apiClient
        .delete(`configurations/${configId}?userId=${userId}`)
        .json<ApiResponse<null>>()
    );
  },

  // Test connection for a configuration
  async testConnection(data: TestConnectionRequest): Promise<{
    success: boolean;
    latency?: number;
    model?: string;
    error?: string;
  }> {
    return makeApiCall(() =>
      apiClient
        .post("configurations/test", {
          json: data,
        })
        .json<
          ApiResponse<{
            success: boolean;
            latency?: number;
            model?: string;
            error?: string;
          }>
        >()
    );
  },
};

// Export individual functions for easier importing
export const {
  getConfigurations,
  getConfiguration,
  createConfiguration,
  updateConfiguration,
  deleteConfiguration,
  testConnection,
} = configurationsApi;

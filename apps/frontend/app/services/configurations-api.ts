import type {
  AIConfiguration,
  ApiResponse,
  CreateConfigRequest,
  TestConnectionRequest,
  UpdateConfigRequest,
} from "@athena/shared";
import { apiClient, makeApiCall } from "~/lib/api-client";

// Demo user ID (ULID format) - in a real app, this would come from auth
export const DEMO_USER_ID = "01HZXM0K1QRST9VWXYZ01234AB";

export const configurationsApi = {
  // Get all configurations for the demo user
  async getConfigurations(): Promise<AIConfiguration[]> {
    return makeApiCall(() =>
      apiClient
        .get(`configurations?userId=${DEMO_USER_ID}`)
        .json<ApiResponse<AIConfiguration[]>>()
    );
  },

  // Get a specific configuration by ID
  async getConfiguration(configId: string): Promise<AIConfiguration> {
    return makeApiCall(() =>
      apiClient
        .get(`configurations/${configId}?userId=${DEMO_USER_ID}`)
        .json<ApiResponse<AIConfiguration>>()
    );
  },

  // Create a new configuration
  async createConfiguration(
    data: CreateConfigRequest
  ): Promise<AIConfiguration> {
    return makeApiCall(() =>
      apiClient
        .post(`configurations?userId=${DEMO_USER_ID}`, {
          json: data,
        })
        .json<ApiResponse<AIConfiguration>>()
    );
  },

  // Update an existing configuration
  async updateConfiguration(
    configId: string,
    data: UpdateConfigRequest
  ): Promise<AIConfiguration> {
    return makeApiCall(() =>
      apiClient
        .put(`configurations/${configId}?userId=${DEMO_USER_ID}`, {
          json: data,
        })
        .json<ApiResponse<AIConfiguration>>()
    );
  },

  // Delete a configuration
  async deleteConfiguration(configId: string): Promise<void> {
    await makeApiCall(() =>
      apiClient
        .delete(`configurations/${configId}?userId=${DEMO_USER_ID}`)
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

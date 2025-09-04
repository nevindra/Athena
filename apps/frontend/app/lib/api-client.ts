import ky, { HTTPError } from "ky";
import type { ApiResponse } from "@athena/shared";

// Create ky instance with base configuration
export const apiClient = ky.create({
  prefixUrl: import.meta.env.VITE_API_URL || "/api",
  timeout: 10000,
  hooks: {
    beforeRequest: [
      () => {
        // Add any common headers or authentication here
      },
    ],
    afterResponse: [
      async (_request, _options, response) => {
        if (!response.ok) {
          let errorMessage = "Network error occurred";

          try {
            const apiError: ApiResponse = await response.json();
            errorMessage =
              apiError?.error || `Server error: ${response.status}`;
          } catch {
            errorMessage = `Server error: ${response.status}`;
          }

          // Create a consistent error object
          const enhancedError = new Error(errorMessage);
          enhancedError.name = "ApiError";

          throw enhancedError;
        }

        return response;
      },
    ],
    beforeError: [
      (error) => {
        if (error instanceof HTTPError) {
          return error;
        }

        // Something happened in setting up the request
        const configError = new HTTPError(
          new Response(null, { status: 0 }),
          new Request(""),
          {},
        );
        return configError;
      },
    ],
  },
});

// Helper type for API responses
export interface ApiClientResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
}

// Helper function for type-safe API calls
export const makeApiCall = async <T>(
  apiCall: () => Promise<ApiResponse<T>>,
): Promise<T> => {
  const response = await apiCall();

  if (!response.success) {
    throw new Error(response.error || "API call failed");
  }

  return response.data as T;
};

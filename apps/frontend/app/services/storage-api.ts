import type {
  ApiResponse,
  StorageStatsResponse,
  FileDetailsResponse,
} from "@athena/shared";
import { apiClient, makeApiCall } from "~/lib/api-client";

// Demo user ID (ULID format) - in a real app, this would come from auth
export const DEMO_USER_ID = "01HZXM0K1QRST9VWXYZ01234AB";

export interface CleanupResult {
  success: boolean;
  filesDeleted: number;
  spaceFreed: number;
  message: string;
}

export interface DuplicateGroup {
  hash: string;
  files: FileDetailsResponse[];
  totalSize: number;
  duplicateCount: number;
  potentialSavings: number;
}

export interface StorageOptimizationResult {
  tempFilesDeleted: number;
  duplicatesFound: number;
  totalSpaceFreed: number;
  optimizedFiles: number;
}

export const storageApi = {
  // Get storage statistics for the user
  async getStorageStats(): Promise<StorageStatsResponse> {
    return makeApiCall(() =>
      apiClient
        .get(`storage/stats?userId=${DEMO_USER_ID}`)
        .json<ApiResponse<StorageStatsResponse>>()
    );
  },

  // Clean up temporary files
  async cleanupTempFiles(): Promise<CleanupResult> {
    return makeApiCall(() =>
      apiClient
        .post(`storage/cleanup/temp?userId=${DEMO_USER_ID}`)
        .json<ApiResponse<CleanupResult>>()
    );
  },

  // Empty trash (permanently delete trashed files)
  async emptyTrash(): Promise<CleanupResult> {
    return makeApiCall(() =>
      apiClient
        .post(`storage/cleanup/trash?userId=${DEMO_USER_ID}`)
        .json<ApiResponse<CleanupResult>>()
    );
  },

  // Get trashed files
  async getTrashFiles(
    page?: number,
    limit?: number
  ): Promise<{
    files: FileDetailsResponse[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams({ userId: DEMO_USER_ID });
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());

    return makeApiCall(() =>
      apiClient
        .get(`storage/trash?${params.toString()}`)
        .json<ApiResponse<{
          files: FileDetailsResponse[];
          pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
        }>>()
    );
  },

  // Restore a file from trash
  async restoreFromTrash(fileId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return makeApiCall(() =>
      apiClient
        .post(`storage/trash/${fileId}/restore?userId=${DEMO_USER_ID}`)
        .json<ApiResponse<{
          success: boolean;
          message: string;
        }>>()
    );
  },

  // Find duplicate files
  async getDuplicateFiles(): Promise<{
    duplicates: DuplicateGroup[];
    totalGroups: number;
    totalPotentialSavings: number;
  }> {
    return makeApiCall(() =>
      apiClient
        .get(`storage/duplicates?userId=${DEMO_USER_ID}`)
        .json<ApiResponse<{
          duplicates: DuplicateGroup[];
          totalGroups: number;
          totalPotentialSavings: number;
        }>>()
    );
  },

  // Optimize storage (cleanup temp files, find duplicates, etc.)
  async optimizeStorage(): Promise<StorageOptimizationResult> {
    return makeApiCall(() =>
      apiClient
        .post(`storage/optimize?userId=${DEMO_USER_ID}`)
        .json<ApiResponse<StorageOptimizationResult>>()
    );
  },
};

// Export individual functions for easier importing
export const {
  getStorageStats,
  cleanupTempFiles,
  emptyTrash,
  getTrashFiles,
  restoreFromTrash,
  getDuplicateFiles,
  optimizeStorage,
} = storageApi;
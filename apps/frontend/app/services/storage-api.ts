import type {
  ApiResponse,
  StorageStatsResponse,
  FileDetailsResponse,
} from "@athena/shared";
import { apiClient, makeApiCall } from "~/lib/api-client";


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
  async getStorageStats(userId: string): Promise<StorageStatsResponse> {
    return makeApiCall(() =>
      apiClient
        .get(`storage/stats?userId=${userId}`)
        .json<ApiResponse<StorageStatsResponse>>()
    );
  },

  // Clean up temporary files
  async cleanupTempFiles(userId: string): Promise<CleanupResult> {
    return makeApiCall(() =>
      apiClient
        .post(`storage/cleanup/temp?userId=${userId}`)
        .json<ApiResponse<CleanupResult>>()
    );
  },

  // Empty trash (permanently delete trashed files)
  async emptyTrash(userId: string): Promise<CleanupResult> {
    return makeApiCall(() =>
      apiClient
        .post(`storage/cleanup/trash?userId=${userId}`)
        .json<ApiResponse<CleanupResult>>()
    );
  },

  // Get trashed files
  async getTrashFiles(
    userId: string,
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
    const params = new URLSearchParams({ userId });
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
  async restoreFromTrash(fileId: string, userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return makeApiCall(() =>
      apiClient
        .post(`storage/trash/${fileId}/restore?userId=${userId}`)
        .json<ApiResponse<{
          success: boolean;
          message: string;
        }>>()
    );
  },

  // Find duplicate files
  async getDuplicateFiles(userId: string): Promise<{
    duplicates: DuplicateGroup[];
    totalGroups: number;
    totalPotentialSavings: number;
  }> {
    return makeApiCall(() =>
      apiClient
        .get(`storage/duplicates?userId=${userId}`)
        .json<ApiResponse<{
          duplicates: DuplicateGroup[];
          totalGroups: number;
          totalPotentialSavings: number;
        }>>()
    );
  },

  // Optimize storage (cleanup temp files, find duplicates, etc.)
  async optimizeStorage(userId: string): Promise<StorageOptimizationResult> {
    return makeApiCall(() =>
      apiClient
        .post(`storage/optimize?userId=${userId}`)
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
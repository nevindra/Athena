import type {
  ApiResponse,
  FileUploadRequest,
  FileUploadResponse,
  PresignedUploadRequest,
  PresignedUploadResponse,
  FileListQuery,
  FileListResponse,
  FileDetailsResponse,
  FileUpdateRequest,
  FileDeleteResponse,
  SearchQuery,
  FileItem,
} from "@athena/shared";
import { apiClient, makeApiCall } from "~/lib/api-client";

// Demo user ID (ULID format) - in a real app, this would come from auth
export const DEMO_USER_ID = "01HZXM0K1QRST9VWXYZ01234AB";

export const knowledgeBaseFilesApi = {
  // Upload files directly
  async uploadFiles(
    files: File[],
    options?: {
      knowledgeBaseId?: string;
      folderId?: string;
      description?: string;
      tags?: string[];
      category?: string;
    }
  ): Promise<FileUploadResponse> {
    const formData = new FormData();
    
    // Add files to form data
    files.forEach((file, index) => {
      formData.append("files", file);
    });

    // Add optional metadata
    if (options?.knowledgeBaseId) {
      formData.append("knowledgeBaseId", options.knowledgeBaseId);
    }
    if (options?.folderId) {
      formData.append("folderId", options.folderId);
    }
    if (options?.description) {
      formData.append("description", options.description);
    }
    if (options?.category) {
      formData.append("category", options.category);
    }
    if (options?.tags) {
      formData.append("tags", JSON.stringify(options.tags));
    }

    return makeApiCall(() =>
      apiClient
        .post(`kb-files/upload?userId=${DEMO_USER_ID}`, {
          body: formData,
        })
        .json<ApiResponse<FileUploadResponse>>()
    );
  },

  // Get presigned upload URL for large files
  async getPresignedUploadUrl(
    data: PresignedUploadRequest
  ): Promise<PresignedUploadResponse> {
    return makeApiCall(() =>
      apiClient
        .post(`kb-files/upload/presigned?userId=${DEMO_USER_ID}`, {
          json: data,
        })
        .json<ApiResponse<PresignedUploadResponse>>()
    );
  },

  // List files with filtering and pagination
  async getFiles(query?: FileListQuery): Promise<FileListResponse> {
    const params = new URLSearchParams({ userId: DEMO_USER_ID });
    
    if (query?.page) params.append("page", query.page.toString());
    if (query?.limit) params.append("limit", query.limit.toString());
    if (query?.category) params.append("category", query.category);
    if (query?.search) params.append("search", query.search);
    if (query?.folderId) params.append("folderId", query.folderId);
    if (query?.knowledgeBaseId) params.append("knowledgeBaseId", query.knowledgeBaseId);
    if (query?.sortBy) params.append("sortBy", query.sortBy);
    if (query?.sortOrder) params.append("sortOrder", query.sortOrder);

    return makeApiCall(() =>
      apiClient
        .get(`kb-files?${params.toString()}`)
        .json<ApiResponse<FileListResponse>>()
    );
  },

  // Get file details by ID
  async getFile(id: string): Promise<FileDetailsResponse> {
    return makeApiCall(() =>
      apiClient
        .get(`kb-files/${id}?userId=${DEMO_USER_ID}`)
        .json<ApiResponse<FileDetailsResponse>>()
    );
  },

  // Update file metadata
  async updateFile(
    id: string,
    data: FileUpdateRequest
  ): Promise<FileDetailsResponse> {
    return makeApiCall(() =>
      apiClient
        .put(`kb-files/${id}?userId=${DEMO_USER_ID}`, {
          json: data,
        })
        .json<ApiResponse<FileDetailsResponse>>()
    );
  },

  // Delete a file (soft delete by default)
  async deleteFile(
    id: string,
    hardDelete = false
  ): Promise<FileDeleteResponse> {
    const params = new URLSearchParams({ userId: DEMO_USER_ID });
    if (hardDelete) params.append("hard", "true");

    return makeApiCall(() =>
      apiClient
        .delete(`kb-files/${id}?${params.toString()}`)
        .json<ApiResponse<FileDeleteResponse>>()
    );
  },

  // Download a file
  async downloadFile(id: string): Promise<Blob> {
    const response = await apiClient.get(`kb-files/${id}/download?userId=${DEMO_USER_ID}`);
    return response.blob();
  },

  // Search files with advanced filters
  async searchFiles(query: SearchQuery): Promise<FileListResponse> {
    const params = new URLSearchParams({
      userId: DEMO_USER_ID,
      q: query.q,
    });

    if (query.page) params.append("page", query.page.toString());
    if (query.limit) params.append("limit", query.limit.toString());
    
    // Add filters
    if (query.filters?.fileType) {
      params.append("fileType", query.filters.fileType.join(","));
    }
    if (query.filters?.size?.min) {
      params.append("sizeMin", query.filters.size.min.toString());
    }
    if (query.filters?.size?.max) {
      params.append("sizeMax", query.filters.size.max.toString());
    }
    if (query.filters?.dateRange?.from) {
      params.append("dateFrom", query.filters.dateRange.from);
    }
    if (query.filters?.dateRange?.to) {
      params.append("dateTo", query.filters.dateRange.to);
    }
    if (query.filters?.knowledgeBaseId) {
      params.append("knowledgeBaseId", query.filters.knowledgeBaseId);
    }
    if (query.filters?.uploadedBy) {
      params.append("uploadedBy", query.filters.uploadedBy);
    }

    return makeApiCall(() =>
      apiClient
        .get(`kb-files/search?${params.toString()}`)
        .json<ApiResponse<FileListResponse>>()
    );
  },

  // Find similar files
  async findSimilarFiles(
    id: string,
    limit?: number
  ): Promise<Array<FileDetailsResponse & { similarity: number }>> {
    const params = new URLSearchParams({ userId: DEMO_USER_ID });
    if (limit) params.append("limit", limit.toString());

    return makeApiCall(() =>
      apiClient
        .get(`kb-files/${id}/similar?${params.toString()}`)
        .json<ApiResponse<Array<FileDetailsResponse & { similarity: number }>>>()
    );
  },

  // Get recent files
  async getRecentFiles(
    limit?: number
  ): Promise<FileDetailsResponse[]> {
    const params = new URLSearchParams({ userId: DEMO_USER_ID });
    if (limit) params.append("limit", limit.toString());

    return makeApiCall(() =>
      apiClient
        .get(`kb-files/recent?${params.toString()}`)
        .json<ApiResponse<FileDetailsResponse[]>>()
    );
  },

  // Get popular files
  async getPopularFiles(
    limit?: number
  ): Promise<FileDetailsResponse[]> {
    const params = new URLSearchParams({ userId: DEMO_USER_ID });
    if (limit) params.append("limit", limit.toString());

    return makeApiCall(() =>
      apiClient
        .get(`kb-files/popular?${params.toString()}`)
        .json<ApiResponse<FileDetailsResponse[]>>()
    );
  },
};

// Export individual functions for easier importing
export const {
  uploadFiles,
  getPresignedUploadUrl,
  getFiles,
  getFile,
  updateFile,
  deleteFile,
  downloadFile,
  searchFiles,
  findSimilarFiles,
  getRecentFiles,
  getPopularFiles,
} = knowledgeBaseFilesApi;
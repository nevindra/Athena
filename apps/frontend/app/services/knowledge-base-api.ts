import type {
  ApiResponse,
  CreateKnowledgeBaseRequest,
  KnowledgeBaseResponse,
  KnowledgeBaseListResponse,
  UpdateKnowledgeBaseRequest,
} from "@athena/shared";
import { apiClient, makeApiCall } from "~/lib/api-client";


export const knowledgeBaseApi = {
  // Create a new knowledge base
  async createKnowledgeBase(
    data: CreateKnowledgeBaseRequest,
    userId: string
  ): Promise<KnowledgeBaseResponse> {
    return makeApiCall(() =>
      apiClient
        .post(`knowledge-bases?userId=${userId}`, {
          json: data,
        })
        .json<ApiResponse<KnowledgeBaseResponse>>()
    );
  },

  // Get all knowledge bases with pagination and hierarchy support
  async getKnowledgeBases(userId: string, options?: {
    page?: number;
    limit?: number;
    parentId?: string | null;
    includeChildren?: boolean;
    hierarchy?: boolean;
  }): Promise<KnowledgeBaseListResponse | KnowledgeBaseResponse[]> {
    const params = new URLSearchParams({ userId });
    
    if (options?.page) params.append("page", options.page.toString());
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.parentId !== undefined) {
      params.append("parentId", options.parentId === null ? "null" : options.parentId);
    }
    if (options?.includeChildren) params.append("includeChildren", "true");
    if (options?.hierarchy) params.append("hierarchy", "true");

    if (options?.hierarchy) {
      return makeApiCall(() =>
        apiClient
          .get(`knowledge-bases?${params.toString()}`)
          .json<ApiResponse<KnowledgeBaseResponse[]>>()
      );
    }

    return makeApiCall(() =>
      apiClient
        .get(`knowledge-bases?${params.toString()}`)
        .json<ApiResponse<KnowledgeBaseListResponse>>()
    );
  },

  // Get a specific knowledge base by ID
  async getKnowledgeBase(
    id: string,
    userId: string,
    includeChildren = false
  ): Promise<KnowledgeBaseResponse> {
    const params = new URLSearchParams({ userId });
    if (includeChildren) params.append("includeChildren", "true");

    return makeApiCall(() =>
      apiClient
        .get(`knowledge-bases/${id}?${params.toString()}`)
        .json<ApiResponse<KnowledgeBaseResponse>>()
    );
  },

  // Update an existing knowledge base
  async updateKnowledgeBase(
    id: string,
    data: UpdateKnowledgeBaseRequest,
    userId: string
  ): Promise<KnowledgeBaseResponse> {
    return makeApiCall(() =>
      apiClient
        .put(`knowledge-bases/${id}?userId=${userId}`, {
          json: data,
        })
        .json<ApiResponse<KnowledgeBaseResponse>>()
    );
  },

  // Delete a knowledge base
  async deleteKnowledgeBase(
    id: string,
    userId: string,
    deleteFiles = false
  ): Promise<{ success: boolean; message: string }> {
    const params = new URLSearchParams({ userId });
    if (deleteFiles) params.append("deleteFiles", "true");

    return makeApiCall(() =>
      apiClient
        .delete(`knowledge-bases/${id}?${params.toString()}`)
        .json<ApiResponse<{ success: boolean; message: string }>>()
    );
  },

  // Get knowledge base statistics
  async getKnowledgeBaseStats(id: string, userId: string): Promise<{
    fileCount: number;
    totalSize: number;
    lastActivity: string;
  }> {
    return makeApiCall(() =>
      apiClient
        .get(`knowledge-bases/${id}/stats?userId=${userId}`)
        .json<ApiResponse<{
          fileCount: number;
          totalSize: number;
          lastActivity: string;
        }>>()
    );
  },
};

// Export individual functions for easier importing
export const {
  createKnowledgeBase,
  getKnowledgeBases,
  getKnowledgeBase,
  updateKnowledgeBase,
  deleteKnowledgeBase,
  getKnowledgeBaseStats,
} = knowledgeBaseApi;
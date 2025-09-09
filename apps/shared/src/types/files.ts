// File Management Types
export type FileCategory = "all" | "documents" | "images" | "audio" | "videos" | "knowledge-base";

export interface FileMetadata {
  description?: string;
  extractedText?: string;
  dimensions?: { width: number; height: number };
  duration?: number;
  pageCount?: number;
}

export interface UserInfo {
  name: string;
  avatar?: string;
  email?: string;
}

export interface FileItem {
  id: string;
  userId: string;
  knowledgeBaseId?: string;
  folderId?: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  thumbnailPath?: string;
  category: string;
  tags: string[];
  metadata: FileMetadata;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileUploadRequest {
  files: File[];
  folderId?: string;
  knowledgeBaseId?: string;
  metadata?: {
    description?: string;
    tags?: string[];
    category?: string;
  };
}

export interface FileUploadResponse {
  success: boolean;
  files: Array<{
    id: string;
    name: string;
    size: number;
    mimeType: string;
    url: string;
    thumbnailUrl?: string;
    uploadedAt: string;
    metadata: FileMetadata;
  }>;
  errors?: Array<{
    fileName: string;
    error: string;
  }>;
}

export interface PresignedUploadRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
  folderId?: string;
  knowledgeBaseId?: string;
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  uploadId: string;
  expiresAt: string;
  fields: Record<string, string>;
}

export interface FileListQuery {
  page?: number;
  limit?: number;
  category?: FileCategory;
  search?: string;
  folderId?: string;
  knowledgeBaseId?: string;
  sortBy?: "name" | "size" | "uploadDate" | "type";
  sortOrder?: "asc" | "desc";
}

export interface FileListResponse {
  files: Array<FileItem & {
    downloadUrl: string;
    thumbnailUrl?: string;
    uploadedBy: UserInfo;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalSize: number;
    fileCount: number;
    categoryBreakdown: Record<string, number>;
  };
}

export interface FileDetailsResponse extends FileItem {
  downloadUrl: string;
  thumbnailUrl?: string;
  uploadedBy: UserInfo;
}

export interface FileUpdateRequest {
  name?: string;
  description?: string;
  tags?: string[];
  folderId?: string;
  knowledgeBaseId?: string;
}

export interface FileDeleteResponse {
  success: boolean;
  message: string;
  deletedAt: string;
}

export interface SearchQuery {
  q: string;
  filters?: {
    fileType?: string[];
    size?: { min?: number; max?: number; };
    dateRange?: { from?: string; to?: string; };
    knowledgeBaseId?: string;
    uploadedBy?: string;
  };
  page?: number;
  limit?: number;
}

export interface StorageStatsResponse {
  totalUsed: number;
  totalLimit: number;
  breakdown: {
    files: number;
    knowledgeBases: number;
    thumbnails: number;
    temp: number;
    trash: number;
  };
  recentActivity: Array<{
    action: "upload" | "delete" | "move";
    fileName: string;
    timestamp: string;
    user: UserInfo;
  }>;
}
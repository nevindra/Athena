// Knowledge Base Types
export interface KnowledgeBaseSettings {
  isPublic: boolean;
  allowedFileTypes: string[];
  maxFileSize: number;
}

export interface KnowledgeBase {
  id: string;
  userId: string;
  name: string;
  description?: string;
  parentId?: string;
  path: string;
  settings: KnowledgeBaseSettings;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
  parentId?: string;
  settings?: Partial<KnowledgeBaseSettings>;
}

export interface KnowledgeBaseResponse extends KnowledgeBase {
  stats: {
    fileCount: number;
    totalSize: number;
    lastActivity: string;
  };
  parent?: KnowledgeBase;
  children?: KnowledgeBase[];
}

export interface KnowledgeBaseListResponse {
  knowledgeBases: KnowledgeBaseResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UpdateKnowledgeBaseRequest {
  name?: string;
  description?: string;
  parentId?: string;
  settings?: Partial<KnowledgeBaseSettings>;
}
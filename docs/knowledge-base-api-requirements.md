# Knowledge Base API Requirements

## Overview

This document outlines the API requirements for implementing the Knowledge Base features in Athena, with specific focus on MinIO object storage integration and backend service endpoints.

## MinIO Storage Integration

### MinIO Setup Requirements

#### 1. MinIO Server Configuration
```yaml
# MinIO Environment Variables
MINIO_ROOT_USER: admin
MINIO_ROOT_PASSWORD: your-secure-password
MINIO_REGION: us-east-1
MINIO_BROWSER: "on"
```

#### 2. Bucket Structure
```
athena-storage/
├── files/              # General file storage
├── knowledge-bases/    # Knowledge base specific files
├── thumbnails/         # Generated thumbnails
├── temp/              # Temporary upload storage
└── trash/             # Soft-deleted files
```

#### 3. MinIO Access Policies
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": ["arn:aws:iam::*:user/athena-backend"]},
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::athena-storage/*",
        "arn:aws:s3:::athena-storage"
      ]
    }
  ]
}
```

### MinIO Client Integration

#### 1. MinIO Client Library Setup
```typescript
import { Client as MinIOClient } from 'minio';

const minioClient = new MinIOClient({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});
```

#### 2. File Upload Service
```typescript
interface MinIOUploadResult {
  objectName: string;
  etag: string;
  size: number;
  contentType: string;
  url: string;
}

async function uploadFileToMinIO(
  bucketName: string,
  objectName: string,
  buffer: Buffer,
  metadata: Record<string, string>
): Promise<MinIOUploadResult>;
```

## Required API Endpoints

### 1. File Upload Endpoints

#### POST /api/files/upload
**Purpose**: Handle file upload with MinIO storage integration

**Request:**
```typescript
interface FileUploadRequest {
  files: File[];
  folderId?: string;
  knowledgeBaseId?: string;
  metadata?: {
    description?: string;
    tags?: string[];
    category?: string;
  };
}
```

**Response:**
```typescript
interface FileUploadResponse {
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
```

**Implementation Requirements:**
- Multi-part file upload support
- File validation (type, size, virus scanning)
- Thumbnail generation for images
- Metadata extraction
- Integration with MinIO for storage
- Database persistence for metadata

#### POST /api/files/upload/presigned
**Purpose**: Generate presigned URLs for direct client-to-MinIO uploads

**Request:**
```typescript
interface PresignedUploadRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
  folderId?: string;
  knowledgeBaseId?: string;
}
```

**Response:**
```typescript
interface PresignedUploadResponse {
  uploadUrl: string;
  uploadId: string;
  expiresAt: string;
  fields: Record<string, string>;
}
```

### 2. File Management Endpoints

#### GET /api/files
**Purpose**: Retrieve files with filtering and pagination

**Query Parameters:**
```typescript
interface FileListQuery {
  page?: number;
  limit?: number;
  category?: 'all' | 'documents' | 'images' | 'audio' | 'videos' | 'knowledge-base';
  search?: string;
  folderId?: string;
  knowledgeBaseId?: string;
  sortBy?: 'name' | 'size' | 'uploadDate' | 'type';
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```typescript
interface FileListResponse {
  files: FileItem[];
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
```

#### GET /api/files/:id
**Purpose**: Get file details and download URL

**Response:**
```typescript
interface FileDetailsResponse {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  downloadUrl: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  uploadedBy: UserInfo;
  path: string;
  metadata: FileMetadata;
  knowledgeBaseId?: string;
}
```

#### PUT /api/files/:id
**Purpose**: Update file metadata

**Request:**
```typescript
interface FileUpdateRequest {
  name?: string;
  description?: string;
  tags?: string[];
  folderId?: string;
  knowledgeBaseId?: string;
}
```

#### DELETE /api/files/:id
**Purpose**: Delete file (soft delete with trash retention)

**Response:**
```typescript
interface FileDeleteResponse {
  success: boolean;
  message: string;
  deletedAt: string;
}
```

### 3. Knowledge Base Endpoints

#### POST /api/knowledge-bases
**Purpose**: Create new knowledge base

**Request:**
```typescript
interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
  parentId?: string;
  settings?: {
    isPublic: boolean;
    allowedFileTypes: string[];
    maxFileSize: number;
  };
}
```

**Response:**
```typescript
interface KnowledgeBaseResponse {
  id: string;
  name: string;
  description?: string;
  path: string;
  createdAt: string;
  createdBy: UserInfo;
  settings: KnowledgeBaseSettings;
  stats: {
    fileCount: number;
    totalSize: number;
    lastActivity: string;
  };
}
```

#### GET /api/knowledge-bases
**Purpose**: List knowledge bases with hierarchy

#### PUT /api/knowledge-bases/:id
**Purpose**: Update knowledge base settings

#### DELETE /api/knowledge-bases/:id
**Purpose**: Delete knowledge base and contained files

### 4. Search and Discovery Endpoints

#### GET /api/files/search
**Purpose**: Advanced file search with full-text capabilities

**Query Parameters:**
```typescript
interface SearchQuery {
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
```

#### GET /api/files/similar/:id
**Purpose**: Find similar files based on content analysis

### 5. Storage Management Endpoints

#### GET /api/storage/stats
**Purpose**: Get storage usage statistics

**Response:**
```typescript
interface StorageStatsResponse {
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
    action: 'upload' | 'delete' | 'move';
    fileName: string;
    timestamp: string;
    user: UserInfo;
  }>;
}
```

#### POST /api/storage/cleanup
**Purpose**: Clean up temporary files and trash

## MinIO Service Layer

### File Operations Service

```typescript
class MinIOFileService {
  async uploadFile(
    bucket: string,
    path: string,
    buffer: Buffer,
    metadata: FileMetadata
  ): Promise<MinIOUploadResult>;

  async downloadFile(bucket: string, path: string): Promise<Buffer>;

  async deleteFile(bucket: string, path: string): Promise<void>;

  async generateThumbnail(
    sourceBucket: string,
    sourcePath: string,
    targetBucket: string,
    targetPath: string
  ): Promise<string>;

  async getFileUrl(
    bucket: string,
    path: string,
    expiry?: number
  ): Promise<string>;

  async copyFile(
    sourceBucket: string,
    sourcePath: string,
    targetBucket: string,
    targetPath: string
  ): Promise<void>;

  async listFiles(
    bucket: string,
    prefix: string,
    recursive?: boolean
  ): Promise<FileInfo[]>;
}
```

### Thumbnail Generation Service

```typescript
class ThumbnailService {
  async generateImageThumbnail(
    sourceBuffer: Buffer,
    options: {
      width: number;
      height: number;
      quality: number;
      format: 'jpeg' | 'png' | 'webp';
    }
  ): Promise<Buffer>;

  async generatePDFThumbnail(
    sourceBuffer: Buffer,
    page: number = 1
  ): Promise<Buffer>;

  async generateVideoThumbnail(
    sourceUrl: string,
    timeOffset: number = 0
  ): Promise<Buffer>;
}
```

## Error Handling

### Common Error Responses

```typescript
interface APIError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  requestId: string;
}
```

### Error Codes
- `FILE_TOO_LARGE`: File exceeds size limit
- `UNSUPPORTED_FILE_TYPE`: File type not allowed
- `STORAGE_QUOTA_EXCEEDED`: User/team storage limit reached
- `MINIO_CONNECTION_ERROR`: MinIO server connection issues
- `FILE_NOT_FOUND`: Requested file doesn't exist
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `THUMBNAIL_GENERATION_FAILED`: Thumbnail creation failed

## Security Considerations

### File Upload Security
1. **File Type Validation**: Strict MIME type checking
2. **Size Limits**: Configurable per user/team
3. **Rate Limiting**: Prevent abuse of upload endpoints

### Access Control
1. **Authentication**: JWT token validation
2. **Authorization**: Role-based access control
3. **Presigned URL Security**: Time-limited access
4. **Team Isolation**: Strict data separation
5. **Audit Logging**: Complete action tracking

### Data Protection
1. **Encryption at Rest**: MinIO server-side encryption
2. **Encryption in Transit**: HTTPS/TLS for all communications
3. **Data Retention**: Configurable retention policies

## Performance Considerations

### Upload Optimization
1. **Chunked Upload**: Support for large file uploads
2. **Parallel Processing**: Concurrent file processing
3. **Background Tasks**: Async thumbnail generation
4. **Compression**: Automatic file compression

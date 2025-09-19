import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { ulid } from "ulid";
import type {
  FileCategory,
  FileListQuery,
  FileMetadata,
  FileUploadRequest,
  SearchQuery,
} from "@athena/shared";
import { db } from "../../db";
import { files, knowledgeBases, users } from "../../db/schema";
import type { FileDB, NewFile } from "../../db/schema";
import { MinIOFileService } from "./minioService";
import { ThumbnailService } from "./thumbnailService";
import { env } from "../../config/env";

export class FileService {
  private minioService: MinIOFileService;
  private thumbnailService: ThumbnailService;

  constructor() {
    this.minioService = new MinIOFileService();
    this.thumbnailService = new ThumbnailService();
  }

  async uploadFiles(
    userId: string,
    uploadRequest: FileUploadRequest
  ): Promise<{
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
  }> {
    const uploadedFiles = [];
    const errors = [];

    for (const file of uploadRequest.files) {
      try {
        // Validate file
        const validationError = await this.validateFile(file, uploadRequest.knowledgeBaseId);
        if (validationError) {
          errors.push({ fileName: file.name, error: validationError });
          continue;
        }

        // Generate unique file ID and path
        const fileId = ulid();
        const category = this.categorizeFile(file.type);
        
        let storagePath: string;
        if (uploadRequest.knowledgeBaseId) {
          storagePath = this.minioService.getKnowledgeBasePath(uploadRequest.knowledgeBaseId, fileId);
        } else {
          storagePath = this.minioService.getFilePath(category, fileId);
        }

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to MinIO
        const uploadResult = await this.minioService.uploadFile(
          env.MINIO_BUCKET,
          storagePath,
          buffer,
          {
            "Content-Type": file.type,
            "Original-Filename": file.name,
            "User-Id": userId,
            "Category": category,
          }
        );

        // Generate thumbnail if it's an image
        let thumbnailPath: string | undefined;
        if (file.type.startsWith("image/")) {
          try {
            const thumbnailBuffer = await this.thumbnailService.generateImageThumbnail(buffer);
            thumbnailPath = this.minioService.getThumbnailPath(storagePath);
            
            await this.minioService.uploadFile(
              env.MINIO_BUCKET,
              thumbnailPath,
              thumbnailBuffer,
              {
                "Content-Type": "image/jpeg",
                "Original-Path": storagePath,
              }
            );
          } catch (thumbnailError) {
            console.warn("Failed to generate thumbnail:", thumbnailError);
          }
        }

        // Create file record in database
        const newFile: NewFile = {
          id: fileId,
          userId,
          knowledgeBaseId: uploadRequest.knowledgeBaseId,
          folderId: uploadRequest.folderId,
          name: file.name,
          originalName: file.name,
          mimeType: file.type,
          size: file.size.toString(),
          path: storagePath,
          thumbnailPath,
          category,
          tags: uploadRequest.metadata?.tags || [],
          metadata: {
            description: uploadRequest.metadata?.description,
            ...(file.type.startsWith("image/") && await this.extractImageMetadata(buffer)),
          },
          isDeleted: false,
        };

        const [createdFile] = await db.insert(files).values(newFile).returning();

        const thumbnailUrl = thumbnailPath 
          ? await this.minioService.getFileUrl(env.MINIO_BUCKET, thumbnailPath)
          : undefined;

        uploadedFiles.push({
          id: createdFile.id,
          name: createdFile.name,
          size: Number(createdFile.size),
          mimeType: createdFile.mimeType,
          url: uploadResult.url,
          thumbnailUrl,
          uploadedAt: createdFile.createdAt.toISOString(),
          metadata: createdFile.metadata as FileMetadata,
        });
      } catch (error) {
        console.error(`Failed to upload file ${file.name}:`, error);
        errors.push({
          fileName: file.name,
          error: error instanceof Error ? error.message : "Upload failed",
        });
      }
    }

    return {
      success: uploadedFiles.length > 0,
      files: uploadedFiles,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async getFiles(userId: string, query: FileListQuery) {
    const {
      page = 1,
      limit = 20,
      category = "all",
      search,
      folderId,
      knowledgeBaseId,
      sortBy = "uploadDate",
      sortOrder = "desc",
    } = query;

    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [
      eq(files.userId, userId),
      eq(files.isDeleted, false),
    ];

    if (category !== "all") {
      conditions.push(eq(files.category, category));
    }

    if (search) {
      conditions.push(
        or(
          ilike(files.name, `%${search}%`),
          ilike(files.originalName, `%${search}%`)
        )
      );
    }

    if (folderId) {
      conditions.push(eq(files.folderId, folderId));
    }

    if (knowledgeBaseId) {
      conditions.push(eq(files.knowledgeBaseId, knowledgeBaseId));
    }

    // Build order by
    let orderBy;
    switch (sortBy) {
      case "name":
        orderBy = sortOrder === "asc" ? files.name : desc(files.name);
        break;
      case "size":
        orderBy = sortOrder === "asc" ? sql`${files.size}::bigint` : desc(sql`${files.size}::bigint`);
        break;
      case "type":
        orderBy = sortOrder === "asc" ? files.mimeType : desc(files.mimeType);
        break;
      default:
        orderBy = sortOrder === "asc" ? files.createdAt : desc(files.createdAt);
    }

    // Get files with user info
    const fileResults = await db
      .select({
        id: files.id,
        userId: files.userId,
        knowledgeBaseId: files.knowledgeBaseId,
        folderId: files.folderId,
        name: files.name,
        originalName: files.originalName,
        mimeType: files.mimeType,
        size: files.size,
        path: files.path,
        thumbnailPath: files.thumbnailPath,
        category: files.category,
        tags: files.tags,
        metadata: files.metadata,
        createdAt: files.createdAt,
        updatedAt: files.updatedAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(files)
      .innerJoin(users, eq(files.userId, users.id))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(files)
      .where(and(...conditions));

    // Generate URLs for files
    const filesWithUrls = await Promise.all(
      fileResults.map(async (file) => {
        const downloadUrl = await this.minioService.getFileUrl(env.MINIO_BUCKET, file.path);
        const thumbnailUrl = file.thumbnailPath
          ? await this.minioService.getFileUrl(env.MINIO_BUCKET, file.thumbnailPath)
          : undefined;

        return {
          ...file,
          size: Number(file.size),
          downloadUrl,
          thumbnailUrl,
          uploadedBy: {
            name: file.userName || "Unknown",
            email: file.userEmail || undefined,
          },
        };
      })
    );

    // Calculate summary statistics
    const summary = await this.getFilesSummary(userId);

    return {
      files: filesWithUrls,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
      summary,
    };
  }

  async getFileById(userId: string, fileId: string) {
    const [file] = await db
      .select({
        id: files.id,
        userId: files.userId,
        knowledgeBaseId: files.knowledgeBaseId,
        folderId: files.folderId,
        name: files.name,
        originalName: files.originalName,
        mimeType: files.mimeType,
        size: files.size,
        path: files.path,
        thumbnailPath: files.thumbnailPath,
        category: files.category,
        tags: files.tags,
        metadata: files.metadata,
        createdAt: files.createdAt,
        updatedAt: files.updatedAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(files)
      .innerJoin(users, eq(files.userId, users.id))
      .where(
        and(
          eq(files.id, fileId),
          eq(files.userId, userId),
          eq(files.isDeleted, false)
        )
      )
      .limit(1);

    if (!file) {
      return null;
    }

    const downloadUrl = await this.minioService.getFileUrl(env.MINIO_BUCKET, file.path);
    const thumbnailUrl = file.thumbnailPath
      ? await this.minioService.getFileUrl(env.MINIO_BUCKET, file.thumbnailPath)
      : undefined;

    return {
      ...file,
      size: Number(file.size),
      downloadUrl,
      thumbnailUrl,
      uploadedBy: {
        name: file.userName || "Unknown",
        email: file.userEmail || undefined,
      },
    };
  }

  async updateFile(userId: string, fileId: string, updates: {
    name?: string;
    description?: string;
    tags?: string[];
    folderId?: string;
    knowledgeBaseId?: string;
  }) {
    const updateData: Partial<FileDB> = {};

    if (updates.name) {
      updateData.name = updates.name;
    }

    if (updates.description !== undefined || updates.tags) {
      // Get current metadata and merge
      const [currentFile] = await db
        .select({ metadata: files.metadata })
        .from(files)
        .where(eq(files.id, fileId))
        .limit(1);

      const currentMetadata = (currentFile?.metadata as FileMetadata) || {};
      updateData.metadata = {
        ...currentMetadata,
        ...(updates.description !== undefined && { description: updates.description }),
      };
    }

    if (updates.tags) {
      updateData.tags = updates.tags;
    }

    if (updates.folderId !== undefined) {
      updateData.folderId = updates.folderId;
    }

    if (updates.knowledgeBaseId !== undefined) {
      updateData.knowledgeBaseId = updates.knowledgeBaseId;
    }

    updateData.updatedAt = new Date();

    const [updatedFile] = await db
      .update(files)
      .set(updateData)
      .where(
        and(
          eq(files.id, fileId),
          eq(files.userId, userId),
          eq(files.isDeleted, false)
        )
      )
      .returning();

    return updatedFile;
  }

  async deleteFile(userId: string, fileId: string, softDelete: boolean = true) {
    if (softDelete) {
      // Soft delete
      const [deletedFile] = await db
        .update(files)
        .set({
          isDeleted: true,
          deletedAt: new Date(),
        })
        .where(
          and(
            eq(files.id, fileId),
            eq(files.userId, userId)
          )
        )
        .returning();

      if (deletedFile) {
        // Move file to trash in MinIO
        const trashPath = this.minioService.getTrashPath(deletedFile.path);
        await this.minioService.copyFile(env.MINIO_BUCKET, deletedFile.path, env.MINIO_BUCKET, trashPath);
      }

      return deletedFile;
    } else {
      // Hard delete
      const [fileToDelete] = await db
        .select()
        .from(files)
        .where(
          and(
            eq(files.id, fileId),
            eq(files.userId, userId)
          )
        )
        .limit(1);

      if (fileToDelete) {
        // Delete from MinIO
        await this.minioService.deleteFile(env.MINIO_BUCKET, fileToDelete.path);
        if (fileToDelete.thumbnailPath) {
          await this.minioService.deleteFile(env.MINIO_BUCKET, fileToDelete.thumbnailPath);
        }

        // Delete from database
        await db
          .delete(files)
          .where(eq(files.id, fileId));
      }

      return fileToDelete;
    }
  }

  private async validateFile(file: File, knowledgeBaseId?: string): Promise<string | null> {
    // Size validation
    if (file.size > 52428800) { // 50MB
      return "File size exceeds 50MB limit";
    }

    // Type validation
    const allowedTypes = [
      "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
      "application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv"
    ];

    if (!allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported`;
    }

    // Knowledge base specific validation
    if (knowledgeBaseId) {
      const [kb] = await db
        .select()
        .from(knowledgeBases)
        .where(eq(knowledgeBases.id, knowledgeBaseId))
        .limit(1);

      if (!kb) {
        return "Knowledge base not found";
      }

      const settings = kb.settings as any;
      if (settings.maxFileSize && file.size > settings.maxFileSize) {
        return `File size exceeds knowledge base limit of ${settings.maxFileSize} bytes`;
      }

      if (settings.allowedFileTypes && settings.allowedFileTypes[0] !== "*") {
        const isAllowed = settings.allowedFileTypes.some((type: string) =>
          file.type.includes(type) || file.name.toLowerCase().endsWith(type)
        );
        if (!isAllowed) {
          return "File type not allowed in this knowledge base";
        }
      }
    }

    return null;
  }

  private categorizeFile(mimeType: string): FileCategory {
    if (mimeType.startsWith("image/")) return "images";
    if (mimeType.startsWith("audio/")) return "audio";
    if (mimeType.startsWith("video/")) return "videos";
    if (
      mimeType.includes("pdf") ||
      mimeType.includes("word") ||
      mimeType.includes("document") ||
      mimeType.includes("text") ||
      mimeType.includes("sheet") ||
      mimeType.includes("excel") ||
      mimeType.includes("csv")
    ) {
      return "documents";
    }
    return "documents"; // Default fallback
  }

  private async extractImageMetadata(buffer: Buffer): Promise<Partial<FileMetadata>> {
    try {
      const sharp = (await import("sharp")).default;
      const metadata = await sharp(buffer).metadata();
      
      return {
        dimensions: {
          width: metadata.width || 0,
          height: metadata.height || 0,
        },
      };
    } catch (error) {
      console.warn("Failed to extract image metadata:", error);
      return {};
    }
  }

  private async getFilesSummary(userId: string) {
    const result = await db
      .select({
        category: files.category,
        count: sql<number>`count(*)`,
        totalSize: sql<number>`sum(${files.size}::bigint)`,
      })
      .from(files)
      .where(
        and(
          eq(files.userId, userId),
          eq(files.isDeleted, false)
        )
      )
      .groupBy(files.category);

    const categoryBreakdown: Record<string, number> = {};
    let totalSize = 0;
    let fileCount = 0;

    for (const row of result) {
      categoryBreakdown[row.category] = row.count;
      totalSize += row.totalSize || 0;
      fileCount += row.count;
    }

    return {
      totalSize,
      fileCount,
      categoryBreakdown,
    };
  }
}
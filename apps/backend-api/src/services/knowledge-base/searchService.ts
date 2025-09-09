import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { SearchQuery } from "@athena/shared";
import { db } from "../../db";
import { files, knowledgeBases, users } from "../../db/schema";
import { MinIOFileService } from "./minioService";
import { env } from "../../config/env";

export class SearchService {
  private minioService: MinIOFileService;

  constructor() {
    this.minioService = new MinIOFileService();
  }

  async searchFiles(userId: string, query: SearchQuery) {
    const {
      q,
      filters = {},
      page = 1,
      limit = 20,
    } = query;

    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [
      eq(files.userId, userId),
      eq(files.isDeleted, false),
    ];

    // Text search across file name, original name, and metadata
    if (q) {
      conditions.push(
        or(
          ilike(files.name, `%${q}%`),
          ilike(files.originalName, `%${q}%`),
          sql`${files.metadata}->>'description' ILIKE ${`%${q}%`}`,
          sql`${files.metadata}->>'extractedText' ILIKE ${`%${q}%`}`
        )
      );
    }

    // File type filters
    if (filters.fileType && filters.fileType.length > 0) {
      const typeConditions = filters.fileType.map(type => 
        ilike(files.mimeType, `%${type}%`)
      );
      conditions.push(or(...typeConditions));
    }

    // Size filters
    if (filters.size) {
      if (filters.size.min !== undefined) {
        conditions.push(sql`${files.size}::bigint >= ${filters.size.min}`);
      }
      if (filters.size.max !== undefined) {
        conditions.push(sql`${files.size}::bigint <= ${filters.size.max}`);
      }
    }

    // Date range filters
    if (filters.dateRange) {
      if (filters.dateRange.from) {
        conditions.push(sql`${files.createdAt} >= ${new Date(filters.dateRange.from)}`);
      }
      if (filters.dateRange.to) {
        conditions.push(sql`${files.createdAt} <= ${new Date(filters.dateRange.to)}`);
      }
    }

    // Knowledge base filter
    if (filters.knowledgeBaseId) {
      conditions.push(eq(files.knowledgeBaseId, filters.knowledgeBaseId));
    }

    // Uploaded by filter
    if (filters.uploadedBy) {
      conditions.push(eq(files.userId, filters.uploadedBy));
    }

    // Get search results with user info
    const searchResults = await db
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
        knowledgeBaseName: knowledgeBases.name,
      })
      .from(files)
      .innerJoin(users, eq(files.userId, users.id))
      .leftJoin(knowledgeBases, eq(files.knowledgeBaseId, knowledgeBases.id))
      .where(and(...conditions))
      .orderBy(desc(files.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(files)
      .where(and(...conditions));

    // Generate URLs for files
    const filesWithUrls = await Promise.all(
      searchResults.map(async (file) => {
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
          knowledgeBase: file.knowledgeBaseName ? {
            id: file.knowledgeBaseId!,
            name: file.knowledgeBaseName,
          } : undefined,
        };
      })
    );

    return {
      results: filesWithUrls,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
      query: q,
      filters,
    };
  }

  async findSimilarFiles(userId: string, fileId: string, limit: number = 10) {
    // Get the source file
    const [sourceFile] = await db
      .select()
      .from(files)
      .where(
        and(
          eq(files.id, fileId),
          eq(files.userId, userId),
          eq(files.isDeleted, false)
        )
      )
      .limit(1);

    if (!sourceFile) {
      return [];
    }

    // Find files with similar characteristics
    const conditions = [
      eq(files.userId, userId),
      eq(files.isDeleted, false),
      sql`${files.id} != ${fileId}`, // Exclude the source file
    ];

    // Same file type
    conditions.push(eq(files.mimeType, sourceFile.mimeType));

    // Similar size (within 50% range)
    const sourceSize = Number(sourceFile.size);
    const sizeVariance = sourceSize * 0.5;
    conditions.push(
      and(
        sql`${files.size}::bigint >= ${sourceSize - sizeVariance}`,
        sql`${files.size}::bigint <= ${sourceSize + sizeVariance}`
      )
    );

    const similarFiles = await db
      .select({
        id: files.id,
        userId: files.userId,
        knowledgeBaseId: files.knowledgeBaseId,
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
      .orderBy(desc(files.createdAt))
      .limit(limit);

    // Generate URLs for files
    const filesWithUrls = await Promise.all(
      similarFiles.map(async (file) => {
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
          similarity: this.calculateSimilarity(sourceFile, file),
        };
      })
    );

    // Sort by similarity score
    return filesWithUrls.sort((a, b) => b.similarity - a.similarity);
  }

  async getRecentFiles(userId: string, limit: number = 10) {
    const recentFiles = await db
      .select({
        id: files.id,
        userId: files.userId,
        knowledgeBaseId: files.knowledgeBaseId,
        name: files.name,
        originalName: files.originalName,
        mimeType: files.mimeType,
        size: files.size,
        path: files.path,
        thumbnailPath: files.thumbnailPath,
        category: files.category,
        createdAt: files.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(files)
      .innerJoin(users, eq(files.userId, users.id))
      .where(
        and(
          eq(files.userId, userId),
          eq(files.isDeleted, false)
        )
      )
      .orderBy(desc(files.createdAt))
      .limit(limit);

    // Generate URLs for files
    return await Promise.all(
      recentFiles.map(async (file) => {
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
  }

  async getPopularFiles(userId: string, limit: number = 10) {
    // For now, we'll use most recent files as "popular"
    // In a real implementation, you'd track download counts or view counts
    return await this.getRecentFiles(userId, limit);
  }

  private calculateSimilarity(sourceFile: any, targetFile: any): number {
    let score = 0;

    // Same MIME type adds significant similarity
    if (sourceFile.mimeType === targetFile.mimeType) {
      score += 50;
    }

    // Similar file size
    const sourceSizeNum = Number(sourceFile.size);
    const targetSizeNum = Number(targetFile.size);
    const sizeDiff = Math.abs(sourceSizeNum - targetSizeNum);
    const avgSize = (sourceSizeNum + targetSizeNum) / 2;
    const sizeScore = Math.max(0, 30 - (sizeDiff / avgSize) * 30);
    score += sizeScore;

    // Same category
    if (sourceFile.category === targetFile.category) {
      score += 10;
    }

    // Common tags
    const sourceTags = sourceFile.tags || [];
    const targetTags = targetFile.tags || [];
    const commonTags = sourceTags.filter((tag: string) => targetTags.includes(tag));
    score += commonTags.length * 2;

    // Same knowledge base
    if (sourceFile.knowledgeBaseId && sourceFile.knowledgeBaseId === targetFile.knowledgeBaseId) {
      score += 5;
    }

    return Math.min(100, score);
  }
}
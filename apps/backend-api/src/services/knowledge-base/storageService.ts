import { and, desc, eq, sql } from "drizzle-orm";
import type { StorageStatsResponse } from "@athena/shared";
import { db } from "../../db";
import { files, knowledgeBases, users } from "../../db/schema";
import { MinIOFileService } from "./minioService";
import { env } from "../../config/env";

export class StorageService {
  private minioService: MinIOFileService;

  constructor() {
    this.minioService = new MinIOFileService();
  }

  async getStorageStats(userId: string): Promise<StorageStatsResponse> {
    // Get user's total storage usage
    const [userStats] = await db
      .select({
        totalFiles: sql<number>`count(*)`,
        totalSize: sql<number>`coalesce(sum(${files.size}::bigint), 0)`,
      })
      .from(files)
      .where(
        and(
          eq(files.userId, userId),
          eq(files.isDeleted, false)
        )
      );

    // Get breakdown by category
    const categoryStats = await db
      .select({
        category: files.category,
        count: sql<number>`count(*)`,
        size: sql<number>`coalesce(sum(${files.size}::bigint), 0)`,
      })
      .from(files)
      .where(
        and(
          eq(files.userId, userId),
          eq(files.isDeleted, false)
        )
      )
      .groupBy(files.category);

    // Get knowledge base storage
    const kbStats = await db
      .select({
        kbId: files.knowledgeBaseId,
        kbName: knowledgeBases.name,
        count: sql<number>`count(*)`,
        size: sql<number>`coalesce(sum(${files.size}::bigint), 0)`,
      })
      .from(files)
      .leftJoin(knowledgeBases, eq(files.knowledgeBaseId, knowledgeBases.id))
      .where(
        and(
          eq(files.userId, userId),
          eq(files.isDeleted, false)
        )
      )
      .groupBy(files.knowledgeBaseId, knowledgeBases.name);

    // Get recent activity
    const recentActivity = await db
      .select({
        fileName: files.name,
        action: sql<string>`'upload'`, // We'll track more actions in the future
        timestamp: files.createdAt,
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
      .limit(10);

    // Calculate breakdown
    const breakdown = {
      files: 0,
      knowledgeBases: 0,
      thumbnails: 0,
      temp: 0,
      trash: 0,
    };

    for (const stat of categoryStats) {
      breakdown.files += Number(stat.size);
    }

    // Estimate thumbnails (assume 10% of image files size for thumbnails)
    const imageStats = categoryStats.find(s => s.category === "images");
    if (imageStats) {
      breakdown.thumbnails = Math.round(Number(imageStats.size) * 0.1);
    }

    // Knowledge bases storage
    for (const stat of kbStats) {
      if (stat.kbId) {
        breakdown.knowledgeBases += Number(stat.size);
      }
    }

    // Get deleted files size (trash)
    const [trashStats] = await db
      .select({
        trashSize: sql<number>`coalesce(sum(${files.size}::bigint), 0)`,
      })
      .from(files)
      .where(
        and(
          eq(files.userId, userId),
          eq(files.isDeleted, true)
        )
      );

    breakdown.trash = Number(trashStats?.trashSize || 0);

    return {
      totalUsed: Number(userStats?.totalSize || 0),
      totalLimit: 1073741824, // 1GB default limit
      breakdown,
      recentActivity: recentActivity.map(activity => ({
        action: activity.action as any,
        fileName: activity.fileName,
        timestamp: activity.timestamp.toISOString(),
        user: {
          name: activity.userName || "Unknown",
          email: activity.userEmail || undefined,
        },
      })),
    };
  }

  async cleanupTempFiles(userId: string): Promise<{
    success: boolean;
    filesDeleted: number;
    spaceFreed: number;
  }> {
    try {
      // Find temp files older than 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const tempFiles = await db
        .select()
        .from(files)
        .where(
          and(
            eq(files.userId, userId),
            sql`${files.path} LIKE 'temp/%'`,
            sql`${files.createdAt} < ${oneDayAgo}`
          )
        );

      let filesDeleted = 0;
      let spaceFreed = 0;

      for (const file of tempFiles) {
        try {
          // Delete from MinIO
          await this.minioService.deleteFile(env.MINIO_BUCKET, file.path);
          
          // Delete from database
          await db
            .delete(files)
            .where(eq(files.id, file.id));

          filesDeleted++;
          spaceFreed += Number(file.size);
        } catch (error) {
          console.error(`Failed to delete temp file ${file.id}:`, error);
        }
      }

      return {
        success: true,
        filesDeleted,
        spaceFreed,
      };
    } catch (error) {
      console.error("Cleanup temp files error:", error);
      return {
        success: false,
        filesDeleted: 0,
        spaceFreed: 0,
      };
    }
  }

  async emptyTrash(userId: string): Promise<{
    success: boolean;
    filesDeleted: number;
    spaceFreed: number;
  }> {
    try {
      // Find all deleted files
      const deletedFiles = await db
        .select()
        .from(files)
        .where(
          and(
            eq(files.userId, userId),
            eq(files.isDeleted, true)
          )
        );

      let filesDeleted = 0;
      let spaceFreed = 0;

      for (const file of deletedFiles) {
        try {
          // Delete from MinIO (both original and trash locations)
          await this.minioService.deleteFile(env.MINIO_BUCKET, file.path);
          
          const trashPath = this.minioService.getTrashPath(file.path);
          await this.minioService.deleteFile(env.MINIO_BUCKET, trashPath);

          // Delete thumbnail if exists
          if (file.thumbnailPath) {
            await this.minioService.deleteFile(env.MINIO_BUCKET, file.thumbnailPath);
          }

          // Delete from database
          await db
            .delete(files)
            .where(eq(files.id, file.id));

          filesDeleted++;
          spaceFreed += Number(file.size);
        } catch (error) {
          console.error(`Failed to permanently delete file ${file.id}:`, error);
        }
      }

      return {
        success: true,
        filesDeleted,
        spaceFreed,
      };
    } catch (error) {
      console.error("Empty trash error:", error);
      return {
        success: false,
        filesDeleted: 0,
        spaceFreed: 0,
      };
    }
  }

  async restoreFromTrash(userId: string, fileId: string): Promise<boolean> {
    try {
      const [file] = await db
        .select()
        .from(files)
        .where(
          and(
            eq(files.id, fileId),
            eq(files.userId, userId),
            eq(files.isDeleted, true)
          )
        )
        .limit(1);

      if (!file) {
        return false;
      }

      // Move file back from trash in MinIO
      const trashPath = this.minioService.getTrashPath(file.path);
      const exists = await this.minioService.fileExists(env.MINIO_BUCKET, trashPath);
      
      if (exists) {
        await this.minioService.copyFile(env.MINIO_BUCKET, trashPath, env.MINIO_BUCKET, file.path);
        await this.minioService.deleteFile(env.MINIO_BUCKET, trashPath);
      }

      // Restore in database
      await db
        .update(files)
        .set({
          isDeleted: false,
          deletedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(files.id, fileId));

      return true;
    } catch (error) {
      console.error("Restore from trash error:", error);
      return false;
    }
  }

  async getTrashFiles(userId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const trashFiles = await db
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
        deletedAt: files.deletedAt,
        createdAt: files.createdAt,
        updatedAt: files.updatedAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(files)
      .innerJoin(users, eq(files.userId, users.id))
      .where(
        and(
          eq(files.userId, userId),
          eq(files.isDeleted, true)
        )
      )
      .orderBy(desc(files.deletedAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(files)
      .where(
        and(
          eq(files.userId, userId),
          eq(files.isDeleted, true)
        )
      );

    return {
      files: trashFiles.map(file => ({
        ...file,
        size: Number(file.size),
        uploadedBy: {
          name: file.userName || "Unknown",
          email: file.userEmail || undefined,
        },
      })),
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async getDuplicateFiles(userId: string): Promise<Array<{
    originalFile: any;
    duplicates: any[];
    potentialSavings: number;
  }>> {
    // Find files with same size and MIME type (potential duplicates)
    const potentialDuplicates = await db
      .select({
        size: files.size,
        mimeType: files.mimeType,
        files: sql<any[]>`array_agg(json_build_object(
          'id', ${files.id},
          'name', ${files.name},
          'originalName', ${files.originalName},
          'path', ${files.path},
          'createdAt', ${files.createdAt}
        ) ORDER BY ${files.createdAt})`,
      })
      .from(files)
      .where(
        and(
          eq(files.userId, userId),
          eq(files.isDeleted, false)
        )
      )
      .groupBy(files.size, files.mimeType)
      .having(sql`count(*) > 1`);

    const duplicateGroups = [];

    for (const group of potentialDuplicates) {
      const groupFiles = group.files as any[];
      if (groupFiles.length > 1) {
        const [original, ...duplicates] = groupFiles;
        const potentialSavings = Number(group.size) * duplicates.length;

        duplicateGroups.push({
          originalFile: original,
          duplicates,
          potentialSavings,
        });
      }
    }

    return duplicateGroups;
  }

  async optimizeStorage(userId: string): Promise<{
    tempFilesCleanup: { filesDeleted: number; spaceFreed: number; };
    duplicatesFound: number;
    totalPotentialSavings: number;
    recommendations: string[];
  }> {
    // Clean up temp files
    const tempCleanup = await this.cleanupTempFiles(userId);

    // Find duplicates
    const duplicates = await this.getDuplicateFiles(userId);
    const totalPotentialSavings = duplicates.reduce((sum, group) => sum + group.potentialSavings, 0);

    // Generate recommendations
    const recommendations: string[] = [];

    if (tempCleanup.filesDeleted > 0) {
      recommendations.push(`Cleaned up ${tempCleanup.filesDeleted} temporary files`);
    }

    if (duplicates.length > 0) {
      recommendations.push(`Found ${duplicates.length} groups of potential duplicate files`);
      recommendations.push(`Consider reviewing and removing duplicates to save ${Math.round(totalPotentialSavings / 1024 / 1024)} MB`);
    }

    // Check trash size
    const stats = await this.getStorageStats(userId);
    if (stats.breakdown.trash > 1024 * 1024) { // More than 1MB in trash
      recommendations.push(`Empty trash to free up ${Math.round(stats.breakdown.trash / 1024 / 1024)} MB`);
    }

    return {
      tempFilesCleanup: {
        filesDeleted: tempCleanup.filesDeleted,
        spaceFreed: tempCleanup.spaceFreed,
      },
      duplicatesFound: duplicates.length,
      totalPotentialSavings,
      recommendations,
    };
  }
}
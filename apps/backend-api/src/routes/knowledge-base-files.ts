import { Elysia, t } from "elysia";
import type { FileListQuery, FileUploadRequest, SearchQuery } from "@athena/shared";
import { FileService } from "../services/knowledge-base/fileService";
import { MinIOFileService } from "../services/knowledge-base/minioService";
import { SearchService } from "../services/knowledge-base/searchService";
import { env } from "../config/env";

const fileService = new FileService();
const minioService = new MinIOFileService();
const searchService = new SearchService();

export const knowledgeBaseFilesRoutes = new Elysia({ prefix: "/kb-files" })
  // File upload endpoint
  .post(
    "/upload",
    async ({ body, set, query }) => {
      try {
        const { userId } = query;

        if (!userId) {
          set.status = 401;
          return {
            success: false,
            error: "User ID required",
          };
        }

        // Handle files from multipart form data
        const files = Array.isArray(body.files) ? body.files : [body.files].filter(Boolean);
        
        if (!files || files.length === 0) {
          set.status = 400;
          return {
            success: false,
            error: "No files provided",
          };
        }

        const uploadRequest: FileUploadRequest = {
          files: files as File[],
          knowledgeBaseId: body.knowledgeBaseId,
          folderId: body.folderId,
          metadata: {
            description: body.description,
            tags: body.tags ? JSON.parse(body.tags as string) : [],
            category: body.category,
          },
        };

        const result = await fileService.uploadFiles(userId, uploadRequest);
        
        if (!result.success && result.errors?.length) {
          set.status = 400;
        }

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        console.error("File upload error:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to upload files",
        };
      }
    },
    {
      body: t.Object({
        files: t.Union([t.File(), t.Array(t.File())]),
        knowledgeBaseId: t.Optional(t.String()),
        folderId: t.Optional(t.String()),
        description: t.Optional(t.String()),
        tags: t.Optional(t.String()), // JSON string
        category: t.Optional(t.String()),
      }),
      query: t.Object({
        userId: t.String(),
      }),
    }
  )

  // Presigned upload URL endpoint
  .post(
    "/upload/presigned",
    async ({ body, set, query }) => {
      try {
        const { userId } = query;

        if (!userId) {
          set.status = 401;
          return {
            success: false,
            error: "User ID required",
          };
        }

        const { fileName, fileSize, mimeType, folderId, knowledgeBaseId } = body;

        // Validate file size
        if (fileSize > 52428800) { // 50MB
          set.status = 400;
          return {
            success: false,
            error: "File size exceeds 50MB limit",
          };
        }

        // Generate object path
        let objectPath: string;
        if (knowledgeBaseId) {
          objectPath = minioService.getKnowledgeBasePath(knowledgeBaseId, fileName);
        } else {
          const category = mimeType.startsWith("image/") ? "images" : "documents";
          objectPath = minioService.getFilePath(category, fileName);
        }

        const result = await minioService.getPresignedUploadUrl(
          env.MINIO_BUCKET,
          objectPath,
          15 * 60 // 15 minutes
        );

        return {
          success: true,
          ...result,
        };
      } catch (error) {
        console.error("Presigned upload error:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to generate presigned upload URL",
        };
      }
    },
    {
      body: t.Object({
        fileName: t.String(),
        fileSize: t.Number(),
        mimeType: t.String(),
        folderId: t.Optional(t.String()),
        knowledgeBaseId: t.Optional(t.String()),
      }),
      query: t.Object({
        userId: t.String(),
      }),
    }
  )

  // List files endpoint
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const { userId, ...queryParams } = query;

        if (!userId) {
          set.status = 401;
          return {
            success: false,
            error: "User ID required",
          };
        }

        const listQuery: FileListQuery = {
          page: queryParams.page ? Number(queryParams.page) : undefined,
          limit: queryParams.limit ? Number(queryParams.limit) : undefined,
          category: queryParams.category as any,
          search: queryParams.search,
          folderId: queryParams.folderId,
          knowledgeBaseId: queryParams.knowledgeBaseId,
          sortBy: queryParams.sortBy as any,
          sortOrder: queryParams.sortOrder as any,
        };

        const result = await fileService.getFiles(userId, listQuery);
        
        return {
          success: true,
          data: result,
        };
      } catch (error) {
        console.error("List files error:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to retrieve files",
        };
      }
    },
    {
      query: t.Object({
        userId: t.String(),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        category: t.Optional(t.String()),
        search: t.Optional(t.String()),
        folderId: t.Optional(t.String()),
        knowledgeBaseId: t.Optional(t.String()),
        sortBy: t.Optional(t.String()),
        sortOrder: t.Optional(t.String()),
      }),
    }
  )

  // Get file details endpoint
  .get(
    "/:id",
    async ({ params, query, set }) => {
      try {
        const { id } = params;
        const { userId } = query;

        if (!userId) {
          set.status = 401;
          return {
            success: false,
            error: "User ID required",
          };
        }

        const file = await fileService.getFileById(userId, id);

        if (!file) {
          set.status = 404;
          return {
            success: false,
            error: "File not found",
          };
        }

        return {
          success: true,
          file,
        };
      } catch (error) {
        console.error("Get file error:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to retrieve file",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        userId: t.String(),
      }),
    }
  )

  // Update file endpoint
  .put(
    "/:id",
    async ({ params, body, query, set }) => {
      try {
        const { id } = params;
        const { userId } = query;

        if (!userId) {
          set.status = 401;
          return {
            success: false,
            error: "User ID required",
          };
        }

        const updatedFile = await fileService.updateFile(userId, id, body);

        if (!updatedFile) {
          set.status = 404;
          return {
            success: false,
            error: "File not found or not authorized",
          };
        }

        return {
          success: true,
          file: updatedFile,
        };
      } catch (error) {
        console.error("Update file error:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to update file",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        tags: t.Optional(t.Array(t.String())),
        folderId: t.Optional(t.String()),
        knowledgeBaseId: t.Optional(t.String()),
      }),
      query: t.Object({
        userId: t.String(),
      }),
    }
  )

  // Delete file endpoint
  .delete(
    "/:id",
    async ({ params, query, set }) => {
      try {
        const { id } = params;
        const { userId, hard } = query;

        if (!userId) {
          set.status = 401;
          return {
            success: false,
            error: "User ID required",
          };
        }

        const deletedFile = await fileService.deleteFile(
          userId,
          id,
          hard !== "true"
        );

        if (!deletedFile) {
          set.status = 404;
          return {
            success: false,
            error: "File not found or not authorized",
          };
        }

        return {
          success: true,
          message: hard === "true" ? "File permanently deleted" : "File moved to trash",
          deletedAt: new Date().toISOString(),
        };
      } catch (error) {
        console.error("Delete file error:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to delete file",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        userId: t.String(),
        hard: t.Optional(t.String()),
      }),
    }
  )

  // Download file endpoint
  .get(
    "/:id/download",
    async ({ params, query, set }) => {
      try {
        const { id } = params;
        const { userId } = query;

        if (!userId) {
          set.status = 401;
          return {
            success: false,
            error: "User ID required",
          };
        }

        const file = await fileService.getFileById(userId, id);

        if (!file) {
          set.status = 404;
          return {
            success: false,
            error: "File not found",
          };
        }

        // Download file from MinIO
        const fileBuffer = await minioService.downloadFile(env.MINIO_BUCKET, file.path);

        // Set appropriate headers
        set.headers["Content-Type"] = file.mimeType;
        set.headers["Content-Length"] = file.size.toString();
        set.headers["Content-Disposition"] = `attachment; filename="${file.originalName}"`;

        return new Response(fileBuffer, {
          headers: set.headers,
        });
      } catch (error) {
        console.error("Download file error:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to download file",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        userId: t.String(),
      }),
    }
  )

  // Search files endpoint
  .get(
    "/search",
    async ({ query, set }) => {
      try {
        const { userId, q, ...filterParams } = query;

        if (!userId) {
          set.status = 401;
          return {
            success: false,
            error: "User ID required",
          };
        }

        if (!q) {
          set.status = 400;
          return {
            success: false,
            error: "Search query required",
          };
        }

        // Parse filters
        const filters: SearchQuery["filters"] = {};
        
        if (filterParams.fileType) {
          filters.fileType = filterParams.fileType.split(',');
        }
        
        if (filterParams.sizeMin || filterParams.sizeMax) {
          filters.size = {
            min: filterParams.sizeMin ? Number(filterParams.sizeMin) : undefined,
            max: filterParams.sizeMax ? Number(filterParams.sizeMax) : undefined,
          };
        }
        
        if (filterParams.dateFrom || filterParams.dateTo) {
          filters.dateRange = {
            from: filterParams.dateFrom,
            to: filterParams.dateTo,
          };
        }
        
        if (filterParams.knowledgeBaseId) {
          filters.knowledgeBaseId = filterParams.knowledgeBaseId;
        }
        
        if (filterParams.uploadedBy) {
          filters.uploadedBy = filterParams.uploadedBy;
        }

        const searchQuery: SearchQuery = {
          q,
          filters,
          page: filterParams.page ? Number(filterParams.page) : undefined,
          limit: filterParams.limit ? Number(filterParams.limit) : undefined,
        };

        const result = await searchService.searchFiles(userId, searchQuery);

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        console.error("Search files error:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to search files",
        };
      }
    },
    {
      query: t.Object({
        userId: t.String(),
        q: t.String(),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        fileType: t.Optional(t.String()),
        sizeMin: t.Optional(t.String()),
        sizeMax: t.Optional(t.String()),
        dateFrom: t.Optional(t.String()),
        dateTo: t.Optional(t.String()),
        knowledgeBaseId: t.Optional(t.String()),
        uploadedBy: t.Optional(t.String()),
      }),
    }
  )

  // Find similar files endpoint
  .get(
    "/:id/similar",
    async ({ params, query, set }) => {
      try {
        const { id } = params;
        const { userId, limit } = query;

        if (!userId) {
          set.status = 401;
          return {
            success: false,
            error: "User ID required",
          };
        }

        const similarFiles = await searchService.findSimilarFiles(
          userId,
          id,
          limit ? Number(limit) : undefined
        );

        return {
          success: true,
          data: similarFiles,
        };
      } catch (error) {
        console.error("Find similar files error:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to find similar files",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        userId: t.String(),
        limit: t.Optional(t.String()),
      }),
    }
  )

  // Get recent files endpoint
  .get(
    "/recent",
    async ({ query, set }) => {
      try {
        const { userId, limit } = query;

        if (!userId) {
          set.status = 401;
          return {
            success: false,
            error: "User ID required",
          };
        }

        const recentFiles = await searchService.getRecentFiles(
          userId,
          limit ? Number(limit) : undefined
        );

        return {
          success: true,
          data: recentFiles,
        };
      } catch (error) {
        console.error("Get recent files error:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to retrieve recent files",
        };
      }
    },
    {
      query: t.Object({
        userId: t.String(),
        limit: t.Optional(t.String()),
      }),
    }
  )

  // Get popular files endpoint
  .get(
    "/popular",
    async ({ query, set }) => {
      try {
        const { userId, limit } = query;

        if (!userId) {
          set.status = 401;
          return {
            success: false,
            error: "User ID required",
          };
        }

        const popularFiles = await searchService.getPopularFiles(
          userId,
          limit ? Number(limit) : undefined
        );

        return {
          success: true,
          data: popularFiles,
        };
      } catch (error) {
        console.error("Get popular files error:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to retrieve popular files",
        };
      }
    },
    {
      query: t.Object({
        userId: t.String(),
        limit: t.Optional(t.String()),
      }),
    }
  );
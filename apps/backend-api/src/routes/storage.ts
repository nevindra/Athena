import { Elysia, t } from "elysia";
import { StorageService } from "../services/knowledge-base/storageService";

const storageService = new StorageService();

export const storageRoutes = new Elysia({ prefix: "/storage" })
  // Get storage statistics
  .get(
    "/stats",
    async ({ query, set }) => {
      try {
        const { userId } = query;

        if (!userId) {
          set.status = 401;
          return {
            success: false,
            error: "User ID required",
          };
        }

        const stats = await storageService.getStorageStats(userId);

        return {
          success: true,
          ...stats,
        };
      } catch (error) {
        console.error("Get storage stats error:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to retrieve storage statistics",
        };
      }
    },
    {
      query: t.Object({
        userId: t.String(),
      }),
    }
  )

  // Clean up temporary files
  .post(
    "/cleanup/temp",
    async ({ query, set }) => {
      try {
        const { userId } = query;

        if (!userId) {
          set.status = 401;
          return {
            success: false,
            error: "User ID required",
          };
        }

        const result = await storageService.cleanupTempFiles(userId);

        return {
          success: result.success,
          message: `Cleaned up ${result.filesDeleted} temporary files`,
          filesDeleted: result.filesDeleted,
          spaceFreed: result.spaceFreed,
        };
      } catch (error) {
        console.error("Cleanup temp files error:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to cleanup temporary files",
        };
      }
    },
    {
      query: t.Object({
        userId: t.String(),
      }),
    }
  )

  // Empty trash
  .post(
    "/cleanup/trash",
    async ({ query, set }) => {
      try {
        const { userId } = query;

        if (!userId) {
          set.status = 401;
          return {
            success: false,
            error: "User ID required",
          };
        }

        const result = await storageService.emptyTrash(userId);

        return {
          success: result.success,
          message: `Permanently deleted ${result.filesDeleted} files from trash`,
          filesDeleted: result.filesDeleted,
          spaceFreed: result.spaceFreed,
        };
      } catch (error) {
        console.error("Empty trash error:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to empty trash",
        };
      }
    },
    {
      query: t.Object({
        userId: t.String(),
      }),
    }
  )

  // Get trash files
  .get(
    "/trash",
    async ({ query, set }) => {
      try {
        const { userId, page, limit } = query;

        if (!userId) {
          set.status = 401;
          return {
            success: false,
            error: "User ID required",
          };
        }

        const result = await storageService.getTrashFiles(
          userId,
          page ? Number(page) : undefined,
          limit ? Number(limit) : undefined
        );

        return {
          success: true,
          ...result,
        };
      } catch (error) {
        console.error("Get trash files error:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to retrieve trash files",
        };
      }
    },
    {
      query: t.Object({
        userId: t.String(),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    }
  )

  // Restore file from trash
  .post(
    "/trash/:id/restore",
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

        const success = await storageService.restoreFromTrash(userId, id);

        if (!success) {
          set.status = 404;
          return {
            success: false,
            error: "File not found in trash or not authorized",
          };
        }

        return {
          success: true,
          message: "File restored from trash successfully",
        };
      } catch (error) {
        console.error("Restore from trash error:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to restore file from trash",
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

  // Find duplicate files
  .get(
    "/duplicates",
    async ({ query, set }) => {
      try {
        const { userId } = query;

        if (!userId) {
          set.status = 401;
          return {
            success: false,
            error: "User ID required",
          };
        }

        const duplicates = await storageService.getDuplicateFiles(userId);

        return {
          success: true,
          duplicates,
          totalGroups: duplicates.length,
          totalPotentialSavings: duplicates.reduce((sum, group) => sum + group.potentialSavings, 0),
        };
      } catch (error) {
        console.error("Find duplicates error:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to find duplicate files",
        };
      }
    },
    {
      query: t.Object({
        userId: t.String(),
      }),
    }
  )

  // Optimize storage
  .post(
    "/optimize",
    async ({ query, set }) => {
      try {
        const { userId } = query;

        if (!userId) {
          set.status = 401;
          return {
            success: false,
            error: "User ID required",
          };
        }

        const result = await storageService.optimizeStorage(userId);

        return {
          success: true,
          message: "Storage optimization completed",
          ...result,
        };
      } catch (error) {
        console.error("Optimize storage error:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to optimize storage",
        };
      }
    },
    {
      query: t.Object({
        userId: t.String(),
      }),
    }
  );
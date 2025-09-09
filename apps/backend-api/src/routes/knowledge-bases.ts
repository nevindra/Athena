import { Elysia, t } from "elysia";
import type {
  CreateKnowledgeBaseRequest,
  UpdateKnowledgeBaseRequest,
} from "@athena/shared";
import { KnowledgeBaseService } from "../services/knowledge-base/knowledgeBaseService";

const knowledgeBaseService = new KnowledgeBaseService();

export const knowledgeBasesRoutes = new Elysia({ prefix: "/knowledge-bases" })
  // Create knowledge base
  .post(
    "/",
    async ({ body, query, set }) => {
      try {
        const { userId } = query;

        if (!userId) {
          set.status = 401;
          return {
            success: false,
            error: "User ID required",
          };
        }

        const request: CreateKnowledgeBaseRequest = {
          name: body.name,
          description: body.description,
          parentId: body.parentId,
          settings: body.settings,
        };

        const knowledgeBase = await knowledgeBaseService.createKnowledgeBase(
          userId,
          request
        );

        return {
          success: true,
          data: knowledgeBase,
        };
      } catch (error) {
        console.error("Create knowledge base error:", error);
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to create knowledge base",
        };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
        parentId: t.Optional(t.String()),
        settings: t.Optional(
          t.Object({
            isPublic: t.Optional(t.Boolean()),
            allowedFileTypes: t.Optional(t.Array(t.String())),
            maxFileSize: t.Optional(t.Number()),
          })
        ),
      }),
      query: t.Object({
        userId: t.String(),
      }),
    }
  )

  // List knowledge bases
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const { userId, page, limit, parentId, includeChildren, hierarchy } = query;

        if (!userId) {
          set.status = 401;
          return {
            success: false,
            error: "User ID required",
          };
        }

        // Handle hierarchy view
        if (hierarchy === "true") {
          const hierarchyResult = await knowledgeBaseService.getKnowledgeBaseHierarchy(userId);
          return {
            success: true,
            data: hierarchyResult,
          };
        }

        // Handle paginated list
        const result = await knowledgeBaseService.getKnowledgeBases(userId, {
          page: page ? Number(page) : undefined,
          limit: limit ? Number(limit) : undefined,
          parentId: parentId === "null" ? null : parentId,
          includeChildren: includeChildren === "true",
        });

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        console.error("List knowledge bases error:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to retrieve knowledge bases",
        };
      }
    },
    {
      query: t.Object({
        userId: t.String(),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        parentId: t.Optional(t.String()),
        includeChildren: t.Optional(t.String()),
        hierarchy: t.Optional(t.String()),
      }),
    }
  )

  // Get knowledge base by ID
  .get(
    "/:id",
    async ({ params, query, set }) => {
      try {
        const { id } = params;
        const { userId, includeChildren } = query;

        if (!userId) {
          set.status = 401;
          return {
            success: false,
            error: "User ID required",
          };
        }

        const knowledgeBase = await knowledgeBaseService.getKnowledgeBaseById(
          userId,
          id,
          includeChildren === "true"
        );

        if (!knowledgeBase) {
          set.status = 404;
          return {
            success: false,
            error: "Knowledge base not found",
          };
        }

        return {
          success: true,
          data: knowledgeBase,
        };
      } catch (error) {
        console.error("Get knowledge base error:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to retrieve knowledge base",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        userId: t.String(),
        includeChildren: t.Optional(t.String()),
      }),
    }
  )

  // Update knowledge base
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

        const updates: UpdateKnowledgeBaseRequest = {
          name: body.name,
          description: body.description,
          parentId: body.parentId,
          settings: body.settings,
        };

        const knowledgeBase = await knowledgeBaseService.updateKnowledgeBase(
          userId,
          id,
          updates
        );

        if (!knowledgeBase) {
          set.status = 404;
          return {
            success: false,
            error: "Knowledge base not found or not authorized",
          };
        }

        return {
          success: true,
          data: knowledgeBase,
        };
      } catch (error) {
        console.error("Update knowledge base error:", error);
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to update knowledge base",
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
        parentId: t.Optional(t.String()),
        settings: t.Optional(
          t.Object({
            isPublic: t.Optional(t.Boolean()),
            allowedFileTypes: t.Optional(t.Array(t.String())),
            maxFileSize: t.Optional(t.Number()),
          })
        ),
      }),
      query: t.Object({
        userId: t.String(),
      }),
    }
  )

  // Delete knowledge base
  .delete(
    "/:id",
    async ({ params, query, set }) => {
      try {
        const { id } = params;
        const { userId, deleteFiles } = query;

        if (!userId) {
          set.status = 401;
          return {
            success: false,
            error: "User ID required",
          };
        }

        const success = await knowledgeBaseService.deleteKnowledgeBase(userId, id, {
          deleteFiles: deleteFiles === "true",
        });

        if (!success) {
          set.status = 404;
          return {
            success: false,
            error: "Knowledge base not found or not authorized",
          };
        }

        return {
          success: true,
          message: "Knowledge base deleted successfully",
        };
      } catch (error) {
        console.error("Delete knowledge base error:", error);
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to delete knowledge base",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        userId: t.String(),
        deleteFiles: t.Optional(t.String()),
      }),
    }
  )

  // Get knowledge base statistics
  .get(
    "/:id/stats",
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

        const knowledgeBase = await knowledgeBaseService.getKnowledgeBaseById(
          userId,
          id,
          false
        );

        if (!knowledgeBase) {
          set.status = 404;
          return {
            success: false,
            error: "Knowledge base not found",
          };
        }

        return {
          success: true,
          data: knowledgeBase.stats,
        };
      } catch (error) {
        console.error("Get knowledge base stats error:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to retrieve knowledge base statistics",
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
  );
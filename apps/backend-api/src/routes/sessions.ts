import { Elysia, t } from "elysia";
import {
  handleAddMessage,
  handleCreateSession,
  handleDeleteSession,
  handleGetSession,
  handleGetUserSessions,
  handleUpdateSession,
} from "../controllers/sessionController";

export const sessionRoutes = new Elysia({ prefix: "/sessions" })
  .post(
    "/",
    async ({ body }) => {
      try {
        const session = await handleCreateSession(body);
        return {
          success: true,
          data: session,
        };
      } catch (error) {
        console.error("Create session error:", error);
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to create session",
        };
      }
    },
    {
      body: t.Object({
        userId: t.String(),
        configurationId: t.String(),
        initialMessage: t.Optional(t.String()),
        title: t.Optional(t.String()),
      }),
      response: t.Object({
        success: t.Boolean(),
        data: t.Optional(
          t.Object({
            id: t.String(),
            userId: t.String(),
            configurationId: t.String(),
            title: t.Optional(t.String()),
            createdAt: t.Date(),
            updatedAt: t.Date(),
          })
        ),
        error: t.Optional(t.String()),
      }),
    }
  )

  .get(
    "/:id",
    async ({ params }) => {
      try {
        const session = await handleGetSession(params.id);
        return {
          success: true,
          data: session,
        };
      } catch (error) {
        console.error("Get session error:", error);
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to get session",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: t.Object({
        success: t.Boolean(),
        data: t.Optional(
          t.Object({
            id: t.String(),
            userId: t.String(),
            configurationId: t.String(),
            title: t.Optional(t.String()),
            createdAt: t.Date(),
            updatedAt: t.Date(),
            messages: t.Array(
              t.Object({
                id: t.String(),
                sessionId: t.String(),
                role: t.String(),
                content: t.String(),
                attachments: t.Optional(
                  t.Nullable(
                    t.Array(
                      t.Object({
                        id: t.String(),
                        filename: t.String(),
                        mimeType: t.String(),
                        size: t.Number(),
                      })
                    )
                  )
                ),
                createdAt: t.Date(),
              })
            ),
          })
        ),
        error: t.Optional(t.String()),
      }),
    }
  )

  .get(
    "/",
    async ({ query }) => {
      try {
        const sessions = await handleGetUserSessions(query.userId);
        return {
          success: true,
          data: sessions,
        };
      } catch (error) {
        console.error("Get user sessions error:", error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to get user sessions",
        };
      }
    },
    {
      query: t.Object({
        userId: t.String(),
      }),
      response: t.Object({
        success: t.Boolean(),
        data: t.Optional(
          t.Array(
            t.Object({
              id: t.String(),
              userId: t.String(),
              configurationId: t.String(),
              title: t.Optional(t.String()),
              createdAt: t.Date(),
              updatedAt: t.Date(),
            })
          )
        ),
        error: t.Optional(t.String()),
      }),
    }
  )

  .post(
    "/:id/messages",
    async ({ params, body }) => {
      try {
        // Handle both form data (with files) and JSON (without files)
        let messageData: any;
        let files: File[] | undefined;

        if (body instanceof FormData) {
          // Extract message data from form data
          messageData = {
            role: body.get("role") as string,
            content: body.get("content") as string,
          };

          // Extract files if present
          const fileEntries = body.getAll("files");
          files = fileEntries.filter(
            (entry) => entry instanceof File
          ) as File[];
        } else {
          // Regular JSON body
          messageData = {
            role: body.role,
            content: body.content,
          };

          // Check if files are embedded in JSON (this shouldn't happen normally)
          if (body.files) {
            // Convert single file or array to array
            const fileData = Array.isArray(body.files)
              ? body.files
              : [body.files];
            files = fileData.filter((f) => f instanceof File);
          }

          console.log("JSON body received:", messageData);
          console.log("Files from JSON:", files?.length || 0);
        }

        const message = await handleAddMessage(params.id, {
          ...messageData,
          files,
        });

        return {
          success: true,
          data: message,
        };
      } catch (error) {
        console.error("Add message error:", error);
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to add message",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      // Remove strict body validation to allow both FormData and JSON
      response: t.Object({
        success: t.Boolean(),
        data: t.Optional(
          t.Object({
            id: t.String(),
            sessionId: t.String(),
            role: t.String(),
            content: t.String(),
            attachments: t.Optional(
              t.Nullable(
                t.Array(
                  t.Object({
                    id: t.String(),
                    filename: t.String(),
                    mimeType: t.String(),
                    size: t.Number(),
                  })
                )
              )
            ),
            createdAt: t.Date(),
          })
        ),
        error: t.Optional(t.String()),
      }),
    }
  )

  .patch(
    "/:id",
    async ({ params, body }) => {
      try {
        const session = await handleUpdateSession(params.id, body);
        return {
          success: true,
          data: session,
        };
      } catch (error) {
        console.error("Update session error:", error);
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to update session",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        title: t.Optional(t.String()),
      }),
      response: t.Object({
        success: t.Boolean(),
        data: t.Optional(
          t.Object({
            id: t.String(),
            userId: t.String(),
            configurationId: t.String(),
            title: t.Optional(t.String()),
            createdAt: t.Date(),
            updatedAt: t.Date(),
          })
        ),
        error: t.Optional(t.String()),
      }),
    }
  )

  .delete(
    "/:id",
    async ({ params }) => {
      try {
        await handleDeleteSession(params.id);
        return {
          success: true,
          data: { id: params.id },
        };
      } catch (error) {
        console.error("Delete session error:", error);
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to delete session",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: t.Object({
        success: t.Boolean(),
        data: t.Optional(
          t.Object({
            id: t.String(),
          })
        ),
        error: t.Optional(t.String()),
      }),
    }
  );

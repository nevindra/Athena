import { Elysia, t } from "elysia";
import {
  handleChatRequest,
  handleGetModelsRequest,
  handleStreamChatRequest,
} from "../controllers/aiController";

export const aiRoutes = new Elysia({ prefix: "/ai" })
  .post(
    "/chat",
    async ({ body }) => {
      try {
        const response = await handleChatRequest(body);
        return {
          success: true,
          data: response,
        };
      } catch (error) {
        console.error("Chat request error:", error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to process chat request",
        };
      }
    },
    {
      body: t.Object({
        messages: t.Array(
          t.Object({
            role: t.Union([
              t.Literal("user"),
              t.Literal("assistant"),
              t.Literal("system"),
            ]),
            content: t.String(),
          })
        ),
        userId: t.String(),
        configurationId: t.Optional(t.String()),
        sessionId: t.Optional(t.String()),
        systemPromptId: t.Optional(t.String()),
        files: t.Optional(
          t.Array(
            t.Object({
              name: t.String(),
              type: t.String(),
              data: t.String(),
            })
          )
        ),
      }),
      response: t.Object({
        success: t.Boolean(),
        data: t.Optional(
          t.Object({
            message: t.String(),
            model: t.String(),
            finishReason: t.String(),
            usage: t.Optional(
              t.Object({
                promptTokens: t.Number(),
                completionTokens: t.Number(),
                totalTokens: t.Number(),
              })
            ),
          })
        ),
        error: t.Optional(t.String()),
      }),
    }
  )

  .post(
    "/chat/stream",
    async ({ body }) => {
      try {
        const stream = await handleStreamChatRequest(body);

        // Return the stream directly - Elysia supports this for AI SDK integration
        return stream;
      } catch (error) {
        console.error("Stream chat request error:", error);
        return new Response(
          JSON.stringify({
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to process stream chat request",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    },
    {
      body: t.Object({
        messages: t.Array(
          t.Object({
            role: t.Union([
              t.Literal("user"),
              t.Literal("assistant"),
              t.Literal("system"),
            ]),
            content: t.String(),
          })
        ),
        userId: t.String(),
        configurationId: t.Optional(t.String()),
        sessionId: t.Optional(t.String()),
        systemPromptId: t.Optional(t.String()),
        files: t.Optional(
          t.Array(
            t.Object({
              name: t.String(),
              type: t.String(),
              data: t.String(),
            })
          )
        ),
      }),
    }
  )

  .get(
    "/models",
    async ({ query }) => {
      try {
        const models = await handleGetModelsRequest(
          query.userId,
          query.configurationId
        );
        return {
          success: true,
          data: {
            models,
          },
        };
      } catch (error) {
        console.error("Get models request error:", error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch available models",
        };
      }
    },
    {
      query: t.Object({
        userId: t.String(),
        configurationId: t.Optional(t.String()),
      }),
      response: t.Object({
        success: t.Boolean(),
        data: t.Optional(
          t.Object({
            models: t.Array(t.String()),
          })
        ),
        error: t.Optional(t.String()),
      }),
    }
  );

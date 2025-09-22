import { Elysia, t } from "elysia";
import {
  handleChatRequest,
  handleGetModelsRequest,
  handleStreamChatRequest,
} from "../controllers/aiController";

interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

interface SuccessResponse<T = any> {
  success: true;
  data: T;
}

type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

function createErrorResponse(error: unknown, defaultMessage: string): ErrorResponse {
  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
      code: error.name !== "Error" ? error.name : undefined,
    };
  }
  return {
    success: false,
    error: defaultMessage,
  };
}

function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
  };
}

export const aiRoutes = new Elysia({ prefix: "/ai" })
  .post(
    "/chat",
    async ({ body }) => {
      try {
        const response = await handleChatRequest(body);
        return createSuccessResponse(response);
      } catch (error) {
        console.error("Chat request error:", error);
        return createErrorResponse(error, "Failed to process chat request");
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
        apiRegistrationId: t.Optional(t.String()),
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
            finishReason: t.String(),
            reasoning: t.Optional(t.String()),
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
        return stream;
      } catch (error) {
        console.error("Stream chat request error:", error);
        const errorResponse = createErrorResponse(error, "Failed to process stream chat request");
        return new Response(
          JSON.stringify(errorResponse),
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
        apiRegistrationId: t.Optional(t.String()),
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
          query.configurationId,
          query.apiRegistrationId
        );
        return createSuccessResponse({ models });
      } catch (error) {
        console.error("Get models request error:", error);
        return createErrorResponse(error, "Failed to fetch available models");
      }
    },
    {
      query: t.Object({
        userId: t.String(),
        configurationId: t.Optional(t.String()),
        apiRegistrationId: t.Optional(t.String()),
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

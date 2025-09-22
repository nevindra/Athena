import { Elysia, t } from "elysia";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { apiRegistrations } from "../db/schema";
import { getAIConfig, getSystemPrompt } from "../services/configurationService";
import { generateChatResponse } from "../services/aiService";
import { metricsService } from "../services/metricsService";
import type { ChatMessage } from "../utils/messageUtils";

export const externalApiRoutes = new Elysia({ prefix: "/external" })
  // External API specific metrics middleware
  .derive(({ params, request }) => {
    const startTime = Date.now();
    const method = request.method;
    const url = new URL(request.url);
    const registrationId = (params as any)?.registrationId;

    return {
      externalMetrics: {
        startTime,
        method,
        registrationId: registrationId || "unknown",
      }
    };
  })
  .onAfterHandle(async ({ externalMetrics, response, headers, path }) => {
    if (externalMetrics?.registrationId && externalMetrics.registrationId !== "unknown") {
      const statusCode = 200;
      const responseTimeMs = Date.now() - externalMetrics.startTime;
      const userAgent = headers["user-agent"];
      const ipAddress = headers["x-forwarded-for"] || headers["x-real-ip"] || "unknown";

      await metricsService.recordApiCall({
        registrationId: externalMetrics.registrationId,
        method: externalMetrics.method,
        endpoint: path,
        statusCode,
        responseTimeMs,
        userAgent,
        ipAddress,
      });
    }
  })
  .onError(async ({ externalMetrics, error, headers, path }) => {
    if (externalMetrics?.registrationId && externalMetrics.registrationId !== "unknown") {
      const statusCode = error.name === "ValidationError" ? 400 : 500;
      const responseTimeMs = Date.now() - externalMetrics.startTime;
      const userAgent = headers["user-agent"];
      const ipAddress = headers["x-forwarded-for"] || headers["x-real-ip"] || "unknown";

      await metricsService.recordApiCall({
        registrationId: externalMetrics.registrationId,
        method: externalMetrics.method,
        endpoint: path,
        statusCode,
        responseTimeMs,
        errorMessage: error.message,
        userAgent,
        ipAddress,
      });
    }
  })
  // External API endpoint for registered APIs
  .post(
    "/:registrationId/chat",
    async ({ params, body, headers }) => {
      const { registrationId } = params;
      const { messages, stream = false, files } = body;

      try {

        // Extract API key from Authorization header
        const authHeader = headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return {
            error: {
              message: "Missing or invalid Authorization header. Expected: Bearer {apiKey}",
              type: "authentication_error",
              code: "invalid_api_key",
            },
          };
        }

        const apiKey = authHeader.replace("Bearer ", "");

        // Find the API registration
        const registration = await db.query.apiRegistrations.findFirst({
          where: and(
            eq(apiRegistrations.id, registrationId),
            eq(apiRegistrations.apiKey, apiKey),
            eq(apiRegistrations.isActive, true)
          ),
          with: {
            configuration: true,
            systemPrompt: true,
          },
        });

        if (!registration) {
          return {
            error: {
              message: "Invalid API key or registration not found",
              type: "authentication_error",
              code: "invalid_api_key",
            },
          };
        }

        // Validate messages format
        if (!Array.isArray(messages) || messages.length === 0) {
          return {
            error: {
              message: "Messages must be a non-empty array",
              type: "invalid_request_error",
              code: "invalid_messages",
            },
          };
        }

        // Prepare messages for AI service
        const chatMessages: ChatMessage[] = messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        }));

        // Add system prompt if configured
        if (registration.systemPrompt) {
          chatMessages.unshift({
            role: "system",
            content: registration.systemPrompt.content,
          });
        }

        // Generate response using the AI service
        const response = await generateChatResponse({
          messages: chatMessages,
          userId: registration.userId,
          configurationId: registration.configurationId,
          files: files,
        });

        // Return in OpenAI-compatible format
        const successResponse = {
          id: `chatcmpl-${Date.now()}`,
          object: "chat.completion",
          created: Math.floor(Date.now() / 1000),
          model: registration.configuration?.name || "athena-custom",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: response.message,
              },
              finish_reason: response.finishReason,
            },
          ],
          usage: response.usage || {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
          },
        };

        return successResponse;
      } catch (error) {
        console.error("External API error:", error);

        return {
          error: {
            message: "Internal server error",
            type: "server_error",
            code: "internal_error",
          },
        };
      }
    },
    {
      params: t.Object({
        registrationId: t.String(),
      }),
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
        stream: t.Optional(t.Boolean()),
        max_tokens: t.Optional(t.Number()),
        temperature: t.Optional(t.Number()),
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

  // Get information about a registered API endpoint
  .get(
    "/:registrationId/info",
    async ({ params, headers }) => {
      const startTime = Date.now();
      const { registrationId } = params;
      const method = "GET";
      const endpoint = `/external/${registrationId}/info`;
      let statusCode = 200;
      let errorMessage: string | undefined;

      // Extract request metadata for metrics
      const userAgent = headers["user-agent"];
      const ipAddress = headers["x-forwarded-for"] || headers["x-real-ip"] || "unknown";

      try {

        // Extract API key from Authorization header
        const authHeader = headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return {
            error: {
              message: "Missing or invalid Authorization header",
              type: "authentication_error",
              code: "invalid_api_key",
            },
          };
        }

        const apiKey = authHeader.replace("Bearer ", "");

        // Find the API registration
        const registration = await db.query.apiRegistrations.findFirst({
          where: and(
            eq(apiRegistrations.id, registrationId),
            eq(apiRegistrations.apiKey, apiKey),
            eq(apiRegistrations.isActive, true)
          ),
          with: {
            configuration: {
              columns: {
                name: true,
                provider: true,
              },
            },
            systemPrompt: {
              columns: {
                title: true,
                category: true,
              },
            },
          },
        });

        if (!registration) {
          return {
            error: {
              message: "Invalid API key or registration not found",
              type: "authentication_error",
              code: "invalid_api_key",
            },
          };
        }

        return {
          id: registration.id,
          name: registration.name,
          description: registration.description,
          configuration: {
            name: registration.configuration?.name,
            provider: registration.configuration?.provider,
          },
          system_prompt: registration.systemPrompt ? {
            title: registration.systemPrompt.title,
            category: registration.systemPrompt.category,
          } : null,
          created_at: registration.createdAt,
          is_active: registration.isActive,
        };
      } catch (error) {
        console.error("External API info error:", error);
        return {
          error: {
            message: "Internal server error",
            type: "server_error",
            code: "internal_error",
          },
        };
      }
    },
    {
      params: t.Object({
        registrationId: t.String(),
      }),
    }
  );
import { Elysia, t } from "elysia";
import { apiMetricsController } from "../controllers/apiMetricsController";

export const apiMetricsRoutes = new Elysia({ prefix: "/api-metrics" })
  // Get metrics for a specific API registration
  .get(
    "/:registrationId",
    async ({ params, query }) => {
      const { registrationId } = params;
      const { timeRange } = query;

      return apiMetricsController.getApiMetrics(registrationId, timeRange);
    },
    {
      params: t.Object({
        registrationId: t.String(),
      }),
      query: t.Object({
        timeRange: t.Optional(t.Union([
          t.Literal("24h"),
          t.Literal("7d"),
          t.Literal("30d"),
        ])),
      }),
    }
  )

  // Get aggregated metrics summary for a user
  .get(
    "/summary/:userId",
    async ({ params, query }) => {
      const { userId } = params;
      const { timeRange } = query;

      return apiMetricsController.getUserMetricsSummary(userId, timeRange);
    },
    {
      params: t.Object({
        userId: t.String(),
      }),
      query: t.Object({
        timeRange: t.Optional(t.Union([
          t.Literal("24h"),
          t.Literal("7d"),
          t.Literal("30d"),
        ])),
      }),
    }
  )

  // Get time-series data for charts
  .get(
    "/:registrationId/timeseries",
    async ({ params, query }) => {
      const { registrationId } = params;
      const { timeRange } = query;

      return apiMetricsController.getTimeSeriesMetrics(registrationId, timeRange);
    },
    {
      params: t.Object({
        registrationId: t.String(),
      }),
      query: t.Object({
        timeRange: t.Optional(t.Union([
          t.Literal("24h"),
          t.Literal("7d"),
          t.Literal("30d"),
        ])),
      }),
    }
  )

  // Get recent API calls for debugging
  .get(
    "/:registrationId/recent",
    async ({ params, query }) => {
      const { registrationId } = params;
      const { limit } = query;

      return apiMetricsController.getRecentApiCalls(
        registrationId,
        limit ? parseInt(limit) : undefined
      );
    },
    {
      params: t.Object({
        registrationId: t.String(),
      }),
      query: t.Object({
        limit: t.Optional(t.String()),
      }),
    }
  )

  // Admin endpoint to cleanup old metrics
  .delete(
    "/cleanup",
    async ({ query }) => {
      const { olderThanDays } = query;

      return apiMetricsController.cleanupOldMetrics(
        olderThanDays ? parseInt(olderThanDays) : undefined
      );
    },
    {
      query: t.Object({
        olderThanDays: t.Optional(t.String()),
      }),
    }
  );
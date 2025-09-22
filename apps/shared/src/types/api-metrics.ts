import { z } from "zod";

// API Metrics Data
export const apiMetricsSchema = z.object({
  registrationId: z.string(),
  totalRequests: z.number(),
  successCount: z.number(),
  errorCounts: z.object({
    "4xx": z.number(),
    "5xx": z.number(),
  }),
  responseTimes: z.object({
    min: z.number(),
    max: z.number(),
    average: z.number(),
  }),
  timeRange: z.object({
    from: z.date(),
    to: z.date(),
  }),
});

export type ApiMetrics = z.infer<typeof apiMetricsSchema>;

// Time Series Data for Charts
export const timeSeriesDataPointSchema = z.object({
  timestamp: z.string(),
  requests: z.number(),
  avgResponseTime: z.number(),
  errorRate: z.number(),
});

export type TimeSeriesDataPoint = z.infer<typeof timeSeriesDataPointSchema>;

// Recent API Call
export const recentApiCallSchema = z.object({
  id: z.string(),
  registrationId: z.string(),
  timestamp: z.date(),
  method: z.string(),
  endpoint: z.string(),
  statusCode: z.number(),
  responseTimeMs: z.number(),
  requestSizeBytes: z.number().nullable().optional(),
  responseSizeBytes: z.number().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
});

export type RecentApiCall = z.infer<typeof recentApiCallSchema>;

// Metrics Summary for User
export const metricsSummarySchema = z.object({
  summary: z.object({
    totalRequests: z.number(),
    successCount: z.number(),
    errorCounts: z.object({
      "4xx": z.number(),
      "5xx": z.number(),
    }),
    responseTimes: z.object({
      min: z.number(),
      max: z.number(),
      average: z.number(),
    }),
  }),
  apiMetrics: z.array(apiMetricsSchema),
  timeRange: z.string(),
});

export type MetricsSummary = z.infer<typeof metricsSummarySchema>;

// API Responses
export const getApiMetricsResponseSchema = z.object({
  success: z.boolean(),
  data: apiMetricsSchema.optional(),
  error: z.string().optional(),
});

export type GetApiMetricsResponse = z.infer<typeof getApiMetricsResponseSchema>;

export const getMetricsSummaryResponseSchema = z.object({
  success: z.boolean(),
  data: metricsSummarySchema.optional(),
  error: z.string().optional(),
});

export type GetMetricsSummaryResponse = z.infer<typeof getMetricsSummaryResponseSchema>;

export const getTimeSeriesResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(timeSeriesDataPointSchema).optional(),
  error: z.string().optional(),
});

export type GetTimeSeriesResponse = z.infer<typeof getTimeSeriesResponseSchema>;

export const getRecentCallsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(recentApiCallSchema).optional(),
  error: z.string().optional(),
});

export type GetRecentCallsResponse = z.infer<typeof getRecentCallsResponseSchema>;

// Time Range Options
export const timeRangeSchema = z.union([
  z.literal("24h"),
  z.literal("7d"),
  z.literal("30d"),
]);

export type TimeRange = z.infer<typeof timeRangeSchema>;

// Utility types for display
export interface MetricsDisplayData {
  totalRequests: number;
  successRate: number;
  errorRate: number;
  avgResponseTime: number;
  uptime: number;
}

export interface ErrorBreakdown {
  clientErrors: number; // 4xx
  serverErrors: number; // 5xx
  authErrors: number;   // 401, 403
  validationErrors: number; // 400, 422
}

// Helper functions for metrics calculations
export const calculateSuccessRate = (successCount: number, totalRequests: number): number => {
  return totalRequests > 0 ? Math.round((successCount / totalRequests) * 100) : 0;
};

export const calculateErrorRate = (errorCount: number, totalRequests: number): number => {
  return totalRequests > 0 ? Math.round((errorCount / totalRequests) * 100) : 0;
};

export const calculateUptime = (
  totalRequests: number,
  serverErrors: number,
  timeWindowHours: number = 24
): number => {
  // Simple uptime calculation based on server error rate
  // This is an approximation - real uptime would need continuous monitoring
  const errorRate = calculateErrorRate(serverErrors, totalRequests);
  return Math.max(0, 100 - errorRate);
};
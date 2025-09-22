import { eq, and, sql, gte, lte, desc } from "drizzle-orm";
import { db } from "../db";
import { apiMetrics, apiRegistrations } from "../db/schema";
import type { NewApiMetric } from "../db/schema";

export interface ApiMetricsData {
  registrationId: string;
  totalRequests: number;
  successCount: number;
  errorCounts: {
    "4xx": number;
    "5xx": number;
  };
  responseTimes: {
    min: number;
    max: number;
    average: number;
  };
  timeRange: {
    from: Date;
    to: Date;
  };
}

export interface MetricsFilter {
  registrationId?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  statusCode?: number;
}

class MetricsService {
  /**
   * Record a single API call metric
   */
  async recordApiCall(data: {
    registrationId: string;
    method: string;
    endpoint: string;
    statusCode: number;
    responseTimeMs: number;
    requestSizeBytes?: number;
    responseSizeBytes?: number;
    errorMessage?: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<void> {
    try {
      const metricData: NewApiMetric = {
        registrationId: data.registrationId,
        method: data.method,
        endpoint: data.endpoint,
        statusCode: data.statusCode,
        responseTimeMs: data.responseTimeMs,
        requestSizeBytes: data.requestSizeBytes,
        responseSizeBytes: data.responseSizeBytes,
        errorMessage: data.errorMessage,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
      };

      await db.insert(apiMetrics).values(metricData);
    } catch (error) {
      console.error("Failed to record API metric:", error);
      // Don't throw - metrics shouldn't break the main API flow
    }
  }

  /**
   * Get metrics for a specific API registration
   */
  async getApiMetrics(
    registrationId: string,
    timeRange: "24h" | "7d" | "30d" = "24h"
  ): Promise<ApiMetricsData> {
    const now = new Date();
    const startDate = this.getStartDate(now, timeRange);

    // Get total requests and basic counts
    const totalRequestsQuery = await db
      .select({
        total: sql<number>`count(*)`,
        successCount: sql<number>`count(*) filter (where status_code >= 200 and status_code < 300)`,
        client_errors: sql<number>`count(*) filter (where status_code >= 400 and status_code < 500)`,
        server_errors: sql<number>`count(*) filter (where status_code >= 500)`,
        min_response_time: sql<number>`min(response_time_ms)`,
        max_response_time: sql<number>`max(response_time_ms)`,
        avg_response_time: sql<number>`avg(response_time_ms)`,
      })
      .from(apiMetrics)
      .where(
        and(
          eq(apiMetrics.registrationId, registrationId),
          gte(apiMetrics.timestamp, startDate),
          lte(apiMetrics.timestamp, now)
        )
      );

    const result = totalRequestsQuery[0];

    return {
      registrationId,
      totalRequests: Number(result?.total) || 0,
      successCount: Number(result?.successCount) || 0,
      errorCounts: {
        "4xx": Number(result?.client_errors) || 0,
        "5xx": Number(result?.server_errors) || 0,
      },
      responseTimes: {
        min: Number(result?.min_response_time) || 0,
        max: Number(result?.max_response_time) || 0,
        average: Math.round(Number(result?.avg_response_time) || 0),
      },
      timeRange: {
        from: startDate,
        to: now,
      },
    };
  }

  /**
   * Get aggregated metrics for all APIs belonging to a user
   */
  async getUserAggregatedMetrics(
    userId: string,
    timeRange: "24h" | "7d" | "30d" = "24h"
  ): Promise<ApiMetricsData[]> {
    const now = new Date();
    const startDate = this.getStartDate(now, timeRange);

    // Get all user's API registrations
    const userRegistrations = await db
      .select({ id: apiRegistrations.id })
      .from(apiRegistrations)
      .where(eq(apiRegistrations.userId, userId));

    // Get metrics for each registration
    const metricsPromises = userRegistrations.map((reg) =>
      this.getApiMetrics(reg.id, timeRange)
    );

    return Promise.all(metricsPromises);
  }

  /**
   * Get recent API calls for debugging/monitoring
   */
  async getRecentApiCalls(
    registrationId: string,
    limit: number = 100
  ): Promise<any[]> {
    return db
      .select({
        id: apiMetrics.id,
        registrationId: apiMetrics.registrationId,
        timestamp: apiMetrics.timestamp,
        method: apiMetrics.method,
        endpoint: apiMetrics.endpoint,
        statusCode: apiMetrics.statusCode,
        responseTimeMs: apiMetrics.responseTimeMs,
        requestSizeBytes: apiMetrics.requestSizeBytes,
        responseSizeBytes: apiMetrics.responseSizeBytes,
        errorMessage: apiMetrics.errorMessage,
        userAgent: apiMetrics.userAgent,
        ipAddress: apiMetrics.ipAddress,
      })
      .from(apiMetrics)
      .where(eq(apiMetrics.registrationId, registrationId))
      .orderBy(desc(apiMetrics.timestamp))
      .limit(limit);
  }

  /**
   * Clean up old metrics data (for maintenance)
   */
  async cleanupOldMetrics(olderThanDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await db
      .delete(apiMetrics)
      .where(lte(apiMetrics.timestamp, cutoffDate))
      .returning({ id: apiMetrics.id });

    return result.length;
  }

  /**
   * Get time-series data for charts
   */
  async getTimeSeriesMetrics(
    registrationId: string,
    timeRange: "24h" | "7d" | "30d" = "24h"
  ): Promise<Array<{
    timestamp: string;
    requests: number;
    avgResponseTime: number;
    errorRate: number;
  }>> {
    const now = new Date();
    const startDate = this.getStartDate(now, timeRange);

    // Determine the grouping interval based on time range
    const interval = this.getGroupingInterval(timeRange);

    const result = await db
      .select({
        period: sql<string>`date_trunc('${sql.raw(interval)}', timestamp)`,
        requests: sql<number>`count(*)`,
        avgResponseTime: sql<number>`avg(response_time_ms)`,
        errors: sql<number>`count(*) filter (where status_code >= 400)`,
      })
      .from(apiMetrics)
      .where(
        and(
          eq(apiMetrics.registrationId, registrationId),
          gte(apiMetrics.timestamp, startDate),
          lte(apiMetrics.timestamp, now)
        )
      )
      .groupBy(sql`date_trunc('${sql.raw(interval)}', timestamp)`)
      .orderBy(sql`date_trunc('${sql.raw(interval)}', timestamp)`);

    return result.map((row) => ({
      timestamp: row.period,
      requests: row.requests,
      avgResponseTime: Math.round(row.avgResponseTime),
      errorRate: row.requests > 0 ? Math.round((row.errors / row.requests) * 100) : 0,
    }));
  }

  private getStartDate(now: Date, timeRange: "24h" | "7d" | "30d"): Date {
    const start = new Date(now);
    switch (timeRange) {
      case "24h":
        start.setDate(start.getDate() - 1);
        break;
      case "7d":
        start.setDate(start.getDate() - 7);
        break;
      case "30d":
        start.setDate(start.getDate() - 30);
        break;
    }
    return start;
  }

  private getGroupingInterval(timeRange: "24h" | "7d" | "30d"): string {
    switch (timeRange) {
      case "24h":
        return "hour";
      case "7d":
        return "day";
      case "30d":
        return "day";
      default:
        return "hour";
    }
  }
}

export const metricsService = new MetricsService();
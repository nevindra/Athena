import { metricsService } from "../services/metricsService";
import type { ApiMetricsData } from "../services/metricsService";

class ApiMetricsController {
  /**
   * Get metrics for a specific API registration
   */
  async getApiMetrics(registrationId: string, timeRange?: string) {
    try {
      const validTimeRange = this.validateTimeRange(timeRange);
      const metrics = await metricsService.getApiMetrics(registrationId, validTimeRange);

      return {
        success: true,
        data: metrics,
      };
    } catch (error) {
      console.error("Error fetching API metrics:", error);
      return {
        success: false,
        error: "Failed to fetch API metrics",
      };
    }
  }

  /**
   * Get aggregated metrics for all user's APIs
   */
  async getUserMetricsSummary(userId: string, timeRange?: string) {
    try {
      const validTimeRange = this.validateTimeRange(timeRange);
      const metrics = await metricsService.getUserAggregatedMetrics(userId, validTimeRange);

      // Calculate totals across all APIs
      const summary = metrics.reduce(
        (acc, metric) => ({
          totalRequests: acc.totalRequests + metric.totalRequests,
          successCount: acc.successCount + metric.successCount,
          errorCounts: {
            "4xx": acc.errorCounts["4xx"] + metric.errorCounts["4xx"],
            "5xx": acc.errorCounts["5xx"] + metric.errorCounts["5xx"],
          },
          responseTimes: {
            min: Math.min(acc.responseTimes.min, metric.responseTimes.min || Infinity),
            max: Math.max(acc.responseTimes.max, metric.responseTimes.max || 0),
            average: 0, // Will calculate below
          },
        }),
        {
          totalRequests: 0,
          successCount: 0,
          errorCounts: { "4xx": 0, "5xx": 0 },
          responseTimes: { min: Infinity, max: 0, average: 0 },
        }
      );

      // Calculate average response time across all APIs
      const totalResponseTime = metrics.reduce((sum, metric) => {
        return sum + (metric.responseTimes.average * metric.totalRequests);
      }, 0);
      summary.responseTimes.average = summary.totalRequests > 0
        ? Math.round(totalResponseTime / summary.totalRequests)
        : 0;

      // Handle edge cases
      if (summary.responseTimes.min === Infinity) {
        summary.responseTimes.min = 0;
      }

      return {
        success: true,
        data: {
          summary,
          apiMetrics: metrics,
          timeRange: timeRange || "24h",
        },
      };
    } catch (error) {
      console.error("Error fetching user metrics summary:", error);
      return {
        success: false,
        error: "Failed to fetch metrics summary",
      };
    }
  }

  /**
   * Get time-series data for charts
   */
  async getTimeSeriesMetrics(registrationId: string, timeRange?: string) {
    try {
      const validTimeRange = this.validateTimeRange(timeRange);
      const metrics = await metricsService.getTimeSeriesMetrics(registrationId, validTimeRange);

      return {
        success: true,
        data: metrics,
      };
    } catch (error) {
      console.error("Error fetching time-series metrics:", error);
      return {
        success: false,
        error: "Failed to fetch time-series metrics",
      };
    }
  }

  /**
   * Get recent API calls for debugging
   */
  async getRecentApiCalls(registrationId: string, limit?: number) {
    try {
      const validLimit = Math.min(Math.max(limit || 50, 1), 500); // Between 1 and 500
      const calls = await metricsService.getRecentApiCalls(registrationId, validLimit);

      return {
        success: true,
        data: calls,
      };
    } catch (error) {
      console.error("Error fetching recent API calls:", error);
      return {
        success: false,
        error: "Failed to fetch recent API calls",
      };
    }
  }

  /**
   * Clean up old metrics (admin endpoint)
   */
  async cleanupOldMetrics(olderThanDays?: number) {
    try {
      const validDays = Math.max(olderThanDays || 90, 30); // Minimum 30 days
      const deletedCount = await metricsService.cleanupOldMetrics(validDays);

      return {
        success: true,
        data: {
          deletedCount,
          olderThanDays: validDays,
        },
      };
    } catch (error) {
      console.error("Error cleaning up old metrics:", error);
      return {
        success: false,
        error: "Failed to cleanup old metrics",
      };
    }
  }

  private validateTimeRange(timeRange?: string): "24h" | "7d" | "30d" {
    if (!timeRange) return "24h";

    const validRanges = ["24h", "7d", "30d"];
    if (validRanges.includes(timeRange)) {
      return timeRange as "24h" | "7d" | "30d";
    }

    return "24h"; // Default fallback
  }
}

export const apiMetricsController = new ApiMetricsController();
import { useQuery } from "@tanstack/react-query";
import type { TimeRange } from "@athena/shared";
import { apiRegistrationService } from "~/services/api-registrations";

export function useApiMetrics(registrationId: string, timeRange: TimeRange = "24h") {
  return useQuery({
    queryKey: ["api-metrics", registrationId, timeRange],
    queryFn: () => apiRegistrationService.getApiMetrics(registrationId, timeRange),
    enabled: !!registrationId,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time data
    staleTime: 15000, // Consider data stale after 15 seconds
  });
}

export function useMetricsSummary(userId: string, timeRange: TimeRange = "24h") {
  return useQuery({
    queryKey: ["metrics-summary", userId, timeRange],
    queryFn: () => apiRegistrationService.getMetricsSummary(userId, timeRange),
    enabled: !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000,
  });
}

export function useTimeSeriesMetrics(registrationId: string, timeRange: TimeRange = "24h") {
  return useQuery({
    queryKey: ["timeseries-metrics", registrationId, timeRange],
    queryFn: () => apiRegistrationService.getTimeSeriesMetrics(registrationId, timeRange),
    enabled: !!registrationId,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000,
  });
}

export function useRecentApiCalls(registrationId: string, limit: number = 50) {
  return useQuery({
    queryKey: ["recent-api-calls", registrationId, limit],
    queryFn: () => apiRegistrationService.getRecentApiCalls(registrationId, limit),
    enabled: !!registrationId,
    refetchInterval: 10000, // Refetch every 10 seconds for recent calls
    staleTime: 5000,
  });
}

export function useAllRecentApiCalls(registrationIds: string[], limit: number = 50) {
  return useQuery({
    queryKey: ["all-recent-api-calls", registrationIds, limit],
    queryFn: async () => {
      if (!registrationIds.length) return [];

      // Fetch recent calls for all registrations in parallel
      const promises = registrationIds.map(id =>
        apiRegistrationService.getRecentApiCalls(id, limit)
      );

      const results = await Promise.all(promises);

      // Flatten and sort by timestamp (newest first)
      const allCalls = results.flat();
      return allCalls.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, limit);
    },
    enabled: registrationIds.length > 0,
    refetchInterval: 10000,
    staleTime: 5000,
  });
}
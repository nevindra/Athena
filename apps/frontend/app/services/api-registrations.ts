import type {
  ApiRegistration,
  CreateApiRegistrationRequest,
  CreateApiRegistrationResponse,
  GetApiRegistrationsResponse,
  UpdateApiRegistrationRequest,
  UpdateApiRegistrationResponse,
  DeleteApiRegistrationResponse,
  ApiMetrics,
  GetApiMetricsResponse,
  MetricsSummary,
  GetMetricsSummaryResponse,
  TimeSeriesDataPoint,
  GetTimeSeriesResponse,
  RecentApiCall,
  GetRecentCallsResponse,
  TimeRange,
  ApiResponse,
} from "@athena/shared";
import { apiClient, makeApiCall } from "~/lib/api-client";

class ApiRegistrationService {

  async getApiRegistrations(userId: string): Promise<ApiRegistration[]> {
    return makeApiCall(() =>
      apiClient
        .get(`api-registrations?userId=${encodeURIComponent(userId)}`)
        .json<ApiResponse<ApiRegistration[]>>()
    );
  }

  async createApiRegistration(
    userId: string,
    data: CreateApiRegistrationRequest
  ): Promise<ApiRegistration> {
    return makeApiCall(() =>
      apiClient
        .post(`api-registrations?userId=${encodeURIComponent(userId)}`, {
          json: data,
        })
        .json<ApiResponse<ApiRegistration>>()
    );
  }

  async updateApiRegistration(
    userId: string,
    registrationId: string,
    data: UpdateApiRegistrationRequest
  ): Promise<ApiRegistration> {
    return makeApiCall(() =>
      apiClient
        .put(`api-registrations/${encodeURIComponent(registrationId)}?userId=${encodeURIComponent(userId)}`, {
          json: data,
        })
        .json<ApiResponse<ApiRegistration>>()
    );
  }

  async deleteApiRegistration(userId: string, registrationId: string): Promise<void> {
    await makeApiCall(() =>
      apiClient
        .delete(`api-registrations/${encodeURIComponent(registrationId)}?userId=${encodeURIComponent(userId)}`)
        .json<ApiResponse<null>>()
    );
  }

  async getApiMetrics(registrationId: string, timeRange?: TimeRange): Promise<ApiMetrics> {
    const queryParams = timeRange ? `?timeRange=${timeRange}` : "";
    return makeApiCall(() =>
      apiClient
        .get(`api-metrics/${encodeURIComponent(registrationId)}${queryParams}`)
        .json<ApiResponse<ApiMetrics>>()
    );
  }

  async getMetricsSummary(userId: string, timeRange?: TimeRange): Promise<MetricsSummary> {
    const queryParams = timeRange ? `?timeRange=${timeRange}` : "";
    return makeApiCall(() =>
      apiClient
        .get(`api-metrics/summary/${encodeURIComponent(userId)}${queryParams}`)
        .json<ApiResponse<MetricsSummary>>()
    );
  }

  async getTimeSeriesMetrics(
    registrationId: string,
    timeRange?: TimeRange
  ): Promise<TimeSeriesDataPoint[]> {
    const queryParams = timeRange ? `?timeRange=${timeRange}` : "";
    return makeApiCall(() =>
      apiClient
        .get(`api-metrics/${encodeURIComponent(registrationId)}/timeseries${queryParams}`)
        .json<ApiResponse<TimeSeriesDataPoint[]>>()
    );
  }

  async getRecentApiCalls(registrationId: string, limit?: number): Promise<RecentApiCall[]> {
    const queryParams = limit ? `?limit=${limit}` : "";
    return makeApiCall(() =>
      apiClient
        .get(`api-metrics/${encodeURIComponent(registrationId)}/recent${queryParams}`)
        .json<ApiResponse<RecentApiCall[]>>()
    );
  }

}

export const apiRegistrationService = new ApiRegistrationService();
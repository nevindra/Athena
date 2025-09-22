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
} from "@athena/shared";

const API_BASE_URL = process.env.NODE_ENV === "production"
  ? "/api"
  : "http://localhost:3000/api";

class ApiRegistrationService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getApiRegistrations(userId: string): Promise<ApiRegistration[]> {
    const response = await this.request<GetApiRegistrationsResponse>(
      `/api-registrations?userId=${encodeURIComponent(userId)}`
    );

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch API registrations");
    }

    return response.data || [];
  }

  async createApiRegistration(
    userId: string,
    data: CreateApiRegistrationRequest
  ): Promise<ApiRegistration> {
    const response = await this.request<CreateApiRegistrationResponse>(
      `/api-registrations?userId=${encodeURIComponent(userId)}`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );

    if (!response.success) {
      throw new Error(response.error || "Failed to create API registration");
    }

    if (!response.data) {
      throw new Error("No data returned from API registration creation");
    }

    return response.data;
  }

  async updateApiRegistration(
    userId: string,
    registrationId: string,
    data: UpdateApiRegistrationRequest
  ): Promise<ApiRegistration> {
    const response = await this.request<UpdateApiRegistrationResponse>(
      `/api-registrations/${encodeURIComponent(registrationId)}?userId=${encodeURIComponent(userId)}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );

    if (!response.success) {
      throw new Error(response.error || "Failed to update API registration");
    }

    if (!response.data) {
      throw new Error("No data returned from API registration update");
    }

    return response.data;
  }

  async deleteApiRegistration(userId: string, registrationId: string): Promise<void> {
    const response = await this.request<DeleteApiRegistrationResponse>(
      `/api-registrations/${encodeURIComponent(registrationId)}?userId=${encodeURIComponent(userId)}`,
      {
        method: "DELETE",
      }
    );

    if (!response.success) {
      throw new Error(response.error || "Failed to delete API registration");
    }
  }

  async getApiMetrics(registrationId: string, timeRange?: TimeRange): Promise<ApiMetrics> {
    const queryParams = timeRange ? `?timeRange=${timeRange}` : "";
    const response = await this.request<GetApiMetricsResponse>(
      `/api-metrics/${encodeURIComponent(registrationId)}${queryParams}`
    );

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch API metrics");
    }

    if (!response.data) {
      throw new Error("No metrics data returned");
    }

    return response.data;
  }

  async getMetricsSummary(userId: string, timeRange?: TimeRange): Promise<MetricsSummary> {
    const queryParams = timeRange ? `?timeRange=${timeRange}` : "";
    const response = await this.request<GetMetricsSummaryResponse>(
      `/api-metrics/summary/${encodeURIComponent(userId)}${queryParams}`
    );

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch metrics summary");
    }

    if (!response.data) {
      throw new Error("No metrics summary data returned");
    }

    return response.data;
  }

  async getTimeSeriesMetrics(
    registrationId: string,
    timeRange?: TimeRange
  ): Promise<TimeSeriesDataPoint[]> {
    const queryParams = timeRange ? `?timeRange=${timeRange}` : "";
    const response = await this.request<GetTimeSeriesResponse>(
      `/api-metrics/${encodeURIComponent(registrationId)}/timeseries${queryParams}`
    );

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch time series metrics");
    }

    return response.data || [];
  }

  async getRecentApiCalls(registrationId: string, limit?: number): Promise<RecentApiCall[]> {
    const queryParams = limit ? `?limit=${limit}` : "";
    const response = await this.request<GetRecentCallsResponse>(
      `/api-metrics/${encodeURIComponent(registrationId)}/recent${queryParams}`
    );

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch recent API calls");
    }

    return response.data || [];
  }

}

export const apiRegistrationService = new ApiRegistrationService();
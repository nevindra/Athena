import type { AIConfiguration, AIProvider } from "./ai-config";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateConfigRequest {
  name: string;
  provider: AIProvider;
  settings?: any;
  isActive?: boolean;
}

export interface UpdateConfigRequest {
  name?: string;
  settings?: any;
  isActive?: boolean;
}

export interface TestConnectionRequest {
  provider: AIProvider;
  settings?: any;
}

export interface TestConnectionResponse extends ApiResponse {
  data?: {
    success: boolean;
    latency?: number;
    model?: string;
    error?: string;
  };
}

export interface GetConfigurationsResponse extends ApiResponse {
  data?: AIConfiguration[];
}

export interface GetConfigurationResponse extends ApiResponse {
  data?: AIConfiguration;
}

export interface CreateConfigurationResponse extends ApiResponse {
  data?: AIConfiguration;
}

export interface UpdateConfigurationResponse extends ApiResponse {
  data?: AIConfiguration;
}

export interface DeleteConfigurationResponse extends ApiResponse {
  data?: null;
}

export interface ApiRegistration {
  id: string;
  userId: string;
  name: string;
  description?: string;
  baseUrl: string;
  apiKey: string;
  configurationId: string;
  systemPromptId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApiRegistrationRequest {
  name: string;
  description?: string;
  configurationId: string;
  systemPromptId?: string;
  isActive?: boolean;
}

export interface UpdateApiRegistrationRequest {
  name?: string;
  description?: string;
  configurationId?: string;
  systemPromptId?: string;
  isActive?: boolean;
}


export interface GetApiRegistrationsResponse {
  success: boolean;
  data?: ApiRegistration[];
  error?: string;
}

export interface GetApiRegistrationResponse {
  success: boolean;
  data?: ApiRegistration;
  error?: string;
}

export interface CreateApiRegistrationResponse {
  success: boolean;
  data?: ApiRegistration;
  error?: string;
}

export interface UpdateApiRegistrationResponse {
  success: boolean;
  data?: ApiRegistration;
  error?: string;
}

export interface DeleteApiRegistrationResponse {
  success: boolean;
  data?: null;
  error?: string;
}
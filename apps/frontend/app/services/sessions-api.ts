import type {
  ApiResponse,
  ChatRequest,
  CreateSessionRequest,
  Message,
  Session,
} from "@athena/shared";
import { apiClient, makeApiCall } from "~/lib/api-client";
import { filesToFileData } from "~/utils/fileUtils";


export const sessionsApi = {
  // Get all sessions for a user
  async getUserSessions(userId: string): Promise<Session[]> {
    return makeApiCall(() =>
      apiClient
        .get("sessions", {
          searchParams: { userId },
        })
        .json<ApiResponse<Session[]>>()
    );
  },

  // Create a new session
  async createSession(request: CreateSessionRequest): Promise<Session> {
    return makeApiCall(() =>
      apiClient
        .post("sessions", {
          json: request,
          headers: {
            "Content-Type": "application/json",
          },
        })
        .json<ApiResponse<Session>>()
    );
  },

  // Get a specific session by ID
  async getSession(sessionId: string): Promise<Session> {
    return makeApiCall(() =>
      apiClient.get(`sessions/${sessionId}`).json<ApiResponse<Session>>()
    );
  },

  // Add message to session
  async addMessage(params: {
    sessionId: string;
    message: { role: "user" | "assistant" | "system"; content: string };
    files?: File[];
  }): Promise<Message> {
    const { sessionId, message, files } = params;

    if (files && files.length > 0) {
      // Use FormData when files are present
      const formData = new FormData();
      formData.append("role", message.role);
      formData.append("content", message.content);

      files.forEach((file) => {
        formData.append("files", file);
      });

      return makeApiCall(() =>
        apiClient
          .post(`sessions/${sessionId}/messages`, {
            body: formData,
          })
          .json<ApiResponse<Message>>()
      );
    } else {
      // Use JSON when no files
      return makeApiCall(() =>
        apiClient
          .post(`sessions/${sessionId}/messages`, {
            json: message,
            headers: {
              "Content-Type": "application/json",
            },
          })
          .json<ApiResponse<Message>>()
      );
    }
  },

  // Chat completion
  async chatCompletion(params: {
    messages: Array<{
      role: "user" | "assistant" | "system";
      content: string;
    }>;
    userId: string;
    configurationId?: string;
    sessionId?: string;
    systemPromptId?: string;
    files?: File[];
  }): Promise<any> {
    let request: ChatRequest = {
      messages: params.messages,
      userId: params.userId,
      configurationId: params.configurationId,
      sessionId: params.sessionId,
      systemPromptId: params.systemPromptId,
    };

    // Convert files to base64 if provided
    if (params.files && params.files.length > 0) {
      request.files = await filesToFileData(params.files);
    }

    return makeApiCall(() =>
      apiClient
        .post("ai/chat", {
          json: request,
          headers: {
            "Content-Type": "application/json",
          },
        })
        .json<ApiResponse<any>>()
    );
  },

  // Update session
  async updateSession(
    sessionId: string,
    updates: { title?: string }
  ): Promise<Session> {
    return makeApiCall(() =>
      apiClient
        .patch(`sessions/${sessionId}`, {
          json: updates,
          headers: {
            "Content-Type": "application/json",
          },
        })
        .json<ApiResponse<Session>>()
    );
  },

  // Delete session
  async deleteSession(sessionId: string): Promise<{ id: string }> {
    return makeApiCall(() =>
      apiClient
        .delete(`sessions/${sessionId}`)
        .json<ApiResponse<{ id: string }>>()
    );
  },
};

// Export individual functions for easier importing
export const {
  getUserSessions,
  createSession,
  getSession,
  addMessage,
  chatCompletion,
  updateSession,
  deleteSession,
} = sessionsApi;

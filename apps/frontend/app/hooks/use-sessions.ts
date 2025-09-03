import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { filesToFileData } from "~/utils/fileUtils";

const API_BASE = "http://localhost:3000/api";

interface CreateSessionRequest {
  userId: string;
  configurationId: string;
  initialMessage?: string;
  title?: string;
}

interface Session {
  id: string;
  userId: string;
  configurationId: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

interface Message {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: number;
  }>;
  createdAt: string;
}

interface ChatRequest {
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string | Array<{
      type: "text" | "image";
      text?: string;
      image?: string;
    }>;
  }>;
  userId: string;
  configurationId?: string;
  sessionId?: string;
  systemPromptId?: string;
  files?: Array<{
    name: string;
    type: string;
    data: string; // base64 encoded
  }>;
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: CreateSessionRequest) => {
      const response = await fetch(`${API_BASE}/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error("Failed to create session");
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to create session");
      }

      return result.data as Session;
    },
    onSuccess: (data) => {
      // Invalidate sessions query to refresh the sidebar
      queryClient.invalidateQueries({ queryKey: ["user-sessions", data.userId] });
    },
  });
}

export function useSession(sessionId: string) {
  return useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/sessions/${sessionId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch session");
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch session");
      }

      return result.data as Session;
    },
    enabled: !!sessionId,
  });
}

export function useAddMessage() {
  return useMutation({
    mutationFn: async ({ 
      sessionId, 
      message, 
      files 
    }: { 
      sessionId: string; 
      message: { role: "user" | "assistant" | "system"; content: string }; 
      files?: File[] 
    }) => {
      let response: Response;

      if (files && files.length > 0) {
        // Use FormData when files are present
        const formData = new FormData();
        formData.append('role', message.role);
        formData.append('content', message.content);
        
        files.forEach((file) => {
          formData.append('files', file);
        });

        response = await fetch(`${API_BASE}/sessions/${sessionId}/messages`, {
          method: "POST",
          body: formData,
        });
      } else {
        // Use JSON when no files
        response = await fetch(`${API_BASE}/sessions/${sessionId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(message),
        });
      }

      if (!response.ok) {
        throw new Error("Failed to add message");
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to add message");
      }

      return result.data as Message;
    },
  });
}

export function useChatCompletion() {
  return useMutation({
    mutationFn: async (params: {
      messages: Array<{
        role: "user" | "assistant" | "system";
        content: string;
      }>;
      userId: string;
      configurationId?: string;
      sessionId?: string;
      systemPromptId?: string;
      files?: File[];
    }) => {
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

      const response = await fetch(`${API_BASE}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error("Failed to get chat completion");
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to get chat completion");
      }

      return result.data;
    },
  });
}
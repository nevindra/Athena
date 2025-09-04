import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sessionsApi } from "~/services/sessions-api";
import type {
  Session,
  Message,
  CreateSessionRequest,
} from "@athena/shared";

export function useUserSessions(userId: string) {
  return useQuery({
    queryKey: ["user-sessions", userId],
    queryFn: () => sessionsApi.getUserSessions(userId),
    enabled: !!userId,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: CreateSessionRequest) =>
      sessionsApi.createSession(request),
    onSuccess: (data) => {
      // Invalidate sessions query to refresh the sidebar
      queryClient.invalidateQueries({ queryKey: ["user-sessions", data.userId] });
    },
  });
}

export function useSession(sessionId: string) {
  return useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => sessionsApi.getSession(sessionId),
    enabled: !!sessionId,
  });
}

export function useAddMessage() {
  return useMutation({
    mutationFn: (params: { 
      sessionId: string; 
      message: { role: "user" | "assistant" | "system"; content: string }; 
      files?: File[] 
    }) => sessionsApi.addMessage(params),
  });
}

export function useChatCompletion() {
  return useMutation({
    mutationFn: (params: {
      messages: Array<{
        role: "user" | "assistant" | "system";
        content: string;
      }>;
      userId: string;
      configurationId?: string;
      sessionId?: string;
      systemPromptId?: string;
      files?: File[];
    }) => sessionsApi.chatCompletion(params),
  });
}

export function useDeleteSession(userId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (sessionId: string) => sessionsApi.deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-sessions", userId] });
    },
  });
}

export function useUpdateSession(userId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ sessionId, title }: { sessionId: string; title: string }) => 
      sessionsApi.updateSession(sessionId, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-sessions", userId] });
    },
  });
}
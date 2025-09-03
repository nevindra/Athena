import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { systemPromptsApi } from "~/services/system-prompts-api";
import { queryKeys } from "~/lib/query-client";
import type {
  SystemPrompt,
  CreateSystemPromptRequest,
  UpdateSystemPromptRequest,
} from "@athena/shared";

// Hook to get all system prompts
export function useSystemPrompts() {
  return useQuery({
    queryKey: queryKeys.allSystemPrompts(),
    queryFn: systemPromptsApi.getSystemPrompts,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get a specific system prompt by ID
export function useSystemPrompt(promptId: string | null) {
  return useQuery({
    queryKey: queryKeys.systemPromptById(promptId || ""),
    queryFn: () => systemPromptsApi.getSystemPrompt(promptId!),
    enabled: !!promptId, // Only run query if promptId exists
  });
}

// Hook to create a new system prompt
export function useCreateSystemPrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSystemPromptRequest) =>
      systemPromptsApi.createSystemPrompt(data),
    onSuccess: (newPrompt: SystemPrompt) => {
      // Update the system prompts list in cache
      queryClient.setQueryData<SystemPrompt[]>(
        queryKeys.allSystemPrompts(),
        (oldPrompts) => {
          if (!oldPrompts) return [newPrompt];
          return [...oldPrompts, newPrompt];
        }
      );

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.systemPrompts });
    },
    onError: (error) => {
      console.error("Failed to create system prompt:", error);
    },
  });
}

// Hook to update an existing system prompt
export function useUpdateSystemPrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ promptId, data }: {
      promptId: string;
      data: UpdateSystemPromptRequest;
    }) => systemPromptsApi.updateSystemPrompt(promptId, data),
    onSuccess: (updatedPrompt: SystemPrompt) => {
      // Update the specific system prompt in cache
      queryClient.setQueryData(
        queryKeys.systemPromptById(updatedPrompt.id),
        updatedPrompt
      );

      // Update the system prompt in the list
      queryClient.setQueryData<SystemPrompt[]>(
        queryKeys.allSystemPrompts(),
        (oldPrompts) => {
          if (!oldPrompts) return [updatedPrompt];
          return oldPrompts.map(prompt =>
            prompt.id === updatedPrompt.id ? updatedPrompt : prompt
          );
        }
      );
    },
    onError: (error) => {
      console.error("Failed to update system prompt:", error);
    },
  });
}

// Hook to delete a system prompt
export function useDeleteSystemPrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (promptId: string) =>
      systemPromptsApi.deleteSystemPrompt(promptId),
    onSuccess: (_, deletedPromptId: string) => {
      // Remove the system prompt from the list
      queryClient.setQueryData<SystemPrompt[]>(
        queryKeys.allSystemPrompts(),
        (oldPrompts) => {
          if (!oldPrompts) return [];
          return oldPrompts.filter(prompt => prompt.id !== deletedPromptId);
        }
      );

      // Remove the specific system prompt from cache
      queryClient.removeQueries({ queryKey: queryKeys.systemPromptById(deletedPromptId) });
    },
    onError: (error) => {
      console.error("Failed to delete system prompt:", error);
    },
  });
}

// Utility hook for optimistic updates when saving system prompts
export function useOptimisticSystemPromptUpdate() {
  const queryClient = useQueryClient();

  const updateOptimistically = (promptId: string, updates: Partial<SystemPrompt>) => {
    // Optimistically update the cache
    queryClient.setQueryData<SystemPrompt[]>(
      queryKeys.allSystemPrompts(),
      (oldPrompts) => {
        if (!oldPrompts) return [];
        return oldPrompts.map(prompt =>
          prompt.id === promptId ? { ...prompt, ...updates } : prompt
        );
      }
    );

    queryClient.setQueryData(
      queryKeys.systemPromptById(promptId),
      (oldPrompt: SystemPrompt | undefined) => {
        if (!oldPrompt) return undefined;
        return { ...oldPrompt, ...updates };
      }
    );
  };

  const revertOptimisticUpdate = () => {
    // Invalidate all system prompt queries to fetch fresh data
    queryClient.invalidateQueries({ queryKey: queryKeys.systemPrompts });
  };

  return { updateOptimistically, revertOptimisticUpdate };
}
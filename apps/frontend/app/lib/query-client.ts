import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // How long data stays fresh before being considered stale
      staleTime: 5 * 60 * 1000, // 5 minutes
      // How long unused data stays in cache
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
      // Retry failed requests
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && error.message.includes("4")) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Don't refetch on window focus by default (can be overridden per query)
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      // Retry delay for mutations
      retryDelay: 1000,
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  // Base keys for configurations
  configurations: ["configurations"] as const,
  configuration: (id: string) => ["configurations", id] as const,
  
  // Base keys for system prompts
  systemPrompts: ["systemPrompts"] as const,
  systemPrompt: (id: string) => ["systemPrompts", id] as const,
  
  // Configuration query keys
  all: () => [...queryKeys.configurations] as const,
  byId: (id: string) => [...queryKeys.configuration(id)] as const,
  
  // System prompt query keys
  allSystemPrompts: () => [...queryKeys.systemPrompts] as const,
  systemPromptById: (id: string) => [...queryKeys.systemPrompt(id)] as const,
} as const;
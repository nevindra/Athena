import type {
  AIConfiguration,
  CreateConfigRequest,
  TestConnectionRequest,
  UpdateConfigRequest,
} from "@athena/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "~/lib/query-client";
import { configurationsApi } from "~/services/configurations-api";

// Hook to get all configurations
export function useConfigurations() {
  return useQuery({
    queryKey: queryKeys.all(),
    queryFn: configurationsApi.getConfigurations,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get a specific configuration by ID
export function useConfiguration(configId: string | null) {
  return useQuery({
    queryKey: queryKeys.byId(configId || ""),
    queryFn: () => configurationsApi.getConfiguration(configId!),
    enabled: !!configId, // Only run query if configId exists
  });
}

// Hook to create a new configuration
export function useCreateConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateConfigRequest) =>
      configurationsApi.createConfiguration(data),
    onSuccess: (newConfig: AIConfiguration) => {
      // Update the configurations list in cache
      queryClient.setQueryData<AIConfiguration[]>(
        queryKeys.all(),
        (oldConfigs) => {
          if (!oldConfigs) return [newConfig];
          return [...oldConfigs, newConfig];
        }
      );

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.configurations });
    },
    onError: (error) => {
      console.error("Failed to create configuration:", error);
    },
  });
}

// Hook to update an existing configuration
export function useUpdateConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      configId,
      data,
    }: {
      configId: string;
      data: UpdateConfigRequest;
    }) => configurationsApi.updateConfiguration(configId, data),
    onSuccess: (updatedConfig: AIConfiguration) => {
      // Update the specific configuration in cache
      queryClient.setQueryData(queryKeys.byId(updatedConfig.id), updatedConfig);

      // Update the configuration in the list
      queryClient.setQueryData<AIConfiguration[]>(
        queryKeys.all(),
        (oldConfigs) => {
          if (!oldConfigs) return [updatedConfig];
          return oldConfigs.map((config) =>
            config.id === updatedConfig.id ? updatedConfig : config
          );
        }
      );
    },
    onError: (error) => {
      console.error("Failed to update configuration:", error);
    },
  });
}

// Hook to delete a configuration
export function useDeleteConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (configId: string) =>
      configurationsApi.deleteConfiguration(configId),
    onSuccess: (_, deletedConfigId: string) => {
      // Remove the configuration from the list
      queryClient.setQueryData<AIConfiguration[]>(
        queryKeys.all(),
        (oldConfigs) => {
          if (!oldConfigs) return [];
          return oldConfigs.filter((config) => config.id !== deletedConfigId);
        }
      );

      // Remove the specific configuration from cache
      queryClient.removeQueries({ queryKey: queryKeys.byId(deletedConfigId) });
    },
    onError: (error) => {
      console.error("Failed to delete configuration:", error);
    },
  });
}

// Hook to test connection (doesn't need caching)
export function useTestConnection() {
  return useMutation({
    mutationFn: (data: TestConnectionRequest) =>
      configurationsApi.testConnection(data),
    onError: (error) => {
      console.error("Failed to test connection:", error);
    },
  });
}

// Utility hook for optimistic updates when saving configurations
export function useOptimisticConfigUpdate() {
  const queryClient = useQueryClient();

  const updateOptimistically = (
    configId: string,
    updates: Partial<AIConfiguration>
  ) => {
    // Optimistically update the cache
    queryClient.setQueryData<AIConfiguration[]>(
      queryKeys.all(),
      (oldConfigs) => {
        if (!oldConfigs) return [];
        return oldConfigs.map((config) =>
          config.id === configId ? { ...config, ...updates } : config
        );
      }
    );

    queryClient.setQueryData(
      queryKeys.byId(configId),
      (oldConfig: AIConfiguration | undefined) => {
        if (!oldConfig) return undefined;
        return { ...oldConfig, ...updates };
      }
    );
  };

  const revertOptimisticUpdate = () => {
    // Invalidate all configuration queries to fetch fresh data
    queryClient.invalidateQueries({ queryKey: queryKeys.configurations });
  };

  return { updateOptimistically, revertOptimisticUpdate };
}

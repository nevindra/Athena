import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateApiRegistrationRequest,
  UpdateApiRegistrationRequest,
} from "@athena/shared";
import { apiRegistrationService } from "~/services/api-registrations";

export function useApiRegistrations(userId: string) {
  return useQuery({
    queryKey: ["api-registrations", userId],
    queryFn: () => apiRegistrationService.getApiRegistrations(userId),
    enabled: !!userId,
  });
}

export function useCreateApiRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: CreateApiRegistrationRequest }) =>
      apiRegistrationService.createApiRegistration(userId, data),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["api-registrations", userId] });
    },
  });
}

export function useUpdateApiRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      registrationId,
      data,
    }: {
      userId: string;
      registrationId: string;
      data: UpdateApiRegistrationRequest;
    }) => apiRegistrationService.updateApiRegistration(userId, registrationId, data),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["api-registrations", userId] });
    },
  });
}

export function useDeleteApiRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, registrationId }: { userId: string; registrationId: string }) =>
      apiRegistrationService.deleteApiRegistration(userId, registrationId),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["api-registrations", userId] });
    },
  });
}


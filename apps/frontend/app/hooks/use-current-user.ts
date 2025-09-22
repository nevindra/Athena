import { useAuthStore } from "~/lib/auth-store";

/**
 * Hook to get the current authenticated user's ID
 * @returns The current user's ID or null if not authenticated
 */
export function useCurrentUser() {
  const { user, isAuthenticated } = useAuthStore();

  return {
    userId: user?.id || null,
    user,
    isAuthenticated,
  };
}

/**
 * Hook to get the current user ID, throws error if not authenticated
 * Use this when you need to ensure user is authenticated
 * @returns The current user's ID
 * @throws Error if user is not authenticated
 */
export function useAuthenticatedUserId() {
  const { userId, isAuthenticated } = useCurrentUser();

  if (!isAuthenticated || !userId) {
    throw new Error("User must be authenticated to perform this action");
  }

  return userId;
}
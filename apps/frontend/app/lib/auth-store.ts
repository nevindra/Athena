import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authClient, type Session, type User } from "./auth-client";

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;

  // Actions
  signIn: (credentials: { username: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  signUp: (credentials: {
    username: string;
    displayUsername?: string;
    email: string;
    name: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
  initialize: () => void;
  isUsernameAvailable: (username: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,
      isInitialized: false,

      initialize: () => {
        const state = get();
        if (state.user && state.session) {
          set({ isAuthenticated: true, isLoading: false, isInitialized: true });
        } else {
          set({ isAuthenticated: false, isLoading: false, isInitialized: true });
        }
      },

      signIn: async (credentials) => {
        set({ isLoading: true });

        try {
          const { data, error } = await authClient.signIn.username({
            username: credentials.username,
            password: credentials.password,
          });

          if (error) {
            set({ isLoading: false });
            return { success: false, error: error.message };
          }

          if (data) {
            set({
              user: data.user,
              session: data.session,
              isAuthenticated: true,
              isLoading: false
            });
            return { success: true };
          }

          set({ isLoading: false });
          return { success: false, error: "Sign in failed" };
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            error: error instanceof Error ? error.message : "Sign in failed"
          };
        }
      },

      signUp: async (credentials) => {
        set({ isLoading: true });

        try {
          const { data, error } = await authClient.signUp.email({
            username: credentials.username,
            displayUsername: credentials.displayUsername || credentials.username,
            email: credentials.email,
            name: credentials.name,
            password: credentials.password,
          });

          if (error) {
            set({ isLoading: false });
            return { success: false, error: error.message };
          }

          if (data) {
            set({
              user: data.user,
              session: data.session,
              isAuthenticated: true,
              isLoading: false
            });
            return { success: true };
          }

          set({ isLoading: false });
          return { success: false, error: "Sign up failed" };
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            error: error instanceof Error ? error.message : "Sign up failed"
          };
        }
      },

      signOut: async () => {
        set({ isLoading: true });

        try {
          await authClient.signOut();
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false
          });
        } catch (error) {
          console.error("Sign out error:", error);
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      },

      checkSession: async () => {
        set({ isLoading: true });

        try {
          const { data } = await authClient.getSession();

          if (data) {
            set({
              user: data.user,
              session: data.session,
              isAuthenticated: true,
              isLoading: false
            });
          } else {
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false
            });
          }
        } catch (error) {
          console.error("Session check error:", error);
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      },

      isUsernameAvailable: async (username: string) => {
        try {
          const { data } = await authClient.isUsernameAvailable({ username });
          return data?.available ?? false;
        } catch (error) {
          console.error("Username availability check error:", error);
          return false;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initialize();
        }
      },
    }
  )
);
import { useEffect } from "react";
import { useAuthStore } from "~/lib/auth-store";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { checkSession, initialize, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
    checkSession();
  }, [checkSession, initialize, isInitialized]);

  return <>{children}</>;
}
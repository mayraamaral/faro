import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import { SupabaseAuthRepository } from "../infrastructure/supabase-auth.repository";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isBootstrapping: boolean;
  isRecoveryFlow: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const authRepository = new SupabaseAuthRepository();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    void Promise.all([
      supabase.auth.getSession(),
      new Promise((resolve) => setTimeout(resolve, 2000)), // 2 seconds minimum delay
    ]).then(([ { data } ]) => {
      if (!isMountedRef.current) return;
      setSession(data.session);
      setIsBootstrapping(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isMountedRef.current) return;
      setSession(nextSession);

      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryFlow(true);
      } else if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        setIsRecoveryFlow(false);
      }
    });

    return () => {
      isMountedRef.current = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const logout = useCallback(async () => {
    await authRepository.logout();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isBootstrapping,
      isRecoveryFlow,
      logout,
    }),
    [session, isBootstrapping, isRecoveryFlow, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

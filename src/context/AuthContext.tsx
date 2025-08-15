// src/context/AuthContext.tsx
// ----------------------------------------------------------------------------
// Supabase-only AuthContext (no legacy getCurrentUser fallback).
// Exposes: { user, session, ready, refresh, logout }.
// - user is null until Supabase resolves (no pretending we're logged in).
// - ready is true after the first hydration, so routes can wait before redirect.
// ----------------------------------------------------------------------------

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User as SupaUser } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabaseClient";

export type AuthUser = {
  id: string;
  email?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  session: Session | null;
  ready: boolean; // true after first hydration
  refresh: () => void; // fire-and-forget (kept void so callers don't have to await)
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  ready: false,
  refresh: () => {},
  logout: async () => {},
});

function toAuthUser(u: SupaUser | null | undefined): AuthUser | null {
  if (!u) return null;
  return { id: u.id, email: u.email };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  const hydrate = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("[Auth] getSession error:", error);
    }
    const sess = data?.session ?? null;
    setSession(sess);
    setUser(toAuthUser(sess?.user));
    setReady(true);
  }, []);

  // public "refresh" remains void for compatibility
  const refresh = useCallback(() => {
    setReady(false);
    void hydrate();
  }, [hydrate]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      // Clean any legacy local keys if they exist
      try {
        localStorage.removeItem("currentUser");
      } catch {}
      setSession(null);
      setUser(null);
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (import.meta.env.VITEST) return;
    // Initial hydration
    void hydrate();

    // Keep in sync with auth changes
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
      setUser(toAuthUser(newSession?.user));
      setReady(true);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [hydrate]);

  // (Optional) expose env/project for quick console checks in dev
  if (import.meta.env.DEV && typeof window !== "undefined") {
    // @ts-ignore
    window.supabase = supabase;
  }

  const value = useMemo<AuthContextValue>(
    () => ({ user, session, ready, refresh, logout }),
    [user, session, ready, refresh, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

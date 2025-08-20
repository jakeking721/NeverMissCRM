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
import type { Profile } from "@/utils/roles";
import { supabase } from "@/utils/supabaseClient";

type AuthContextValue = {
  user: Profile | null;
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

async function fetchProfile(u: SupaUser | null | undefined): Promise<Profile | null> {
  if (!u) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,username,role,credits,avatar,is_approved,is_active,deactivated_at")
    .eq("id", u.id)
    .single();
  if (error) {
    console.error("[Auth] fetchProfile error:", error);
    return null;
  }
  return data as Profile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  const hydrate = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("[Auth] getSession error:", error);
    }
    const sess = data?.session ?? null;
    setSession(sess);
    setUser(await fetchProfile(sess?.user));
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
    const { data } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession ?? null);
      setUser(await fetchProfile(newSession?.user));
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

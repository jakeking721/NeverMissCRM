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
  useRef,
  useState,
} from "react";
import type { Session, User as SupaUser } from "@supabase/supabase-js";
import type { Profile } from "@/utils/roles";
import { supabase } from "@/utils/supabaseClient";

type AuthContextValue = {
  user: Profile | null;
  session: Session | null;
  ready: boolean; // true after first hydration
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  ready: false,
  refresh: async () => {},
  logout: async () => {},
});

const PROFILE_TIMEOUT_MS = 8000;

async function fetchProfile(u: SupaUser | null | undefined): Promise<Profile | null> {
  if (!u) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROFILE_TIMEOUT_MS);
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id,email,username,role,credits,avatar,is_approved,is_active,deactivated_at"
      )
      .eq("id", u.id)
      // @ts-ignore `abortSignal` is supported by postgrest-js
      .abortSignal(controller.signal)
      .single();
    if (error) {
      console.error("[Auth] fetchProfile error:", error);
      return null;
    }
    return data as Profile;
  } catch (err) {
    console.error("[Auth] fetchProfile error:", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  const refresh = useCallback(
    async (nextSession?: Session | null) => {
      let sess = nextSession;
      try {
        if (!sess) {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            throw error;
          }
          sess = data?.session ?? null;
        }
        const changed = sess?.user?.id !== sessionRef.current?.user?.id;
        if (!changed && bootstrapped) return;
        setReady(false);
        setSession(sess);
        sessionRef.current = sess;
        setUser(await fetchProfile(sess?.user));
      } catch (err) {
        console.error("[Auth] refresh error:", err);
        setSession(sess ?? null);
        sessionRef.current = sess ?? null;
        setUser(null);
      } finally {
        setReady(true);
        if (!bootstrapped) setBootstrapped(true);
      }
    },
    [bootstrapped]
  );

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      await refresh(null);
    }
  }, [refresh]);

  useEffect(() => {
    if (import.meta.env.VITEST) return;
    // Initial hydration
    void refresh();

    // Keep in sync with auth changes
    const { data } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      void refresh(newSession ?? null);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [refresh]);

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

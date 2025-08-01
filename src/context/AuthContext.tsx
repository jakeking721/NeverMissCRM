// src/context/AuthContext.tsx
// -----------------------------------------------------------------------------
// Supabase-aware AuthContext (backwards-compatible)
// - Keeps the same external shape: { user, refresh, logout } so nothing else breaks.
// - Still boots from getCurrentUser() (sync) so legacy components can render immediately.
// - Hydrates from Supabase on mount and listens to onAuthStateChange to stay in sync.
// -----------------------------------------------------------------------------

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  getCurrentUser,
  refreshCurrentUser,
  logoutUser,
  User,
} from "../utils/auth";
import { supabase } from "@/utils/supabaseClient";

type AuthContextShape = {
  user: User | null;
  refresh: () => void; // kept as void for backwards compatibility
  logout: () => void;  // kept as void for backwards compatibility
};

const AuthContext = createContext<AuthContextShape>({
  user: null,
  refresh: () => { },
  logout: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Start with whatever is cached so the app can render immediately
  const [user, setUser] = useState<User | null>(getCurrentUser());

  const doRefresh = useCallback(async () => {
    const next = await refreshCurrentUser(); // your utils/auth returns the normalized legacy User
    setUser(next);
  }, []);

  const refresh = useCallback(() => {
    // Fire-and-forget to keep the legacy void signature
    void doRefresh();
  }, [doRefresh]);

  const logout = useCallback(() => {
    void (async () => {
      await logoutUser();
      setUser(null);
    })();
  }, []);

  useEffect(() => {
    if (import.meta.env.VITEST) return;
    // 1) Initial hydration from Supabase
    refresh();

    // 2) Keep in sync with Supabase auth changes (login/logout/token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async () => {
      await doRefresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refresh, doRefresh]);

  return (
    <AuthContext.Provider value={{ user, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

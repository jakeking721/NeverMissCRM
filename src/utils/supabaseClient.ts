import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Exposed for internal logging of REST requests in development
export const SUPABASE_URL = supabaseUrl;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

declare global {
  interface Window {
    supabase?: SupabaseClient;
    __ENV?: {
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
    };
  }
}

if (import.meta.env.DEV && typeof window !== "undefined") {
  window.supabase = supabase;
  window.__ENV = {
    SUPABASE_URL: supabaseUrl,
    SUPABASE_ANON_KEY: supabaseAnonKey,
  };
}

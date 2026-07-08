import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_KEY } from "./env";

// Client Supabase utilisé côté navigateur (composants "use client").
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}

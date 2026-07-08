import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

// Client "administrateur" : utilise la clé SECRÈTE (service role) et contourne
// la RLS. À N'UTILISER QUE côté serveur (routes API), jamais dans le navigateur.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

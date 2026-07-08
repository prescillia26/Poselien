import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_KEY } from "./env";

type CookieToSet = { name: string; value: string; options: CookieOptions };

// Client Supabase utilisé côté serveur (Server Components, Server Actions,
// Route Handlers). Recrée un client par requête à partir des cookies.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Appelé depuis un Server Component : l'écriture des cookies est
          // gérée par le middleware, on peut ignorer l'erreur ici.
        }
      },
    },
  });
}

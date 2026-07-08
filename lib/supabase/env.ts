// Lit les identifiants Supabase depuis .env.local.
// Accepte soit la clé "anon" (NEXT_PUBLIC_SUPABASE_ANON_KEY),
// soit la nouvelle clé "publishable" (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "";

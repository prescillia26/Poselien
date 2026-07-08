import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/theme";

export interface Profile {
  id: string;
  role: Role;
  email: string;
  nom: string | null;
}

// Récupère l'utilisateur connecté (vérifié côté serveur) et son profil.
export async function getUserAndProfile(): Promise<{
  userId: string;
  profile: Profile | null;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, email, nom")
    .eq("id", user.id)
    .single();

  return { userId: user.id, profile: (profile as Profile) ?? null };
}

// Garde de sécurité : réserve une page aux administrateurs.
export async function requireAdmin(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!data?.is_admin) redirect("/");
}

// Garde de sécurité : impose un rôle précis pour accéder à une page.
// Vérification côté SERVEUR : impossible à contourner en tapant l'URL.
export async function requireRole(role: Role): Promise<Profile> {
  const res = await getUserAndProfile();

  if (!res) redirect("/connexion");

  const { profile } = res;

  // Connecté mais profil pas encore créé -> on renvoie vers l'accueil.
  if (!profile) redirect("/bienvenue");

  // Mauvais rôle -> redirigé vers SON espace, pas celui demandé.
  if (profile.role !== role) {
    redirect(profile.role === "entreprise" ? "/entreprise" : "/poseur");
  }

  return profile;
}

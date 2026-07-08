import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/auth";

// Point d'entrée : redirige selon l'état de connexion et le rôle.
export default async function Home() {
  const res = await getUserAndProfile();

  if (!res) redirect("/bienvenue");
  if (!res.profile) redirect("/bienvenue");

  redirect(res.profile.role === "entreprise" ? "/entreprise" : "/poseur");
}

import { requireRole } from "@/lib/auth";

// Protection côté serveur : seul un compte "entreprise" passe.
export default async function EntrepriseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("entreprise");
  return <>{children}</>;
}

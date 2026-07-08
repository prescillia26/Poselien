import { requireAdmin } from "@/lib/auth";

// Espace réservé aux administrateurs (vérifié côté serveur).
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <>{children}</>;
}

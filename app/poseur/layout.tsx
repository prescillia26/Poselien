import { requireRole } from "@/lib/auth";

// Protection côté serveur : seul un compte "poseur" passe.
export default async function PoseurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("poseur");
  return <>{children}</>;
}

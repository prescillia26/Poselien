import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";

// Prévient le poseur attribué qu'une info de son chantier a changé
// (fiche client / bon de commande).
export async function POST(request: NextRequest) {
  const { pose_id } = await request.json().catch(() => ({ pose_id: null }));
  if (!pose_id) return NextResponse.json({ error: "pose_id manquant" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "non connecté" }, { status: 401 });

  const admin = createAdminClient();
  const { data: pose } = await admin
    .from("poses")
    .select("id, entreprise_id, poseur_id, statut, prestations, ville, departement")
    .eq("id", pose_id)
    .single();

  // Seule l'entreprise propriétaire, et si la pose est bien attribuée.
  if (!pose || pose.entreprise_id !== user.id || !pose.poseur_id) {
    return NextResponse.json({ error: "non autorisé" }, { status: 403 });
  }

  const prestas = (pose.prestations ?? []).join(" · ");
  const titre = "Chantier mis à jour";
  const corps = `La fiche client / le bon de commande a été mis à jour · ${prestas} · ${pose.ville} · ${pose.departement}`;

  await admin.from("notifications").insert({
    user_id: pose.poseur_id,
    type: "maj_chantier",
    pose_id: pose.id,
    titre,
    corps,
  });

  await sendPushToUser(admin, pose.poseur_id, {
    title: titre,
    body: corps,
    url: "/poseur",
  });

  return NextResponse.json({ ok: true });
}

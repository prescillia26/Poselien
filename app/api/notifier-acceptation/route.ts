import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { creneauLabel } from "@/lib/poses";
import { sendPushToUser } from "@/lib/push";

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
    .select("id, entreprise_id, poseur_id, statut, prestations, ville, departement, creneau_id")
    .eq("id", pose_id)
    .single();

  // Seul le poseur attribué (pose acceptée) peut déclencher cette notification
  if (!pose || pose.poseur_id !== user.id || pose.statut === "ouverte") {
    return NextResponse.json({ error: "non autorisé" }, { status: 403 });
  }

  // Entreprise à prévenir
  const { data: entreprise } = await admin
    .from("profiles")
    .select("id, email, nom")
    .eq("id", pose.entreprise_id)
    .single();
  if (!entreprise) return NextResponse.json({ error: "entreprise introuvable" }, { status: 404 });

  // Créneau choisi
  let creneauTxt = "";
  if (pose.creneau_id) {
    const { data: c } = await admin
      .from("creneaux")
      .select("id, pose_id, jour, h_debut, h_fin")
      .eq("id", pose.creneau_id)
      .single();
    if (c) creneauTxt = creneauLabel(c);
  }

  const prestas = (pose.prestations ?? []).join(" · ");
  const lieu = `${pose.ville} · ${pose.departement}`;
  const titre = "Votre pose a été acceptée";
  const corps = creneauTxt
    ? `${prestas} · ${lieu} — créneau retenu : ${creneauTxt}`
    : `${prestas} · ${lieu}`;

  await admin.from("notifications").insert({
    user_id: entreprise.id,
    type: "pose_acceptee",
    pose_id: pose.id,
    titre,
    corps,
  });

  // Notification push à l'entreprise (non bloquant)
  await sendPushToUser(admin, entreprise.id, {
    title: titre,
    body: corps,
    url: "/entreprise",
  });

  return NextResponse.json({ ok: true });
}

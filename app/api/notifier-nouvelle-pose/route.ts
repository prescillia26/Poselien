import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { eur, netPoseur } from "@/lib/poses";
import { sendPushToUser } from "@/lib/push";

export async function POST(request: NextRequest) {
  const { pose_id } = await request.json().catch(() => ({ pose_id: null }));
  if (!pose_id) return NextResponse.json({ error: "pose_id manquant" }, { status: 400 });

  // 1) Qui appelle ? (session)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "non connecté" }, { status: 401 });

  // 2) Charge la pose avec la clé secrète (serveur)
  const admin = createAdminClient();
  const { data: pose } = await admin
    .from("poses")
    .select("id, entreprise_id, prestations, departement, region, ville, prix")
    .eq("id", pose_id)
    .single();

  // Seule l'entreprise propriétaire peut déclencher la notification
  if (!pose || pose.entreprise_id !== user.id) {
    return NextResponse.json({ error: "non autorisé" }, { status: 403 });
  }

  // 3) Poseurs dont le périmètre couvre le département de la pose
  const { data: poseurs } = await admin
    .from("profiles")
    .select("id, email, nom, perimetre_toute_france, perimetre_regions")
    .eq("role", "poseur");

  const cibles = (poseurs ?? []).filter(
    (p) =>
      p.perimetre_toute_france ||
      (pose.region &&
        Array.isArray(p.perimetre_regions) &&
        p.perimetre_regions.includes(pose.region)),
  );

  const lieu = `${pose.ville} · ${pose.departement}`;
  const prestas = (pose.prestations ?? []).join(" · ");
  const montant = `${eur(netPoseur(pose.prix))} net`;
  const titre = "Nouvelle pose près de vous";
  const corps = `${prestas} · ${lieu} · ${montant}`;

  // 4) Notifications in-app (une par poseur ciblé)
  if (cibles.length > 0) {
    await admin.from("notifications").insert(
      cibles.map((p) => ({
        user_id: p.id,
        type: "nouvelle_pose",
        pose_id: pose.id,
        titre,
        corps,
      })),
    );
  }

  // 5) Notifications push (meilleur effort, non bloquant)
  await Promise.all(
    cibles.map((p) =>
      sendPushToUser(admin, p.id, {
        title: titre,
        body: corps,
        url: "/poseur",
      }),
    ),
  );

  return NextResponse.json({ notified: cibles.length });
}

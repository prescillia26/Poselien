import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Enregistre (ou met à jour) l'abonnement push de l'appareil courant.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const sub = body?.subscription;
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ error: "abonnement invalide" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "non connecté" }, { status: 401 });

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      user_id: user.id,
    },
    { onConflict: "endpoint" },
  );

  if (error) return NextResponse.json({ error: "enregistrement impossible" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

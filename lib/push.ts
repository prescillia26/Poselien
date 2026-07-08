import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

let configured = false;

function configure(): boolean {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:contact@poselien.app";
  if (!pub || !priv) return false;
  if (!configured) {
    webpush.setVapidDetails(subject, pub, priv);
    configured = true;
  }
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

// Envoie une notification push à tous les appareils d'un utilisateur.
// Non bloquant : si le push n'est pas configuré, ne fait rien.
export async function sendPushToUser(
  admin: SupabaseClient,
  userId: string,
  payload: PushPayload,
): Promise<void> {
  if (!configure()) return;

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs || subs.length === 0) return;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint as string,
            keys: { p256dh: s.p256dh as string, auth: s.auth as string },
          },
          JSON.stringify(payload),
        );
      } catch (e: unknown) {
        // Abonnement expiré (404/410) -> on le supprime
        const code = (e as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) {
          await admin
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", s.endpoint as string);
        }
      }
    }),
  );
}

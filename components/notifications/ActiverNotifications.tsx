"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, BellOff } from "lucide-react";
import { C } from "@/lib/theme";

type Etat = "check" | "unsupported" | "off" | "on" | "denied" | "busy";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function supported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export default function ActiverNotifications() {
  const [etat, setEtat] = useState<Etat>("check");

  useEffect(() => {
    if (!supported()) {
      setEtat("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setEtat("denied");
      return;
    }
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => setEtat(sub ? "on" : "off"))
      .catch(() => setEtat("off"));
  }, []);

  async function activer() {
    setEtat("busy");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setEtat(perm === "denied" ? "denied" : "off");
        return;
      }

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
          ) as BufferSource,
        });
      }

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      setEtat(res.ok ? "on" : "off");
    } catch {
      setEtat("off");
    }
  }

  if (etat === "check") return null;

  if (etat === "unsupported") {
    return (
      <Carte
        icon={BellOff}
        titre="Notifications non disponibles"
        texte="Sur iPhone, ajoutez d'abord l'app à l'écran d'accueil (Partager → Sur l'écran d'accueil), puis rouvrez-la."
        muted
      />
    );
  }

  if (etat === "denied") {
    return (
      <Carte
        icon={BellOff}
        titre="Notifications bloquées"
        texte="Autorisez les notifications pour Posélien dans les réglages de votre navigateur, puis réessayez."
        muted
      />
    );
  }

  if (etat === "on") {
    return (
      <Carte
        icon={BellRing}
        titre="Notifications activées"
        texte="Vous recevrez une alerte sur cet appareil."
        on
      />
    );
  }

  // "off" ou "busy"
  return (
    <div
      className="flex items-center gap-3 rounded-2xl bg-white p-3.5"
      style={{ border: `1px solid ${C.line}` }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: C.orangeBg }}
      >
        <Bell size={18} color={C.orange} />
      </div>
      <div className="flex-1">
        <div className="text-sm font-bold" style={{ color: C.ink }}>
          Notifications push
        </div>
        <div className="text-xs" style={{ color: C.muted }}>
          Soyez prévenu sur cet appareil.
        </div>
      </div>
      <button
        onClick={activer}
        disabled={etat === "busy"}
        className="rounded-xl px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
        style={{ background: C.orange }}
      >
        {etat === "busy" ? "…" : "Activer"}
      </button>
    </div>
  );
}

function Carte({
  icon: Icon,
  titre,
  texte,
  on,
  muted,
}: {
  icon: typeof Bell;
  titre: string;
  texte: string;
  on?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className="flex items-start gap-3 rounded-2xl p-3.5"
      style={{
        background: on ? C.greenBg : "#fff",
        border: `1px solid ${on ? C.green : C.line}`,
      }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: on ? C.green : muted ? "#EEF2F1" : C.orangeBg }}
      >
        <Icon size={18} color={on ? "#fff" : C.muted} />
      </div>
      <div>
        <div className="text-sm font-bold" style={{ color: C.ink }}>
          {titre}
        </div>
        <div className="mt-0.5 text-xs" style={{ color: C.muted }}>
          {texte}
        </div>
      </div>
    </div>
  );
}

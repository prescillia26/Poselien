"use client";

import { useEffect, useState } from "react";
import { Zap, CheckCircle2, RefreshCw } from "lucide-react";
import { C } from "@/lib/theme";
import { createClient } from "@/lib/supabase/client";
import { SectionLabel, Empty } from "@/components/ui";

interface Notif {
  id: string;
  type: string;
  titre: string;
  corps: string | null;
  lu: boolean;
  created_at: string;
}

function timeAgo(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.round(h / 24)} j`;
}

export default function NotifsList() {
  const [notifs, setNotifs] = useState<Notif[] | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, type, titre, corps, lu, created_at")
        .order("created_at", { ascending: false });
      const list = (data as Notif[]) ?? [];
      setNotifs(list);

      const nonLues = list.filter((n) => !n.lu).map((n) => n.id);
      if (nonLues.length > 0) {
        await supabase
          .from("notifications")
          .update({ lu: true })
          .in("id", nonLues);
      }
    })();
  }, []);

  return (
    <div className="p-4">
      <SectionLabel>NOTIFICATIONS</SectionLabel>
      {notifs === null ? (
        <p className="text-sm" style={{ color: C.muted }}>
          Chargement…
        </p>
      ) : notifs.length === 0 ? (
        <Empty text="Aucune notification pour l'instant." />
      ) : (
        <div className="flex flex-col gap-2.5">
          {notifs.map((n) => {
            const nouvelle = !n.lu;
            const Icon =
              n.type === "pose_acceptee"
                ? CheckCircle2
                : n.type === "maj_chantier"
                  ? RefreshCw
                  : Zap;
            return (
              <div
                key={n.id}
                className="flex items-start gap-3 rounded-2xl p-3.5"
                style={{
                  background: nouvelle ? C.tealBg : "#fff",
                  border: `1px solid ${nouvelle ? C.teal : C.line}`,
                }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: nouvelle ? C.teal : C.orangeBg }}
                >
                  <Icon size={18} color={nouvelle ? "#fff" : C.orange} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: C.ink }}>
                      {n.titre}
                    </span>
                    {nouvelle && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                        style={{ background: C.orange }}
                      >
                        Nouveau
                      </span>
                    )}
                  </div>
                  {n.corps && (
                    <div className="mt-0.5 text-sm" style={{ color: C.muted }}>
                      {n.corps}
                    </div>
                  )}
                  <div className="mt-1 text-[11px]" style={{ color: C.muted }}>
                    {timeAgo(n.created_at)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

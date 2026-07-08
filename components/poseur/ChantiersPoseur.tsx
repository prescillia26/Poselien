"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  CalendarCheck,
  User,
  Phone,
  Home,
  Package,
  FileText,
  MessageCircle,
} from "lucide-react";
import { C } from "@/lib/theme";
import { Pose, PoseClient, eur, netPoseur, creneauLabel } from "@/lib/poses";
import { createClient } from "@/lib/supabase/client";
import { SectionLabel, Empty, Chip } from "@/components/ui";
import ChatScreen from "@/components/chat/ChatScreen";

interface Chantier extends Pose {
  fiche: PoseClient | null;
}

export default function ChantiersPoseur() {
  const [chantiers, setChantiers] = useState<Chantier[] | null>(null);
  const [liens, setLiens] = useState<Record<string, string>>({});
  const [chat, setChat] = useState<Pose | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("poses")
        .select("*, creneaux!creneaux_pose_id_fkey(*), pose_client(*)")
        .eq("statut", "en_cours")
        .order("created_at", { ascending: false });

      const rows = (data ?? []).map((r: Record<string, unknown>) => {
        const pc = r.pose_client as PoseClient | PoseClient[] | null;
        const fiche = Array.isArray(pc) ? (pc[0] ?? null) : (pc ?? null);
        return { ...(r as unknown as Pose), fiche } as Chantier;
      });
      setChantiers(rows);

      // Liens signés vers les bons de commande
      const map: Record<string, string> = {};
      for (const ch of rows) {
        const path = ch.fiche?.bon_commande_path;
        if (path) {
          const { data: signed } = await supabase.storage
            .from("bons-commande")
            .createSignedUrl(path, 3600);
          if (signed?.signedUrl) map[ch.id] = signed.signedUrl;
        }
      }
      setLiens(map);
    })();
  }, []);

  if (chat) {
    return <ChatScreen pose={chat} role="poseur" onBack={() => setChat(null)} />;
  }

  return (
    <div className="p-4">
      <SectionLabel>MES CHANTIERS ACCEPTÉS</SectionLabel>
      {chantiers === null ? (
        <p className="text-sm" style={{ color: C.muted }}>
          Chargement…
        </p>
      ) : chantiers.length === 0 ? (
        <Empty text="Aucun chantier accepté pour l'instant. Acceptez une pose depuis l'onglet « Poses »." />
      ) : (
        <div className="flex flex-col gap-3">
          {chantiers.map((ch) => {
            const creneau = ch.creneaux?.find((c) => c.id === ch.creneau_id);
            const f = ch.fiche;
            return (
              <div
                key={ch.id}
                className="rounded-2xl bg-white p-3.5"
                style={{ border: `1px solid ${C.line}` }}
              >
                <div className="flex flex-wrap gap-1.5">
                  {ch.prestations.map((p) => (
                    <Chip key={p}>{p}</Chip>
                  ))}
                </div>
                <div
                  className="mt-2.5 flex items-center gap-1 text-sm"
                  style={{ color: C.muted }}
                >
                  <MapPin size={14} />
                  {ch.ville} · {ch.departement}
                </div>
                {creneau && (
                  <div
                    className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold"
                    style={{ color: C.teal }}
                  >
                    <CalendarCheck size={15} /> {creneauLabel(creneau)}
                  </div>
                )}
                <div
                  className="mt-1 text-sm font-extrabold"
                  style={{ color: C.teal }}
                >
                  {eur(netPoseur(ch.prix))}{" "}
                  <span className="text-xs font-medium" style={{ color: C.muted }}>
                    net
                  </span>
                </div>

                {/* Fiche client débloquée */}
                <div
                  className="mt-3 rounded-xl p-3"
                  style={{ background: C.greenBg }}
                >
                  <div
                    className="mb-2 text-xs font-bold tracking-wide"
                    style={{ color: C.green }}
                  >
                    FICHE CLIENT (débloquée)
                  </div>
                  <div className="flex flex-col gap-1.5 text-sm" style={{ color: C.ink }}>
                    {f?.client_nom && (
                      <Line icon={User} text={f.client_nom} />
                    )}
                    {f?.client_adresse && (
                      <Line icon={Home} text={f.client_adresse} />
                    )}
                    {f?.client_tel && (
                      <Line icon={Phone} text={f.client_tel} />
                    )}
                    {f?.lieu_retrait && (
                      <Line
                        icon={Package}
                        text={`Retrait : ${f.lieu_retrait}`}
                      />
                    )}
                    {f?.client_details && (
                      <p className="mt-1 text-sm" style={{ color: C.muted }}>
                        {f.client_details}
                      </p>
                    )}
                    {liens[ch.id] && (
                      <a
                        href={liens[ch.id]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold"
                        style={{ color: C.teal }}
                      >
                        <FileText size={15} /> Voir le bon de commande
                      </a>
                    )}
                    {!f && (
                      <span className="text-sm" style={{ color: C.muted }}>
                        Aucune information client renseignée.
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setChat(ch)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold"
                  style={{ background: C.tealBg, color: C.teal }}
                >
                  <MessageCircle size={16} /> Discuter avec l&apos;entreprise
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Line({
  icon: Icon,
  text,
}: {
  icon: typeof User;
  text: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <Icon size={14} color={C.green} /> {text}
    </span>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageCircle, Pencil, Trash2, UserCog } from "lucide-react";
import { C } from "@/lib/theme";
import { Pose } from "@/lib/poses";
import { createClient } from "@/lib/supabase/client";
import { SectionLabel, Empty } from "@/components/ui";
import PoseCard from "./PoseCard";
import PublierForm from "./PublierForm";
import ModifierFicheClient from "./ModifierFicheClient";
import ChatScreen from "@/components/chat/ChatScreen";

export default function MesPosesEntreprise({
  filtre,
}: {
  filtre: "attente" | "acceptees";
}) {
  const [poses, setPoses] = useState<Pose[] | null>(null);
  const [chat, setChat] = useState<Pose | null>(null);
  const [edit, setEdit] = useState<Pose | null>(null);
  const [editFiche, setEditFiche] = useState<Pose | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("poses")
      .select("*, creneaux!creneaux_pose_id_fkey(*)")
      .order("created_at", { ascending: false });
    setPoses((data as Pose[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function supprimer(p: Pose) {
    if (!window.confirm("Supprimer définitivement cette pose ?")) return;
    const supabase = createClient();
    await supabase.from("poses").delete().eq("id", p.id);
    await load();
  }

  if (edit) {
    return (
      <PublierForm
        editPose={edit}
        onDone={() => {
          setEdit(null);
          load();
        }}
      />
    );
  }

  if (editFiche) {
    return (
      <ModifierFicheClient
        pose={editFiche}
        onDone={() => {
          setEditFiche(null);
          load();
        }}
      />
    );
  }

  if (chat) {
    return (
      <ChatScreen pose={chat} role="entreprise" onBack={() => setChat(null)} />
    );
  }

  if (poses === null) {
    return (
      <div className="p-4">
        <p className="text-sm" style={{ color: C.muted }}>
          Chargement…
        </p>
      </div>
    );
  }

  const liste =
    filtre === "attente"
      ? poses.filter((p) => p.statut === "ouverte")
      : poses.filter((p) => p.statut !== "ouverte");

  const titre = filtre === "attente" ? "EN ATTENTE" : "ACCEPTÉES";
  const vide =
    filtre === "attente"
      ? "Aucune pose en attente. Publiez-en une depuis « Publier »."
      : "Aucune pose acceptée pour l'instant.";

  return (
    <div className="p-4">
      <SectionLabel>
        {titre} ({liste.length})
      </SectionLabel>
      {liste.length === 0 ? (
        <Empty text={vide} />
      ) : (
        <div className="flex flex-col gap-3">
          {liste.map((p) => (
            <div key={p.id} className="flex flex-col gap-2">
              <PoseCard pose={p} mode="entreprise" />

              {filtre === "attente" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEdit(p)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold"
                    style={{ background: C.tealBg, color: C.teal }}
                  >
                    <Pencil size={15} /> Modifier
                  </button>
                  <button
                    onClick={() => supprimer(p)}
                    className="flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold"
                    style={{ background: C.redBg, color: C.red }}
                  >
                    <Trash2 size={15} /> Supprimer
                  </button>
                </div>
              )}

              {filtre === "acceptees" && p.statut === "en_cours" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditFiche(p)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold"
                    style={{ background: C.tealBg, color: C.teal }}
                  >
                    <UserCog size={16} /> Modifier
                  </button>
                  <button
                    onClick={() => setChat(p)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold"
                    style={{ background: C.tealBg, color: C.teal }}
                  >
                    <MessageCircle size={16} /> Discuter
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

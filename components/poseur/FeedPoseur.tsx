"use client";

import { useCallback, useEffect, useState } from "react";
import { C } from "@/lib/theme";
import { Pose } from "@/lib/poses";
import { createClient } from "@/lib/supabase/client";
import { SectionLabel, Empty } from "@/components/ui";
import PoseCard from "@/components/pose/PoseCard";
import PoseDetailPoseur from "./PoseDetailPoseur";

export default function FeedPoseur() {
  const [poses, setPoses] = useState<Pose[] | null>(null);
  const [selected, setSelected] = useState<Pose | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("poses")
      .select("*, creneaux!creneaux_pose_id_fkey(*)")
      .eq("statut", "ouverte")
      .order("created_at", { ascending: false });
    setPoses((data as Pose[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function toast(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 3000);
  }

  if (selected) {
    return (
      <PoseDetailPoseur
        pose={selected}
        onBack={() => setSelected(null)}
        onAccepted={() => {
          setSelected(null);
          toast("Pose acceptée ✅ Retrouvez-la dans « Chantiers ».");
          load();
        }}
        onRefused={() => {
          setSelected(null);
          toast("Pose refusée. Elle n'apparaît plus dans votre fil.");
          load();
        }}
      />
    );
  }

  return (
    <div className="p-4">
      <SectionLabel>POSES DISPONIBLES DANS VOTRE PÉRIMÈTRE</SectionLabel>

      {flash && (
        <div
          className="mb-3 rounded-xl px-3 py-2.5 text-sm font-semibold"
          style={{ background: C.greenBg, color: C.green }}
        >
          {flash}
        </div>
      )}

      {poses === null ? (
        <p className="text-sm" style={{ color: C.muted }}>
          Chargement…
        </p>
      ) : poses.length === 0 ? (
        <Empty text="Aucune pose disponible. Vérifiez votre périmètre dans l'onglet « Espace »." />
      ) : (
        <div className="flex flex-col gap-3">
          {poses.map((p) => (
            <PoseCard
              key={p.id}
              pose={p}
              mode="poseur"
              onClick={() => setSelected(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

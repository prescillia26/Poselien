"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, MapPin, Sparkles, Check, Ban, ShieldAlert } from "lucide-react";
import { C } from "@/lib/theme";
import { Pose, eur, netPoseur, creneauLabel } from "@/lib/poses";
import { createClient } from "@/lib/supabase/client";
import { Badge, Chip } from "@/components/ui";
import { PrimaryButton, ErrorNote } from "@/components/auth/fields";

export default function PoseDetailPoseur({
  pose,
  onBack,
  onAccepted,
  onRefused,
}: {
  pose: Pose;
  onBack: () => void;
  onAccepted: () => void;
  onRefused: () => void;
}) {
  const creneaux = pose.creneaux ?? [];
  const [choix, setChoix] = useState<string | null>(
    creneaux.length === 1 ? creneaux[0].id : null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eligible, setEligible] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .rpc("poseur_peut_accepter")
      .then(({ data }) => setEligible(data === true));
  }, []);

  async function accepter() {
    setError(null);
    if (!choix) {
      setError("Choisissez un créneau avant d'accepter.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("accepter_pose", {
      p_pose_id: pose.id,
      p_creneau_id: choix,
    });
    setBusy(false);

    if (error) {
      if (error.message.includes("POSE_DEJA_PRISE")) {
        setError("Cette pose vient d'être prise par un autre poseur.");
      } else if (error.message.includes("DOSSIER_INCOMPLET")) {
        setError(
          "Dossier incomplet : validez vos documents et signez le contrat dans l'onglet « Espace ».",
        );
      } else {
        setError("Acceptation impossible. Réessayez.");
      }
      return;
    }

    // Prévenir l'entreprise (email + notif), non bloquant
    fetch("/api/notifier-acceptation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pose_id: pose.id }),
    }).catch(() => {});

    onAccepted();
  }

  async function refuser() {
    setBusy(true);
    const supabase = createClient();
    await supabase.from("pose_refus").insert({ pose_id: pose.id });
    setBusy(false);
    onRefused();
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <button
          onClick={onBack}
          className="mb-3 inline-flex items-center gap-1 text-sm font-semibold"
          style={{ color: C.teal }}
        >
          <ChevronLeft size={16} /> Retour
        </button>

        <div className="flex flex-wrap gap-1.5">
          {pose.prestations.map((p) => (
            <Chip key={p}>{p}</Chip>
          ))}
        </div>

        <div
          className="mt-2.5 flex items-center gap-1 text-sm"
          style={{ color: C.muted }}
        >
          <MapPin size={14} />
          {pose.ville} · {pose.departement}
        </div>

        {pose.description && (
          <p className="mt-2 text-sm leading-relaxed" style={{ color: C.ink }}>
            {pose.description}
          </p>
        )}

        {pose.aides && (
          <div className="mt-3">
            <Badge bg={C.greenBg} color={C.green} icon={Sparkles}>
              Aides éligibles
            </Badge>
          </div>
        )}

        {/* Montant net */}
        <div
          className="mt-4 flex items-center justify-between rounded-xl px-3.5 py-3"
          style={{ background: C.tealBg }}
        >
          <span className="text-sm font-semibold" style={{ color: C.teal }}>
            Montant net (−5 %)
          </span>
          <span className="text-lg font-extrabold" style={{ color: C.teal }}>
            {eur(netPoseur(pose.prix))}
          </span>
        </div>

        {/* Choix du créneau */}
        <div className="mt-4">
          <div
            className="mb-2 text-xs font-bold tracking-wide"
            style={{ color: C.muted }}
          >
            CHOISISSEZ UN CRÉNEAU
          </div>
          <div className="flex flex-col gap-2">
            {creneaux.map((c) => {
              const on = choix === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setChoix(c.id);
                    setError(null);
                  }}
                  className="flex items-center justify-between rounded-xl bg-white px-3.5 py-3 text-left"
                  style={{ border: `1px solid ${on ? C.teal : C.line}` }}
                >
                  <span
                    className="text-sm font-medium"
                    style={{ color: C.ink }}
                  >
                    {creneauLabel(c)}
                  </span>
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full"
                    style={{
                      background: on ? C.teal : "#fff",
                      border: `1px solid ${on ? C.teal : C.line}`,
                    }}
                  >
                    {on && <Check size={13} color="#fff" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="mt-4 flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs"
          style={{ background: C.amberBg, color: C.amber }}
        >
          <Ban size={14} className="mt-0.5 shrink-0" />
          La fiche client et le bon de commande vous seront communiqués dès
          l&apos;acceptation.
        </div>
      </div>

      {/* Barre d'action épinglée */}
      <div
        className="sticky bottom-0 z-10 flex flex-col gap-2 border-t px-4 py-3 pb-4"
        style={{
          background: "#fff",
          borderColor: C.line,
          boxShadow: "0 -6px 16px rgba(11,61,58,0.06)",
        }}
      >
        {eligible === false && (
          <div
            className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs"
            style={{ background: C.amberBg, color: C.amber }}
          >
            <ShieldAlert size={14} className="mt-0.5 shrink-0" />
            Pour accepter une pose, complétez votre dossier : documents validés et
            contrat signé, dans l&apos;onglet « Espace ».
          </div>
        )}
        {error && <ErrorNote>{error}</ErrorNote>}
        <div className="flex gap-2">
          <button
            onClick={refuser}
            disabled={busy}
            className="flex-1 rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-60"
            style={{ background: "#fff", color: C.red, border: `1px solid ${C.line}` }}
          >
            Refuser
          </button>
          <div className="flex-[2]">
            <PrimaryButton
              onClick={accepter}
              disabled={busy || eligible === false}
            >
              {busy ? "…" : "Accepter cette pose"}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}

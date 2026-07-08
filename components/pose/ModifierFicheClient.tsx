"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { C } from "@/lib/theme";
import { Pose, eur, creneauLabel } from "@/lib/poses";
import { createClient } from "@/lib/supabase/client";
import { Chip } from "@/components/ui";
import {
  Field,
  TextInput,
  Textarea,
  PrimaryButton,
  ErrorNote,
  OkNote,
} from "@/components/auth/fields";

const cleanName = (n: string) =>
  n
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9.\-_]/g, "-");

export default function ModifierFicheClient({
  pose,
  onDone,
}: {
  pose: Pose;
  onDone: () => void;
}) {
  const [nom, setNom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [tel, setTel] = useState("");
  const [details, setDetails] = useState("");
  const [retrait, setRetrait] = useState("");
  const [bonExistant, setBonExistant] = useState<string | null>(null);
  const [fichier, setFichier] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const creneau = pose.creneaux?.find((c) => c.id === pose.creneau_id);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("pose_client")
      .select("*")
      .eq("pose_id", pose.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setNom(data.client_nom ?? "");
          setAdresse(data.client_adresse ?? "");
          setTel(data.client_tel ?? "");
          setDetails(data.client_details ?? "");
          setRetrait(data.lieu_retrait ?? "");
          setBonExistant(data.bon_commande_path ?? null);
        }
      });
  }, [pose.id]);

  async function enregistrer() {
    setError(null);
    setLoading(true);
    const supabase = createClient();

    let bonPath = bonExistant;
    if (fichier) {
      const path = `${pose.id}/${Date.now()}-${cleanName(fichier.name)}`;
      const { error: eUp } = await supabase.storage
        .from("bons-commande")
        .upload(path, fichier);
      if (eUp) {
        setError(`Envoi du bon de commande impossible : ${eUp.message}`);
        setLoading(false);
        return;
      }
      bonPath = path;
    }

    const { error: eDb } = await supabase.from("pose_client").upsert(
      {
        pose_id: pose.id,
        client_nom: nom.trim() || null,
        client_adresse: adresse.trim() || null,
        client_tel: tel.trim() || null,
        client_details: details.trim() || null,
        lieu_retrait: retrait.trim() || null,
        bon_commande_path: bonPath,
      },
      { onConflict: "pose_id" },
    );
    if (eDb) {
      setError(`Enregistrement impossible : ${eDb.message}`);
      setLoading(false);
      return;
    }

    // Prévenir le poseur (notif + push), non bloquant
    fetch("/api/notifier-maj-chantier", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pose_id: pose.id }),
    }).catch(() => {});

    setLoading(false);
    setOk(true);
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-extrabold" style={{ color: C.ink }}>
            Modifier la fiche client
          </h1>
          <p className="mt-1 text-sm" style={{ color: C.muted }}>
            Pose acceptée : seules ces informations restent modifiables.
          </p>
        </div>
        <button
          onClick={onDone}
          className="shrink-0 text-sm font-semibold"
          style={{ color: C.muted }}
        >
          Retour
        </button>
      </div>

      {/* Infos verrouillées (non modifiables après acceptation) */}
      <div
        className="rounded-2xl p-3.5"
        style={{ background: C.bg, border: `1px solid ${C.line}` }}
      >
        <div
          className="mb-2 flex items-center gap-1.5 text-xs font-bold"
          style={{ color: C.muted }}
        >
          <Lock size={13} /> VERROUILLÉ APRÈS ACCEPTATION
        </div>
        <div className="flex flex-wrap gap-1.5">
          {pose.prestations.map((p) => (
            <Chip key={p}>{p}</Chip>
          ))}
        </div>
        <div className="mt-2 text-sm" style={{ color: C.ink }}>
          Prix : <b>{eur(pose.prix)}</b>
          {creneau && (
            <>
              {" · "}Créneau : <b>{creneauLabel(creneau)}</b>
            </>
          )}
        </div>
      </div>

      {/* Champs modifiables */}
      <Field label="Nom du client">
        <TextInput value={nom} onChange={(e) => setNom(e.target.value)} />
      </Field>
      <Field label="Adresse">
        <TextInput
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
        />
      </Field>
      <Field label="Téléphone">
        <TextInput value={tel} onChange={(e) => setTel(e.target.value)} />
      </Field>
      <Field label="Détails (matériel, accès…)">
        <Textarea
          rows={2}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
      </Field>
      <Field label="Lieu de retrait du matériel">
        <TextInput
          value={retrait}
          onChange={(e) => setRetrait(e.target.value)}
        />
      </Field>
      <Field label="Bon de commande (remplacer)">
        <input
          type="file"
          accept="application/pdf,image/*"
          onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
          className="w-full text-sm"
          style={{ color: C.muted }}
        />
        {bonExistant && !fichier && (
          <div className="mt-1 text-[11px]" style={{ color: C.muted }}>
            Un bon de commande est déjà enregistré. Choisir un fichier le
            remplacera.
          </div>
        )}
      </Field>

      {error && <ErrorNote>{error}</ErrorNote>}
      {ok && <OkNote>Mise à jour enregistrée. Le poseur a été prévenu.</OkNote>}

      <PrimaryButton onClick={enregistrer} disabled={loading}>
        {loading ? "Enregistrement…" : "Enregistrer les modifications"}
      </PrimaryButton>
    </div>
  );
}

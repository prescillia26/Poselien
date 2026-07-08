"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Sparkles, Lock } from "lucide-react";
import { C } from "@/lib/theme";
import { PRESTATIONS } from "@/lib/data";
import { REGIONS, REGION_NAMES } from "@/lib/regions";
import { eur, totalEntreprise, Pose } from "@/lib/poses";
import { createClient } from "@/lib/supabase/client";

// Nettoie un nom de fichier (Supabase refuse espaces/accents/caractères spéciaux).
const cleanName = (n: string) =>
  n
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9.\-_]/g, "-");
import {
  Field,
  TextInput,
  Select,
  Textarea,
  PrimaryButton,
  ErrorNote,
  OkNote,
} from "@/components/auth/fields";
import { SectionLabel } from "@/components/ui";

interface CreneauInput {
  jour: string;
  h1: string;
  h2: string;
}

const emptyCreneau: CreneauInput = { jour: "", h1: "08:00", h2: "12:00" };

export default function PublierForm({
  onPublished,
  editPose,
  onDone,
}: {
  onPublished?: () => void;
  editPose?: Pose;
  onDone?: () => void;
}) {
  const edit = !!editPose;
  const [prestations, setPrestations] = useState<string[]>([]);
  const [departement, setDepartement] = useState("");
  const [ville, setVille] = useState("");
  const [prix, setPrix] = useState("");
  const [aides, setAides] = useState(true);
  const [description, setDescription] = useState("");
  const [retrait, setRetrait] = useState("");
  const [creneaux, setCreneaux] = useState<CreneauInput[]>([{ ...emptyCreneau }]);

  // Fiche client + bon de commande (cachés jusqu'à acceptation)
  const [clientNom, setClientNom] = useState("");
  const [clientAdresse, setClientAdresse] = useState("");
  const [clientTel, setClientTel] = useState("");
  const [clientDetails, setClientDetails] = useState("");
  const [fichier, setFichier] = useState<File | null>(null);
  const [bonExistant, setBonExistant] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const prixNum = Number(prix) || 0;

  // Mode modification : pré-remplit le formulaire depuis la pose existante.
  useEffect(() => {
    if (!editPose) return;
    setPrestations(editPose.prestations ?? []);
    setDepartement(editPose.departement ?? "");
    setVille(editPose.ville ?? "");
    setPrix(String(editPose.prix ?? ""));
    setAides(!!editPose.aides);
    setDescription(editPose.description ?? "");
    setCreneaux(
      editPose.creneaux && editPose.creneaux.length > 0
        ? editPose.creneaux.map((c) => ({
            jour: c.jour,
            h1: c.h_debut,
            h2: c.h_fin,
          }))
        : [{ ...emptyCreneau }],
    );
    const supabase = createClient();
    supabase
      .from("pose_client")
      .select("*")
      .eq("pose_id", editPose.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setClientNom(data.client_nom ?? "");
          setClientAdresse(data.client_adresse ?? "");
          setClientTel(data.client_tel ?? "");
          setClientDetails(data.client_details ?? "");
          setRetrait(data.lieu_retrait ?? "");
          setBonExistant(data.bon_commande_path ?? null);
        }
      });
  }, [editPose]);

  function togglePrestation(p: string) {
    setPrestations((cur) =>
      cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p],
    );
  }
  function setCreneau(i: number, patch: Partial<CreneauInput>) {
    setCreneaux((cur) =>
      cur.map((c, idx) => (idx === i ? { ...c, ...patch } : c)),
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const creneauxValides = creneaux.filter((c) => c.jour && c.h1 && c.h2);
    if (prestations.length === 0)
      return setError("Choisissez au moins une prestation.");
    if (!departement) return setError("Choisissez un département.");
    if (!ville.trim()) return setError("Indiquez la ville.");
    if (prixNum <= 0) return setError("Indiquez un prix.");
    if (creneauxValides.length === 0)
      return setError("Ajoutez au moins un créneau complet (date + heures).");

    setLoading(true);
    const supabase = createClient();

    // ===== MODE MODIFICATION =====
    if (edit && editPose) {
      const { error: eU } = await supabase
        .from("poses")
        .update({
          prestations,
          departement,
          ville: ville.trim(),
          prix: prixNum,
          aides,
          description: description.trim() || null,
        })
        .eq("id", editPose.id);
      if (eU) {
        setError("Modification impossible (la pose a peut-être été acceptée).");
        setLoading(false);
        return;
      }
      // Remplace les créneaux
      await supabase.from("creneaux").delete().eq("pose_id", editPose.id);
      await supabase.from("creneaux").insert(
        creneauxValides.map((c) => ({
          pose_id: editPose.id,
          jour: c.jour,
          h_debut: c.h1,
          h_fin: c.h2,
        })),
      );
      // Bon de commande : garde l'existant sauf si un nouveau est fourni
      let bonPath = bonExistant;
      if (fichier) {
        const path = `${editPose.id}/${Date.now()}-${cleanName(fichier.name)}`;
        const { error: eUp } = await supabase.storage
          .from("bons-commande")
          .upload(path, fichier);
        if (!eUp) bonPath = path;
      }
      await supabase.from("pose_client").upsert(
        {
          pose_id: editPose.id,
          client_nom: clientNom.trim() || null,
          client_adresse: clientAdresse.trim() || null,
          client_tel: clientTel.trim() || null,
          client_details: clientDetails.trim() || null,
          lieu_retrait: retrait.trim() || null,
          bon_commande_path: bonPath,
        },
        { onConflict: "pose_id" },
      );
      setLoading(false);
      onDone?.();
      return;
    }

    // 1) La pose (entreprise_id et region sont remplis automatiquement)
    const { data: pose, error: e1 } = await supabase
      .from("poses")
      .insert({
        prestations,
        departement,
        ville: ville.trim(),
        prix: prixNum,
        aides,
        description: description.trim() || null,
      })
      .select("id")
      .single();

    if (e1 || !pose) {
      setError(
        `Enregistrement impossible : ${e1?.message ?? "aucune donnée renvoyée"}`,
      );
      setLoading(false);
      return;
    }
    const poseId = pose.id as string;

    // 2) Les créneaux
    const { error: e2 } = await supabase.from("creneaux").insert(
      creneauxValides.map((c) => ({
        pose_id: poseId,
        jour: c.jour,
        h_debut: c.h1,
        h_fin: c.h2,
      })),
    );
    if (e2) {
      setError("Pose créée, mais les créneaux n'ont pas pu être enregistrés.");
      setLoading(false);
      return;
    }

    // 3) Bon de commande (facultatif) -> stockage privé
    let bonPath: string | null = null;
    if (fichier) {
      const path = `${poseId}/${Date.now()}-${cleanName(fichier.name)}`;
      const { error: eUp } = await supabase.storage
        .from("bons-commande")
        .upload(path, fichier);
      if (!eUp) bonPath = path;
    }

    // 4) Fiche client (table privée)
    await supabase.from("pose_client").insert({
      pose_id: poseId,
      client_nom: clientNom.trim() || null,
      client_adresse: clientAdresse.trim() || null,
      client_tel: clientTel.trim() || null,
      client_details: clientDetails.trim() || null,
      lieu_retrait: retrait.trim() || null,
      bon_commande_path: bonPath,
    });

    // 5) Prévenir les poseurs du bon périmètre (email + notif), non bloquant
    fetch("/api/notifier-nouvelle-pose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pose_id: poseId }),
    }).catch(() => {});

    // Réinitialisation
    setOk(true);
    setLoading(false);
    setPrestations([]);
    setDepartement("");
    setVille("");
    setPrix("");
    setDescription("");
    setRetrait("");
    setCreneaux([{ ...emptyCreneau }]);
    setClientNom("");
    setClientAdresse("");
    setClientTel("");
    setClientDetails("");
    setFichier(null);
    onPublished?.();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-extrabold" style={{ color: C.ink }}>
            {edit ? "Modifier la pose" : "Publier une pose"}
          </h1>
          <p className="mt-1 text-sm" style={{ color: C.muted }}>
            {edit
              ? "Modifiable tant que la pose n'est pas acceptée."
              : "Un poseur certifié de la zone concernée pourra l'accepter."}
          </p>
        </div>
        {edit && onDone && (
          <button
            type="button"
            onClick={onDone}
            className="shrink-0 text-sm font-semibold"
            style={{ color: C.muted }}
          >
            Annuler
          </button>
        )}
      </div>

      {/* Prestations */}
      <div>
        <SectionLabel>PRESTATIONS (plusieurs possibles)</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {PRESTATIONS.map((p) => {
            const on = prestations.includes(p);
            return (
              <button
                type="button"
                key={p}
                onClick={() => togglePrestation(p)}
                className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                style={{
                  background: on ? C.teal : "#fff",
                  color: on ? "#fff" : C.ink,
                  border: `1px solid ${on ? C.teal : C.line}`,
                }}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lieu */}
      <div className="flex flex-col gap-3">
        <Field label="Département">
          <Select
            value={departement}
            onChange={(e) => setDepartement(e.target.value)}
          >
            <option value="">— Choisir —</option>
            {REGION_NAMES.map((r) => (
              <optgroup key={r} label={r}>
                {REGIONS[r].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Field>
        <Field label="Ville">
          <TextInput
            value={ville}
            onChange={(e) => setVille(e.target.value)}
            placeholder="Ex. Aulnay-sous-Bois"
          />
        </Field>
      </div>

      {/* Créneaux */}
      <div>
        <SectionLabel>CRÉNEAUX PROPOSÉS</SectionLabel>
        <div className="flex flex-col gap-3">
          {creneaux.map((c, i) => (
            <div
              key={i}
              className="rounded-xl bg-white p-3"
              style={{ border: `1px solid ${C.line}` }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-bold"
                  style={{ color: C.muted }}
                >
                  Créneau {i + 1}
                </span>
                {creneaux.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setCreneaux((cur) => cur.filter((_, idx) => idx !== i))
                    }
                    style={{ color: C.red }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <input
                  type="date"
                  value={c.jour}
                  onChange={(e) => setCreneau(i, { jour: e.target.value })}
                  className="rounded-lg border px-2 py-2 text-sm outline-none"
                  style={{ borderColor: C.line, color: C.ink }}
                />
                <input
                  type="time"
                  value={c.h1}
                  onChange={(e) => setCreneau(i, { h1: e.target.value })}
                  className="rounded-lg border px-2 py-2 text-sm outline-none"
                  style={{ borderColor: C.line, color: C.ink }}
                />
                <input
                  type="time"
                  value={c.h2}
                  onChange={(e) => setCreneau(i, { h2: e.target.value })}
                  className="rounded-lg border px-2 py-2 text-sm outline-none"
                  style={{ borderColor: C.line, color: C.ink }}
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setCreneaux((cur) => [...cur, { ...emptyCreneau }])}
            className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold"
            style={{ border: `1px dashed ${C.line}`, color: C.teal }}
          >
            <Plus size={16} /> Ajouter un créneau
          </button>
        </div>
      </div>

      {/* Prix + aides */}
      <div>
        <Field label="Prix de la pose (€)">
          <TextInput
            type="number"
            inputMode="numeric"
            min={0}
            value={prix}
            onChange={(e) => setPrix(e.target.value)}
            placeholder="Ex. 2000"
          />
        </Field>
        {prixNum > 0 && (
          <div
            className="mt-2 rounded-xl px-3 py-2.5 text-sm"
            style={{ background: C.tealBg, color: C.teal }}
          >
            <div className="flex justify-between">
              <span>Vous serez débité (+5 %)</span>
              <span className="font-bold">{eur(totalEntreprise(prixNum))}</span>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setAides((v) => !v)}
          className="mt-3 flex w-full items-center justify-between rounded-xl bg-white px-3 py-2.5"
          style={{ border: `1px solid ${C.line}` }}
        >
          <span
            className="flex items-center gap-1.5 text-sm font-medium"
            style={{ color: C.ink }}
          >
            <Sparkles size={15} color={C.green} /> Éligible aides
          </span>
          <span
            className="flex h-6 w-11 items-center rounded-full px-0.5 transition-all"
            style={{
              background: aides ? C.orange : "#CBD5D2",
              justifyContent: aides ? "flex-end" : "flex-start",
            }}
          >
            <span className="h-5 w-5 rounded-full bg-white" />
          </span>
        </button>
      </div>

      {/* Description + retrait */}
      <Field label="Description du chantier">
        <Textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex. Dépose chaudière fioul + pose PAC air/eau 11 kW…"
        />
      </Field>

      {/* Fiche client privée */}
      <div
        className="rounded-2xl p-3.5"
        style={{ background: "#fff", border: `1px solid ${C.line}` }}
      >
        <div
          className="mb-1 flex items-center gap-1.5 text-sm font-bold"
          style={{ color: C.ink }}
        >
          <Lock size={15} color={C.muted} /> Fiche client &amp; bon de commande
        </div>
        <p className="mb-3 text-xs" style={{ color: C.muted }}>
          Ces informations restent <b>cachées</b> pour les poseurs tant que la
          pose n&apos;est pas acceptée.
        </p>
        <div className="flex flex-col gap-3">
          <Field label="Nom du client">
            <TextInput
              value={clientNom}
              onChange={(e) => setClientNom(e.target.value)}
              placeholder="M. et Mme Diallo"
            />
          </Field>
          <Field label="Adresse">
            <TextInput
              value={clientAdresse}
              onChange={(e) => setClientAdresse(e.target.value)}
              placeholder="14 rue des Lilas, 93600 Aulnay"
            />
          </Field>
          <Field label="Téléphone">
            <TextInput
              value={clientTel}
              onChange={(e) => setClientTel(e.target.value)}
              placeholder="06 12 34 56 78"
            />
          </Field>
          <Field label="Détails (matériel, accès…)">
            <Textarea
              rows={2}
              value={clientDetails}
              onChange={(e) => setClientDetails(e.target.value)}
              placeholder="PAC Atlantic 11 kW fournie. Local technique au sous-sol."
            />
          </Field>
          <Field label="Lieu de retrait du matériel">
            <TextInput
              value={retrait}
              onChange={(e) => setRetrait(e.target.value)}
              placeholder="Ex. Cedeo Aulnay — ZI la Fosse"
            />
          </Field>
          <Field label="Bon de commande (PDF, image…)">
            <input
              type="file"
              onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
              className="w-full text-sm"
              style={{ color: C.muted }}
            />
          </Field>
        </div>
      </div>

      {/* Barre d'action épinglée en bas : toujours visible */}
      <div
        className="sticky bottom-0 z-10 -mx-4 -mb-4 flex flex-col gap-2 border-t px-4 py-3 pb-4"
        style={{
          background: "#fff",
          borderColor: C.line,
          boxShadow: "0 -6px 16px rgba(11,61,58,0.06)",
        }}
      >
        {ok && <OkNote>Pose publiée ✅ Retrouvez-la dans « Mes poses ».</OkNote>}
        {error && <ErrorNote>{error}</ErrorNote>}
        <PrimaryButton type="submit" disabled={loading}>
          {loading
            ? "Enregistrement…"
            : edit
              ? "Enregistrer les modifications"
              : "Publier la pose"}
        </PrimaryButton>
      </div>
    </form>
  );
}

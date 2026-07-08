"use client";

import { useEffect, useState } from "react";
import { Upload, FileText } from "lucide-react";
import { C } from "@/lib/theme";
import { DOC_TYPES, DocRow, STATUT_DOC } from "@/lib/documents";
import { createClient } from "@/lib/supabase/client";
import { SectionLabel } from "@/components/ui";

export default function MesDocuments() {
  const [userId, setUserId] = useState<string | null>(null);
  const [docs, setDocs] = useState<Record<string, DocRow>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function load() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);
    const { data } = await supabase.from("documents").select("*");
    const map: Record<string, DocRow> = {};
    (data as DocRow[] | null)?.forEach((d) => (map[d.type] = d));
    setDocs(map);
  }

  useEffect(() => {
    load();
  }, []);

  async function envoyer(type: string, file: File) {
    if (!userId) return;
    setBusy(type);
    setErreur(null);
    const supabase = createClient();
    // Nettoie le nom du fichier (Supabase refuse espaces/accents/caractères spéciaux)
    const nomPropre = file.name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9.\-_]/g, "-");
    const path = `${userId}/${type}/${Date.now()}-${nomPropre}`;
    const { error: up } = await supabase.storage
      .from("documents")
      .upload(path, file);
    if (up) {
      setErreur(`Envoi du fichier impossible : ${up.message}`);
      setBusy(null);
      return;
    }
    const { error: dbErr } = await supabase.from("documents").upsert(
      {
        poseur_id: userId,
        type,
        fichier_path: path,
        statut: "a_valider",
        motif_refus: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "poseur_id,type" },
    );
    if (dbErr) {
      setErreur(`Enregistrement impossible : ${dbErr.message}`);
      setBusy(null);
      return;
    }
    await load();
    setBusy(null);
  }

  async function voir(path: string) {
    const supabase = createClient();
    const { data } = await supabase.storage
      .from("documents")
      .createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  return (
    <div className="p-4 pt-0">
      <SectionLabel>MES DOCUMENTS</SectionLabel>
      {erreur && (
        <div
          className="mb-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold"
          style={{ background: C.redBg, color: C.red }}
        >
          {erreur}
        </div>
      )}
      <div className="flex flex-col gap-2.5">
        {DOC_TYPES.map((t) => {
          const d = docs[t.key];
          const st = d ? STATUT_DOC[d.statut] : null;
          return (
            <div
              key={t.key}
              className="rounded-2xl bg-white p-3.5"
              style={{ border: `1px solid ${C.line}` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="text-sm font-semibold" style={{ color: C.ink }}>
                    {t.label}
                  </div>
                  {t.freq && (
                    <div className="text-[11px]" style={{ color: C.muted }}>
                      {t.freq}
                    </div>
                  )}
                </div>
                {st ? (
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{ background: st.bg, color: st.col }}
                  >
                    {st.txt}
                  </span>
                ) : (
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{ background: "#EEF2F1", color: C.muted }}
                  >
                    Manquant
                  </span>
                )}
              </div>

              {d?.statut === "refuse" && d.motif_refus && (
                <div
                  className="mt-2 rounded-lg px-2.5 py-1.5 text-xs"
                  style={{ background: C.redBg, color: C.red }}
                >
                  Motif du refus : {d.motif_refus}
                </div>
              )}

              <div className="mt-3 flex items-center gap-3">
                <label
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold"
                  style={{ background: C.tealBg, color: C.teal }}
                >
                  <Upload size={14} />
                  {busy === t.key
                    ? "Envoi…"
                    : d
                      ? "Remplacer"
                      : "Déposer"}
                  <input
                    type="file"
                    className="hidden"
                    accept="application/pdf,image/*"
                    disabled={busy === t.key}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) envoyer(t.key, f);
                      e.target.value = "";
                    }}
                  />
                </label>
                {d?.fichier_path && (
                  <button
                    onClick={() => voir(d.fichier_path as string)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold"
                    style={{ color: C.muted }}
                  >
                    <FileText size={14} /> Voir
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

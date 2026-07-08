"use client";

import { useEffect, useState } from "react";
import { FileText, Check, X, ShieldCheck } from "lucide-react";
import { C } from "@/lib/theme";
import { DOC_TYPES, DocStatut, STATUT_DOC } from "@/lib/documents";
import { createClient } from "@/lib/supabase/client";

interface AdminDoc {
  id: string;
  type: string;
  statut: DocStatut;
  fichier_path: string | null;
  motif_refus: string | null;
  created_at: string;
  profiles: { nom: string | null; email: string | null } | null;
}

const LABELS: Record<string, string> = Object.fromEntries(
  DOC_TYPES.map((t) => [t.key, t.label]),
);

export default function AdminDocuments() {
  const [docs, setDocs] = useState<AdminDoc[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("documents")
      .select("id, type, statut, fichier_path, motif_refus, created_at, profiles(nom, email)")
      .order("created_at", { ascending: false });
    setDocs((data as unknown as AdminDoc[]) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatut(id: string, statut: DocStatut, motif: string | null) {
    setBusy(id);
    const supabase = createClient();
    await supabase
      .from("documents")
      .update({ statut, motif_refus: motif, updated_at: new Date().toISOString() })
      .eq("id", id);
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
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <div
        className="px-5 py-4 text-white"
        style={{ background: `linear-gradient(150deg, ${C.teal}, ${C.teal2})` }}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <ShieldCheck size={20} />
          <span className="text-lg font-extrabold">Posélien — Administration</span>
        </div>
      </div>

      <div className="mx-auto max-w-3xl p-4">
        <h1 className="mb-3 text-base font-bold" style={{ color: C.ink }}>
          Documents des poseurs
        </h1>

        {docs === null ? (
          <p className="text-sm" style={{ color: C.muted }}>
            Chargement…
          </p>
        ) : docs.length === 0 ? (
          <p
            className="rounded-2xl bg-white p-6 text-center text-sm"
            style={{ border: `1px dashed ${C.line}`, color: C.muted }}
          >
            Aucun document déposé pour l&apos;instant.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {docs.map((d) => {
              const st = STATUT_DOC[d.statut];
              return (
                <div
                  key={d.id}
                  className="rounded-2xl bg-white p-3.5"
                  style={{ border: `1px solid ${C.line}` }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold" style={{ color: C.ink }}>
                        {LABELS[d.type] ?? d.type}
                      </div>
                      <div className="text-xs" style={{ color: C.muted }}>
                        {d.profiles?.nom || "Poseur"} · {d.profiles?.email}
                      </div>
                    </div>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ background: st.bg, color: st.col }}
                    >
                      {st.txt}
                    </span>
                  </div>

                  {d.statut === "refuse" && d.motif_refus && (
                    <div className="mt-1 text-xs" style={{ color: C.red }}>
                      Motif : {d.motif_refus}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {d.fichier_path && (
                      <button
                        onClick={() => voir(d.fichier_path as string)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                        style={{ background: C.bg, color: C.ink }}
                      >
                        <FileText size={14} /> Voir le fichier
                      </button>
                    )}
                    <button
                      onClick={() => setStatut(d.id, "valide", null)}
                      disabled={busy === d.id}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                      style={{ background: C.green }}
                    >
                      <Check size={14} /> Valider
                    </button>
                    <button
                      onClick={() => {
                        const m = window.prompt("Motif du refus ?") || "";
                        if (m.trim()) setStatut(d.id, "refuse", m.trim());
                      }}
                      disabled={busy === d.id}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                      style={{ background: C.red }}
                    >
                      <X size={14} /> Refuser
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

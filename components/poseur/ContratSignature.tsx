"use client";

import { useEffect, useState } from "react";
import { FileCheck, ChevronDown, ChevronUp } from "lucide-react";
import { C } from "@/lib/theme";
import { createClient } from "@/lib/supabase/client";
import { SectionLabel } from "@/components/ui";
import { PrimaryButton } from "@/components/auth/fields";

const CONTRAT = `Contrat de sous-traitance Posélien (extrait).

1. Le poseur intervient en tant que sous-traitant indépendant pour réaliser les
prestations de pose confiées via la plateforme.
2. Le poseur s'engage à disposer des qualifications et assurances requises
(RGE, décennale, RC Pro) et à les tenir à jour.
3. Toute communication passe par la plateforme : l'échange de coordonnées ou le
contact hors plateforme est interdit.
4. Le poseur respecte les créneaux acceptés et informe l'entreprise de tout
imprévu via la messagerie prédéfinie.
5. La rémunération correspond au montant net indiqué pour chaque pose.`;

export default function ContratSignature() {
  const [userId, setUserId] = useState<string | null>(null);
  const [signe, setSigne] = useState(false);
  const [ouvert, setOuvert] = useState(false);
  const [accepte, setAccepte] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      const { data } = await supabase
        .from("profiles")
        .select("contrat_signe")
        .single();
      setSigne(!!data?.contrat_signe);
    })();
  }, []);

  async function signer() {
    if (!userId || !accepte) return;
    setBusy(true);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({
        contrat_signe: true,
        contrat_signe_at: new Date().toISOString(),
      })
      .eq("id", userId);
    setSigne(true);
    setBusy(false);
  }

  return (
    <div className="p-4 pt-0">
      <SectionLabel>CONTRAT DE SOUS-TRAITANCE</SectionLabel>

      <div
        className="rounded-2xl bg-white p-3.5"
        style={{ border: `1px solid ${signe ? C.green : C.line}` }}
      >
        {signe && (
          <div
            className="mb-3 flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: C.greenBg }}
          >
            <FileCheck size={18} color={C.green} />
            <span className="text-sm font-semibold" style={{ color: C.ink }}>
              Contrat signé
            </span>
          </div>
        )}

        <button
          onClick={() => setOuvert((v) => !v)}
          className="flex w-full items-center justify-between text-sm font-semibold"
          style={{ color: C.teal }}
        >
          Voir le contrat
          {ouvert ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {ouvert && (
          <pre
            className="mt-2 max-h-52 overflow-y-auto whitespace-pre-wrap rounded-lg p-3 text-xs"
            style={{ background: C.bg, color: C.ink, fontFamily: "inherit" }}
          >
            {CONTRAT}
          </pre>
        )}

        {!signe && (
          <>
            <label className="mt-3 flex items-start gap-2">
              <input
                type="checkbox"
                checked={accepte}
                onChange={(e) => setAccepte(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-sm" style={{ color: C.ink }}>
                J&apos;ai lu et j&apos;accepte le contrat de sous-traitance.
              </span>
            </label>

            <div className="mt-3">
              <PrimaryButton onClick={signer} disabled={!accepte || busy}>
                {busy ? "Enregistrement…" : "Signer le contrat"}
              </PrimaryButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

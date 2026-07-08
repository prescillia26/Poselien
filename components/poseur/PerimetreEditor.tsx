"use client";

import { useEffect, useState } from "react";
import { MapPin, Check } from "lucide-react";
import { C } from "@/lib/theme";
import { REGION_NAMES } from "@/lib/regions";
import { createClient } from "@/lib/supabase/client";
import { SectionLabel } from "@/components/ui";
import { PrimaryButton, OkNote } from "@/components/auth/fields";

export default function PerimetreEditor() {
  const [userId, setUserId] = useState<string | null>(null);
  const [toute, setToute] = useState(false);
  const [regions, setRegions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      const { data } = await supabase
        .from("profiles")
        .select("perimetre_toute_france, perimetre_regions")
        .single();
      if (data) {
        setToute(!!data.perimetre_toute_france);
        setRegions((data.perimetre_regions as string[]) ?? []);
      }
      setLoading(false);
    })();
  }, []);

  function toggleRegion(r: string) {
    setOk(false);
    setRegions((cur) =>
      cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r],
    );
  }

  async function save() {
    if (!userId) return;
    setSaving(true);
    setOk(false);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({
        perimetre_toute_france: toute,
        perimetre_regions: toute ? [] : regions,
      })
      .eq("id", userId);
    setSaving(false);
    setOk(true);
  }

  if (loading)
    return (
      <p className="p-4 text-sm" style={{ color: C.muted }}>
        Chargement…
      </p>
    );

  return (
    <div className="p-4">
      <SectionLabel>MON PÉRIMÈTRE DE TRAVAIL</SectionLabel>
      <p className="mb-3 text-sm" style={{ color: C.muted }}>
        Vous ne voyez que les poses situées dans votre périmètre.
      </p>

      {/* Toute la France */}
      <button
        type="button"
        onClick={() => {
          setToute((v) => !v);
          setOk(false);
        }}
        className="mb-3 flex w-full items-center justify-between rounded-xl bg-white px-3.5 py-3"
        style={{
          border: `1px solid ${toute ? C.teal : C.line}`,
        }}
      >
        <span
          className="flex items-center gap-2 text-sm font-semibold"
          style={{ color: C.ink }}
        >
          <MapPin size={16} color={C.teal} /> Toute la France
        </span>
        <span
          className="flex h-6 w-11 items-center rounded-full px-0.5 transition-all"
          style={{
            background: toute ? C.orange : "#CBD5D2",
            justifyContent: toute ? "flex-end" : "flex-start",
          }}
        >
          <span className="h-5 w-5 rounded-full bg-white" />
        </span>
      </button>

      {/* Régions (désactivées si toute la France) */}
      <div style={{ opacity: toute ? 0.4 : 1, pointerEvents: toute ? "none" : "auto" }}>
        <SectionLabel>OU CHOISIR DES RÉGIONS</SectionLabel>
        <div className="flex flex-col gap-2">
          {REGION_NAMES.map((r) => {
            const on = regions.includes(r);
            return (
              <button
                type="button"
                key={r}
                onClick={() => toggleRegion(r)}
                className="flex items-center justify-between rounded-xl bg-white px-3.5 py-2.5 text-left"
                style={{ border: `1px solid ${on ? C.teal : C.line}` }}
              >
                <span className="text-sm font-medium" style={{ color: C.ink }}>
                  {r}
                </span>
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-md"
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

      {/* Barre d'action épinglée en bas : toujours visible */}
      <div
        className="sticky bottom-0 z-10 -mx-4 -mb-4 mt-4 flex flex-col gap-2 border-t px-4 py-3 pb-4"
        style={{
          background: "#fff",
          borderColor: C.line,
          boxShadow: "0 -6px 16px rgba(11,61,58,0.06)",
        }}
      >
        {ok && <OkNote>Périmètre enregistré ✅</OkNote>}
        <PrimaryButton onClick={save} disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer mon périmètre"}
        </PrimaryButton>
      </div>
    </div>
  );
}

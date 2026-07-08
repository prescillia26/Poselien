"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { C } from "@/lib/theme";
import { createClient } from "@/lib/supabase/client";
import AuthScaffold from "./AuthScaffold";
import { Field, TextInput, PrimaryButton, ErrorNote } from "./fields";

export default function ReinitialiserForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On vérifie qu'une session (issue du lien de réinitialisation) est bien là.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError("Impossible de modifier le mot de passe (min. 6 caractères).");
      setLoading(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <AuthScaffold title="Nouveau mot de passe" subtitle="Presque terminé">
      {!ready ? (
        <div className="flex flex-col gap-4">
          <ErrorNote>
            Lien invalide ou expiré. Redemandez un lien de réinitialisation.
          </ErrorNote>
          <Link
            href="/mot-de-passe-oublie"
            className="text-center text-sm font-bold"
            style={{ color: C.teal }}
          >
            Redemander un lien
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="Nouveau mot de passe">
            <TextInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Au moins 6 caractères"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </Field>

          {error && <ErrorNote>{error}</ErrorNote>}

          <PrimaryButton type="submit" disabled={loading}>
            {loading ? "Enregistrement…" : "Enregistrer et continuer"}
          </PrimaryButton>
        </form>
      )}
    </AuthScaffold>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { C } from "@/lib/theme";
import { createClient } from "@/lib/supabase/client";
import AuthScaffold from "./AuthScaffold";
import { Field, TextInput, PrimaryButton, ErrorNote, OkNote } from "./fields";

export default function MotDePasseOublieForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reinitialiser`,
    });

    if (error) {
      setError("Envoi impossible. Vérifiez l'adresse et réessayez.");
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  }

  return (
    <AuthScaffold
      title="Mot de passe oublié"
      subtitle="On vous envoie un lien"
      back={{ href: "/connexion", label: "Retour à la connexion" }}
    >
      {sent ? (
        <OkNote>
          Si un compte existe pour cet e-mail, un lien de réinitialisation vient
          d&apos;être envoyé. Ouvrez-le pour choisir un nouveau mot de passe.
        </OkNote>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <p className="text-sm" style={{ color: C.muted }}>
            Entrez votre e-mail : vous recevrez un lien pour réinitialiser votre
            mot de passe.
          </p>
          <Field label="E-mail">
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.fr"
              autoComplete="email"
              required
            />
          </Field>

          {error && <ErrorNote>{error}</ErrorNote>}

          <PrimaryButton type="submit" disabled={loading}>
            {loading ? "Envoi…" : "Envoyer le lien"}
          </PrimaryButton>

          <p className="text-center text-sm" style={{ color: C.muted }}>
            <Link href="/connexion" className="font-bold" style={{ color: C.teal }}>
              Revenir à la connexion
            </Link>
          </p>
        </form>
      )}
    </AuthScaffold>
  );
}

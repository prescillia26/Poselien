"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { C } from "@/lib/theme";
import { createClient } from "@/lib/supabase/client";
import AuthScaffold from "./AuthScaffold";
import { Field, TextInput, PrimaryButton, ErrorNote } from "./fields";

export default function ConnexionForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(traduireErreur(error.message));
      setLoading(false);
      return;
    }

    // La redirection vers le bon espace est décidée côté serveur par "/".
    router.replace("/");
    router.refresh();
  }

  return (
    <AuthScaffold title="Connexion" subtitle="Content de vous revoir">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
        <Field label="Mot de passe">
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Votre mot de passe"
            autoComplete="current-password"
            required
          />
        </Field>

        <div className="text-right">
          <Link
            href="/mot-de-passe-oublie"
            className="text-sm font-semibold"
            style={{ color: C.teal }}
          >
            Mot de passe oublié ?
          </Link>
        </div>

        {error && <ErrorNote>{error}</ErrorNote>}

        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Connexion…" : "Se connecter"}
        </PrimaryButton>

        <p className="text-center text-sm" style={{ color: C.muted }}>
          Pas encore de compte ?{" "}
          <Link href="/bienvenue" className="font-bold" style={{ color: C.teal }}>
            Créer un compte
          </Link>
        </p>
      </form>
    </AuthScaffold>
  );
}

function traduireErreur(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou mot de passe incorrect.";
  if (m.includes("email not confirmed"))
    return "Confirmez d'abord votre e-mail (lien reçu par mail).";
  return "Connexion impossible. Réessayez.";
}

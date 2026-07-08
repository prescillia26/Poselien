"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Building2, HardHat } from "lucide-react";
import { C, Role } from "@/lib/theme";
import { createClient } from "@/lib/supabase/client";
import AuthScaffold from "./AuthScaffold";
import { Field, TextInput, PrimaryButton, ErrorNote, OkNote } from "./fields";

export default function InscriptionForm() {
  const router = useRouter();
  const params = useSearchParams();
  const role: Role = params.get("role") === "poseur" ? "poseur" : "entreprise";

  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  const roleLabel = role === "entreprise" ? "Entreprise" : "Poseur";
  const RoleIcon = role === "entreprise" ? Building2 : HardHat;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, nom },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(traduireErreur(error.message));
      setLoading(false);
      return;
    }

    // Si la confirmation e-mail est désactivée, la session existe déjà.
    if (data.session) {
      router.replace("/");
      router.refresh();
      return;
    }

    // Sinon, il faut confirmer via l'e-mail reçu.
    setCheckEmail(true);
    setLoading(false);
  }

  return (
    <AuthScaffold
      title="Créer un compte"
      subtitle="Quelques secondes suffisent"
      back={{ href: "/bienvenue", label: "Changer de profil" }}
    >
      <div
        className="mb-4 flex items-center gap-2 rounded-xl px-3 py-2.5"
        style={{ background: C.tealBg }}
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: role === "entreprise" ? C.teal : C.orange }}
        >
          <RoleIcon size={16} color="#fff" />
        </div>
        <div className="text-sm font-semibold" style={{ color: C.teal }}>
          Profil : {roleLabel}
        </div>
      </div>

      {checkEmail ? (
        <div className="flex flex-col gap-4">
          <OkNote>
            Compte créé. Vérifiez votre boîte mail et cliquez sur le lien de
            confirmation, puis connectez-vous.
          </OkNote>
          <Link
            href="/connexion"
            className="text-center text-sm font-bold"
            style={{ color: C.teal }}
          >
            Aller à la connexion
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="Nom">
            <TextInput
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder={
                role === "entreprise" ? "Nom de l'entreprise" : "Votre nom"
              }
              required
            />
          </Field>
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
              placeholder="Au moins 6 caractères"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </Field>

          {error && <ErrorNote>{error}</ErrorNote>}

          <PrimaryButton type="submit" disabled={loading}>
            {loading ? "Création…" : "Créer mon compte"}
          </PrimaryButton>

          <p className="text-center text-sm" style={{ color: C.muted }}>
            Déjà un compte ?{" "}
            <Link
              href="/connexion"
              className="font-bold"
              style={{ color: C.teal }}
            >
              Se connecter
            </Link>
          </p>
        </form>
      )}
    </AuthScaffold>
  );
}

function traduireErreur(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Un compte existe déjà avec cet e-mail.";
  if (m.includes("password")) return "Mot de passe trop court (min. 6).";
  if (m.includes("valid email") || m.includes("invalid"))
    return "Adresse e-mail invalide.";
  return "Une erreur est survenue. Réessayez.";
}

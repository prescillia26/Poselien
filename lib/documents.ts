// Documents obligatoires du poseur.

export const DOC_TYPES = [
  {
    key: "rge",
    label: "RGE (Reconnu Garant de l'Environnement)",
    freq: "",
  },
  {
    key: "urssaf",
    label: "Attestation de vigilance URSSAF",
    freq: "à renouveler tous les 3 mois",
  },
  {
    key: "fiscale",
    label: "Attestation de régularité fiscale",
    freq: "à renouveler tous les 3 mois",
  },
  { key: "kbis", label: "Extrait Kbis", freq: "une seule fois" },
  {
    key: "decennale",
    label: "Assurance décennale + RC Pro",
    freq: "",
  },
] as const;

export type DocStatut = "a_valider" | "valide" | "refuse";

export interface DocRow {
  id: string;
  poseur_id: string;
  type: string;
  statut: DocStatut;
  fichier_path: string | null;
  motif_refus: string | null;
  created_at: string;
}

export const STATUT_DOC: Record<
  DocStatut,
  { txt: string; bg: string; col: string }
> = {
  a_valider: { txt: "À valider", bg: "#FBF1DE", col: "#9A6B12" },
  valide: { txt: "Validé", bg: "#E7F4EC", col: "#1B8A4B" },
  refuse: { txt: "Refusé", bg: "#FBE9E7", col: "#C0392B" },
};

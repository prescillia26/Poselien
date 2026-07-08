// Types partagés pour les poses (étape 3).

export type PoseStatut = "ouverte" | "en_cours" | "terminee" | "annulee";

export interface Creneau {
  id: string;
  pose_id: string;
  jour: string; // AAAA-MM-JJ
  h_debut: string; // "08:00"
  h_fin: string; // "12:00"
}

export interface Pose {
  id: string;
  entreprise_id: string;
  prestations: string[];
  departement: string;
  region: string | null;
  ville: string;
  prix: number;
  aides: boolean;
  description: string | null;
  statut: PoseStatut;
  poseur_id: string | null;
  creneau_id: string | null;
  created_at: string;
  creneaux?: Creneau[];
}

// Fiche client (table séparée, protégée par RLS).
// Débloquée uniquement pour le poseur attribué après acceptation.
export interface PoseClient {
  pose_id: string;
  client_nom: string | null;
  client_adresse: string | null;
  client_tel: string | null;
  client_details: string | null;
  lieu_retrait: string | null;
  bon_commande_path: string | null;
}

export const STATUT_LABEL: Record<
  PoseStatut,
  { txt: string; bg: string; col: string }
> = {
  ouverte: { txt: "Ouverte", bg: "#FBF1DE", col: "#9A6B12" },
  en_cours: { txt: "En cours", bg: "#FDECE2", col: "#F26419" },
  terminee: { txt: "Terminée", bg: "#E7F4EC", col: "#1B8A4B" },
  annulee: { txt: "Annulée", bg: "#FBE9E7", col: "#C0392B" },
};

// Argent : l'entreprise paie +5 %, le poseur reçoit −5 %.
export const eur = (n: number) =>
  Math.round(n).toLocaleString("fr-FR") + " €";
export const totalEntreprise = (prix: number) => Math.round(prix * 1.05);
export const netPoseur = (prix: number) => Math.round(prix * 0.95);

// Format d'affichage d'un créneau.
export function creneauLabel(c: Creneau): string {
  const [y, m, d] = c.jour.split("-");
  return `${d}/${m}/${y.slice(2)} · ${c.h_debut}–${c.h_fin}`;
}

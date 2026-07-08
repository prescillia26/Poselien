// Données fictives (étape 1) — remplacées par une vraie base plus tard.

export type JobStatus = "ouverte" | "en_cours" | "terminee" | "refusee";

export interface Job {
  id: number;
  prestations: string[];
  dept: string;
  ville: string;
  prix: number;
  aides: boolean;
  description: string;
  installateur: string;
  status: JobStatus;
  poseur: string | null;
}

export const PRESTATIONS = [
  "PAC air/eau",
  "PAC air/air",
  "ITE",
  "ITI",
  "SSC",
  "ISO combles",
  "PV",
  "ISO sous-sol",
  "Ballon électrique",
  "Ballon thermodynamique",
];

export const seedJobs: Job[] = [
  {
    id: 1,
    prestations: ["PAC air/eau"],
    dept: "93 Seine-Saint-Denis",
    ville: "Aulnay-sous-Bois",
    prix: 2000,
    aides: true,
    description:
      "Dépose chaudière fioul + pose PAC air/eau 11 kW. Maison individuelle, accès garage.",
    installateur: "Énergies Confort",
    status: "ouverte",
    poseur: null,
  },
  {
    id: 2,
    prestations: ["ITE", "ISO combles", "PV"],
    dept: "94 Val-de-Marne",
    ville: "Créteil",
    prix: 5200,
    aides: true,
    description:
      "Chantier global : isolation extérieure façade + isolation combles + pose 8 panneaux PV. Pavillon 2 étages.",
    installateur: "Rénov Habitat",
    status: "ouverte",
    poseur: null,
  },
  {
    id: 3,
    prestations: ["PAC air/eau", "Ballon thermodynamique"],
    dept: "75 Paris",
    ville: "Paris 19e",
    prix: 2100,
    aides: true,
    description:
      "Pose PAC air/eau 8 kW en relève de chaudière gaz + ballon thermodynamique 200 L.",
    installateur: "Énergies Confort",
    status: "en_cours",
    poseur: "Karim B.",
  },
];

// Argent : l'entreprise paie +5 %, le poseur reçoit -5 %
export const eur = (n: number) =>
  Math.round(n).toLocaleString("fr-FR") + " €";
export const totalInstallateur = (prix: number) => Math.round(prix * 1.05);
export const netPoseur = (prix: number) => Math.round(prix * 0.95);

export function jobStatut(s: JobStatus) {
  return {
    ouverte: { txt: "Ouverte", bg: "#FBF1DE", col: "#9A6B12" },
    en_cours: { txt: "En cours", bg: "#FDECE2", col: "#F26419" },
    terminee: { txt: "Terminée", bg: "#E7F4EC", col: "#1B8A4B" },
    refusee: { txt: "Refusée", bg: "#FBE9E7", col: "#C0392B" },
  }[s];
}

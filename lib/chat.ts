// Chat fermé : listes de messages prédéfinis (doivent correspondre au seed SQL).

export const POSEUR_QUESTIONS = [
  "À quelle heure dois-je arriver ?",
  "Le matériel est-il fourni sur place ?",
  "La dépose de l'ancien équipement est-elle incluse ?",
  "Quel étage ? Y a-t-il un ascenseur ?",
  "Accès / stationnement pour le camion ?",
  "Le client sera-t-il présent le jour J ?",
  "Une contrainte particulière sur le chantier ?",
];

// Réponses toujours disponibles pour l'entreprise.
export const REPONSES_GENERIQUES = [
  "Oui",
  "Non",
  "Je vérifie et reviens vers vous",
];

// Réponses ciblées selon la question posée par le poseur.
export const REPONSES_PAR_QUESTION: Record<string, string[]> = {
  "À quelle heure dois-je arriver ?": ["8h00", "9h00", "10h00", "14h00"],
  "Le matériel est-il fourni sur place ?": [
    "Oui, fourni sur place",
    "Non, à retirer au point relais",
  ],
  "La dépose de l'ancien équipement est-elle incluse ?": [
    "Oui, dépose incluse",
    "Non, dépose non incluse",
  ],
  "Quel étage ? Y a-t-il un ascenseur ?": [
    "Rez-de-chaussée",
    "Avec ascenseur",
    "Sans ascenseur",
  ],
  "Accès / stationnement pour le camion ?": [
    "Stationnement facile",
    "Stationnement difficile",
    "Autorisation à prévoir",
  ],
  "Le client sera-t-il présent le jour J ?": [
    "Oui, présent",
    "Non, clés au gardien",
    "À convenir",
  ],
  "Une contrainte particulière sur le chantier ?": [
    "Aucune contrainte",
    "Voir détails du chantier",
  ],
};

// Réponses proposées à l'entreprise selon la dernière question du poseur.
export function reponsesPour(question: string | null): string[] {
  const ciblees = question ? REPONSES_PAR_QUESTION[question] ?? [] : [];
  return [...ciblees, ...REPONSES_GENERIQUES];
}

// Toutes les réponses possibles (utile pour la cohérence avec le seed SQL).
export const TOUTES_REPONSES_ENTREPRISE = Array.from(
  new Set([
    ...REPONSES_GENERIQUES,
    ...Object.values(REPONSES_PAR_QUESTION).flat(),
  ]),
);

export interface Message {
  id: string;
  pose_id: string;
  sender_id: string;
  texte: string;
  created_at: string;
}

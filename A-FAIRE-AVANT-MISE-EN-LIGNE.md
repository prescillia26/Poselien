# À faire avant la mise en ligne

Liste des points laissés de côté pendant le développement, à régler **avant**
d'ouvrir l'application à de vrais utilisateurs. On la complète au fil des étapes.

## Comptes & sécurité (étape 2)

- [ ] **Réactiver la confirmation par e-mail.** Elle a été désactivée pour
      faciliter les tests. Supabase → Authentication → Sign In / Providers →
      Email → recocher **Confirm email** → Save. (Aucun changement de code : le
      message « Vérifiez votre boîte mail » et la page `/auth/callback` sont déjà
      prêts.)
- [ ] **Confirmation d'e-mail Supabase (SMTP).** La confirmation d'e-mail à
      l'inscription est désactivée pour les tests. Pour la production, la
      réactiver et brancher un service SMTP dans Supabase (les e-mails de
      confirmation / mot de passe oublié passent par Supabase, pas par Posélien).
- [ ] **Mettre à jour les URLs quand il y aura un vrai domaine.** Aujourd'hui
      c'est `http://localhost:3000`. Au déploiement, remplacer par le domaine
      réel dans Supabase → Authentication → URL Configuration (Site URL +
      Redirect URLs).
- [ ] **Reporter les variables d'environnement chez l'hébergeur.** Le fichier
      `.env.local` reste sur votre ordinateur (non versionné). Il faudra recréer
      toutes les clés (Supabase + VAPID) dans les réglages de l'hébergement
      (Vercel, etc.).

## Notifications push

- [ ] **Mettre l'app en ligne (https) pour le push sur iPhone.** Le push mobile
      exige une adresse https et l'app ajoutée à l'écran d'accueil. Sur
      ordinateur, le push marche déjà en local.
- [ ] **(Optionnel) Rebrancher l'email plus tard** si besoin d'un canal de
      secours — avec un compte/domaine dédié à Posélien (ne pas réutiliser
      celui d'un autre projet).

## Documents & vérification

- [ ] **Validation manuelle des documents.** Pour l'instant les documents sont
      validés automatiquement au dépôt (mode provisoire). Quand le processus de
      vérification sera décidé, repasser en validation par l'admin (script
      `supabase/schema_etape8_manuel.sql`).
- [ ] **Délais de validité des documents.** URSSAF et attestation fiscale sont à
      renouveler tous les 3 mois. Aujourd'hui, un document validé le reste sans
      limite. À ajouter : date d'expiration + redemande de renouvellement au
      poseur, et blocage de l'acceptation si un document est périmé.

## Contenu

- [ ] **Remplacer les données d'exemple par de vraies données.** Les espaces
      entreprise et poseur affichent encore des poses fictives (`lib/data.ts`) —
      ce sera l'objet des étapes suivantes.

## Général (à garder en tête plus tard)

- [ ] Garder Next.js et les dépendances à jour (correctifs de sécurité).
- [ ] Vérifier les sauvegardes de la base de données Supabase.

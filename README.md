# Posélien

Application web (Next.js) : mise en relation entreprises RGE ↔ poseurs certifiés.

- **Étape 1** — mise en place + design (accueil, coquilles entreprise/poseur, PWA).
- **Étape 2** — comptes : inscription, connexion, mot de passe oublié,
  redirection et protection par rôle (Supabase).
- **Étape 3** — publication réelle des poses : formulaire entreprise, fil des
  poses filtré par périmètre du poseur, fiche client protégée (RLS).
- **Étape 4** — acceptation d'une pose : détail, Accepter/Refuser, acceptation
  atomique (un seul poseur), déblocage de la fiche client, « Mes chantiers ».
- **Notifications** — onglet Notifs dans l'app + **notifications push** (Web
  Push, gratuit) : poseurs du périmètre prévenus à la publication, entreprise
  prévenue à l'acceptation. (L'email/Resend a été retiré.)
- **Étape 5** — chat fermé : messages **prédéfinis uniquement** entre
  l'entreprise et le poseur, après acceptation, privé (RLS), en temps réel.
- **Étape 6** — documents + contrat + admin : le poseur dépose ses justificatifs
  et signe le contrat ; un espace admin valide/refuse ; l'acceptation est bloquée
  tant que le dossier n'est pas complet.

---

## Lancer en local

Depuis le dossier `poselien/` :

```bash
npm install      # à refaire : de nouvelles dépendances (Supabase) ont été ajoutées
npm run dev
```

Puis ouvrez **http://localhost:3000**.

> Prérequis : Node.js 18 ou plus (`node -v` pour vérifier).
> Sans configuration Supabase (ci-dessous), les pages s'affichent mais la
> création de compte ne fonctionnera pas.

---

## Configurer Supabase (étape 2) — une seule fois

### 1. Créer le projet

1. Allez sur **https://supabase.com** → connectez-vous → **New project**.
2. Donnez un nom (ex. `poselien`), un mot de passe de base de données (gardez-le),
   choisissez une région proche (ex. Paris) → **Create new project**.
3. Attendez ~1 minute que le projet soit prêt.

### 2. Récupérer les clés et les coller

1. Dans le projet : menu **Project Settings** (roue crantée) → **API**.
2. Copiez deux valeurs :
   - **Project URL**
   - la clé publique : selon l'écran elle s'appelle **anon public** ou
     **Publishable key**.
3. Dans le dossier `poselien/`, dupliquez `.env.local.example` en **`.env.local`**
   et collez vos valeurs :

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=collez_la_cle_ici
   ```

   > `.env.local` n'est pas versionné (git) : vos clés restent privées.

### 3. Créer la table `profiles` (+ sécurité)

1. Dans Supabase : menu **SQL Editor** → **New query**.
2. Ouvrez le fichier **`supabase/schema.sql`** de ce projet, copiez tout,
   collez dans l'éditeur, puis **Run**.
3. Cela crée la table `profiles` (`id`, `role`, `email`, `nom`), active la
   **sécurité RLS**, et ajoute un déclencheur qui crée automatiquement le profil
   à chaque inscription.

### 4. Réglages d'authentification

Menu **Authentication** → **URL Configuration** :

- **Site URL** : `http://localhost:3000`
- **Redirect URLs** : ajoutez `http://localhost:3000/**`

**Pour tester facilement** (recommandé en développement) : menu
**Authentication → Sign In / Providers → Email**, puis **désactivez
« Confirm email »**. Ainsi la création de compte connecte immédiatement, sans
passer par un e-mail de confirmation. (Si vous le laissez activé, il faut cliquer
le lien reçu par mail avant de pouvoir se connecter.)

Relancez ensuite `npm run dev` (pour recharger `.env.local`).

---

## Comment tester (étape 2)

1. **Compte entreprise** : ouvrez http://localhost:3000 → « Je suis une
   entreprise » → créez un compte (nom, e-mail, mot de passe ≥ 6). Vous devez
   arriver dans l'**espace entreprise** (onglets Publier · Mes poses · Compte).
2. **Déconnexion** : bouton **Déconnexion** en haut à droite → retour à l'accueil.
3. **Compte poseur** : « Je suis un poseur » → créez un 2ᵉ compte (autre e-mail).
   Vous devez arriver dans l'**espace poseur** (Poses · Notifs · Chantiers ·
   Espace).
4. **Bon espace selon le rôle** : reconnectez-vous avec l'un ou l'autre compte
   (page **Connexion**) → vous êtes redirigé vers le bon espace automatiquement.
5. **Protection par rôle (le point important)** : connecté en **poseur**, tapez
   dans la barre d'adresse `http://localhost:3000/entreprise`. Vous devez être
   **renvoyé vers `/poseur`** — impossible d'ouvrir l'espace de l'autre rôle,
   même en tapant l'URL. (La vérification est faite côté serveur.)
6. **Mot de passe oublié** : page Connexion → « Mot de passe oublié ? » → e-mail →
   lien reçu → choisir un nouveau mot de passe. *(Nécessite « Confirm email »
   actif ou l'envoi d'e-mails configuré ; en local le lien arrive dans la boîte
   mail réelle du compte.)*

Vérifier en base : Supabase → **Table Editor** → table `profiles` : une ligne par
compte, avec le bon `role`.

---

## Étape 3 — publier des poses

### 1. Mettre à jour la base de données

Dans Supabase : **SQL Editor → New query**, collez tout le contenu de
**`supabase/schema_etape3.sql`**, puis **Run**. Cela crée les tables `poses`,
`creneaux`, `pose_client` (fiche client privée), la table de référence des
départements, les colonnes de périmètre sur `profiles`, la sécurité **RLS**, et
le bucket de stockage des bons de commande.

> Message attendu : « Success ». Si une remarque « Stockage non configuré… »
> apparaît, ce n'est pas bloquant : créez au besoin un bucket privé nommé
> `bons-commande` dans **Storage**.

Relancez `npm run dev` si l'app tournait déjà.

### 2. Comment tester

**a) Côté entreprise — publier**
Connectez-vous avec un compte entreprise → onglet **Publier**. Choisissez
**2 prestations** (ex. PAC air/eau + ISO combles), un **département** (ex.
« 93 Seine-Saint-Denis »), une ville, **2 créneaux** (date + heures), un prix
(ex. 2000). Vérifiez l'affichage automatique « débité +5 % / poseur reçoit
−5 % ». Remplissez la fiche client (facultatif) et joignez un bon de commande si
vous voulez, puis **Publier**. Retrouvez la pose dans l'onglet **Mes poses**
avec le statut « Ouverte ».

**b) Côté poseur — périmètre qui inclut le 93**
Déconnectez-vous, connectez-vous avec un compte **poseur** → onglet **Espace** →
activez « Toute la France » **ou** cochez la région **Île-de-France** (le 93 en
fait partie) → **Enregistrer**. Allez sur l'onglet **Poses** : la pose publiée
apparaît, avec le montant **net (−5 %)** et le badge aides — **mais sans la
fiche client ni le bon de commande** (ils n'existent pas dans les données
envoyées au poseur).

**c) Côté poseur — périmètre qui n'inclut PAS le 93**
Avec un autre compte poseur (ou en changeant le périmètre), sélectionnez une
région qui **n'inclut pas** le 93 (ex. Bretagne) → Enregistrer → onglet
**Poses** : la pose du 93 **n'apparaît pas**.

> La preuve de sécurité : le filtrage par périmètre et le masquage de la fiche
> client sont imposés **côté base de données** (RLS), pas seulement à l'écran.
> Un poseur ne peut donc pas récupérer la fiche client d'une pose ouverte, même
> en contournant l'interface.

## Étape 4 — accepter une pose

### 1. Mettre à jour la base de données

Dans Supabase : **SQL Editor → New query**, collez tout le contenu de
**`supabase/schema_etape4.sql`**, puis **Run**. Cela ajoute : le créneau choisi
sur la pose, la table des refus, l'exclusion des poses refusées du fil, la
fonction d'**acceptation atomique** `accepter_pose`, le déplacement du lieu de
retrait vers la fiche client privée, et l'accès du poseur attribué au bon de
commande.

> Important : le lieu de retrait devient une information privée (débloquée à
> l'acceptation), au même titre que la fiche client.

Relancez `npm run dev` si l'app tournait déjà.

### 2. Comment tester

**a) Accepter une pose → « Mes chantiers »**
Connecté en poseur (périmètre couvrant le département de la pose), onglet
**Poses** → cliquez une pose : l'écran de détail s'ouvre (prestations,
description, créneaux, montant net). Choisissez un créneau → **Accepter**. La
pose bascule dans l'onglet **Chantiers**, où la **fiche client** (nom, adresse,
téléphone), le **lieu de retrait** et le **bon de commande** sont désormais
visibles.

**b) Elle disparaît pour les autres poseurs**
Avec un 2ᵉ compte poseur dont le périmètre couvre aussi ce département : l'onglet
**Poses** ne montre plus la pose acceptée (elle n'est plus « ouverte »).

**c) Impossible d'accepter une pose déjà prise**
Pour le simuler : ouvrez la même pose dans deux navigateurs (deux comptes
poseurs) **avant** que l'un n'accepte. Le premier qui valide réussit ; le second,
en cliquant Accepter, reçoit « Cette pose vient d'être prise par un autre
poseur ». Le blocage est garanti par la base de données (mise à jour
conditionnelle `where statut = 'ouverte'`), pas seulement par l'affichage.

**Refuser** : depuis le détail, « Refuser » retire la pose de VOTRE fil
uniquement — elle reste visible pour les autres poseurs.

> Sécurité : la fiche client, le lieu de retrait et le bon de commande ne sont
> lisibles que par le poseur attribué (politiques RLS + fonction serveur). Un
> autre poseur ne peut pas y accéder, même en contournant l'interface.

## Notifications (in-app + push)

Deux canaux, **aucun email** (Resend a été retiré) :

- **In-app** : onglet **Notifs** du poseur, nouvelles mises en évidence.
- **Push** : notification système sur l'appareil (même app fermée), gratuite,
  via Web Push. Chaque utilisateur active le push depuis son espace.

### 1. Base de données

Dans Supabase → **SQL Editor → New query**, exécutez (s'ils ne l'ont pas déjà été) :

- `supabase/schema_etape5.sql` — table `notifications` (in-app) + RLS.
- `supabase/schema_etape6.sql` — table `push_subscriptions` (abonnements push) + RLS.

### 2. Clés dans `.env.local`

Serveur (jamais `NEXT_PUBLIC`) :

- `SUPABASE_SERVICE_ROLE_KEY` — clé **secrète** Supabase (API → Secret keys).
- `VAPID_PRIVATE_KEY` et `VAPID_SUBJECT` — clés du push.

Public (côté navigateur) :

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — clé publique du push.

Les clés VAPID se génèrent une fois avec `npx web-push generate-vapid-keys`
(déjà fait ; elles sont dans votre `.env.local`). Après toute modification,
**relancez** `npm run dev`.

### 3. Comment tester (sur ordinateur, Chrome)

1. **Activer le push.** Connecté en **poseur** → onglet **Espace** → réglez le
   périmètre (ex. Île-de-France), puis **Activer** les notifications push →
   autorisez dans la fenêtre du navigateur (« Notifications activées »).
2. **Publier.** Dans une autre fenêtre/profil, connecté en **entreprise**,
   publiez une pose dans le « 93 ». Le poseur reçoit une **notification système**
   « Nouvelle pose près de vous », **et** la voit dans l'onglet Notifs.
3. **Hors périmètre.** Un poseur avec un périmètre différent ne reçoit rien.
4. **Acceptation.** Le poseur accepte → l'entreprise (qui a activé le push depuis
   l'onglet **Compte**) reçoit « Votre pose a été acceptée ».

> Sur **iPhone**, le push n'est possible que si l'app est **installée sur
> l'écran d'accueil** (iOS 16.4+) et servie en **https** — donc après mise en
> ligne. Sur ordinateur (Chrome/Edge) et Android, il marche même sur `localhost`.

> Sécurité : chaque notification et chaque abonnement push sont liés à un
> `user_id` (RLS). Le ciblage par périmètre et les envois sont faits côté serveur
> avec la clé secrète — un poseur hors périmètre ne reçoit jamais la notification.

## Étape 5 — chat fermé

### 1. Base de données

Dans Supabase → **SQL Editor → New query**, collez **`supabase/schema_etape7.sql`**,
puis **Run**. Cela crée la table `messages`, la table `messages_predefinis`
(questions du poseur + réponses de l'entreprise), la sécurité RLS, et active le
temps réel.

### 2. Comment tester

**a) Ouvrir le chat des deux côtés** (uniquement après acceptation)
Côté **entreprise** : onglet **Mes poses** → sur une pose « En cours », bouton
**Discuter avec le poseur**. Côté **poseur** : onglet **Chantiers** → bouton
**Discuter avec l'entreprise**. Le chat s'ouvre sur la même conversation.

**b) Messages prédéfinis uniquement**
Il n'y a **aucun champ de texte libre** : le poseur choisit parmi des questions,
l'entreprise parmi des réponses rapides. Un bandeau rappelle la règle (« Messages
prédéfinis uniquement… »).

**c) Aller-retour**
Envoyez un message d'un côté : il apparaît de l'autre **en temps réel** (ou au
rafraîchissement). Les deux comptes voient la même conversation.

**d) Confidentialité**
Un autre poseur (non attribué à la pose) ne voit pas ce chat, même en essayant :
la lecture et l'écriture sont restreintes à l'entreprise et au poseur de la pose
par la RLS. De plus, seuls les textes prédéfinis sont acceptés à l'écriture,
vérifié côté base de données.

## Étape 6 — documents, contrat, admin

### 1. Base de données

Dans Supabase → **SQL Editor → New query**, collez **`supabase/schema_etape8.sql`**,
puis **Run** (table `documents` + RLS, colonnes `is_admin`/`contrat_signe`,
bucket Storage `documents`, blocage de l'acceptation).

### 2. Se désigner comme administrateur

Toujours dans SQL Editor, exécutez (en remplaçant par **votre e-mail de compte**) :

```sql
update public.profiles set is_admin = true where email = 'votre@email.fr';
```

Vous pourrez alors ouvrir l'espace admin sur **http://localhost:3000/admin**.
(Un compte non-admin qui tente d'y aller est redirigé — c'est voulu.)

### 3. Comment tester

**a) Déposer un document (poseur)**
Compte poseur → onglet **Espace** → section **Mes documents** → **Déposer** un
fichier (PDF/image) pour un type. Il apparaît « À valider ».

**b) Valider (admin)**
Ouvrez **/admin** avec votre compte admin → le document est listé → **Voir le
fichier**, puis **Valider** (ou **Refuser** avec un motif). Rechargez l'espace
poseur : le statut passe à « Validé » (ou « Refusé » avec le motif).

**c) Blocage de l'acceptation**
Tant que les 5 documents ne sont pas **validés** et le **contrat signé**, ouvrir
une pose → le bouton **Accepter** est grisé, avec un message renvoyant à
l'Espace. Une fois tout validé + contrat signé, l'acceptation fonctionne. (Le
blocage est aussi imposé côté serveur dans `accepter_pose`.)

**d) Confidentialité**
Un poseur ne voit que ses propres documents. Le stockage des fichiers est privé :
seuls le poseur concerné et l'admin peuvent les ouvrir (RLS + Storage).

## Structure

```
app/
  page.tsx                 redirige selon connexion + rôle
  bienvenue/               écran d'accueil (choix du profil)
  inscription/             création de compte (rôle via l'URL)
  connexion/               connexion
  mot-de-passe-oublie/     demande de lien de réinitialisation
  reinitialiser/           choix du nouveau mot de passe
  auth/callback/           reçoit les liens e-mail (confirmation / reset)
  auth/signout/            déconnexion
  entreprise/              espace entreprise (protégé, rôle vérifié serveur)
  poseur/                  espace poseur (protégé, rôle vérifié serveur)
components/                UI (Welcome, AppShell, TabBar, formulaires auth…)
lib/
  supabase/                clients Supabase (navigateur, serveur, middleware)
  auth.ts                  getUserAndProfile() + requireRole()
  theme.ts, data.ts        palette + données fictives
middleware.ts              rafraîchit la session à chaque requête
supabase/schema.sql        table profiles + RLS + trigger
```

## Volontairement laissé pour plus tard

Poses réelles, base de données métier, paiement, notifications. Les écrans des
espaces utilisent encore des données d'exemple (`lib/data.ts`).

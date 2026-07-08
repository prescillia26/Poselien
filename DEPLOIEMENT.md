# Mettre Posélien en ligne (gratuit, avec Vercel)

Pas besoin de GitHub. On utilise l'outil en ligne de commande de Vercel.

## 1. Créer un compte Vercel

Allez sur https://vercel.com → **Sign Up** → créez un compte (email ou Google).
C'est gratuit, aucune carte bancaire.

## 2. Installer l'outil Vercel (une fois)

Dans le Terminal :

```bash
npm install -g vercel
```

## 3. Se connecter

```bash
vercel login
```

Choisissez votre méthode (email…) et validez le lien reçu / la fenêtre qui
s'ouvre.

## 4. Premier déploiement

Placez-vous dans le dossier du projet puis lancez `vercel` :

```bash
cd ~/Claude/Projects/"adper poseur"/poselien
vercel
```

Répondez aux questions en appuyant simplement sur **Entrée** à chaque fois
(les valeurs par défaut conviennent) :
- Set up and deploy? **Y**
- Which scope? (votre compte)
- Link to existing project? **N**
- Project name? (Entrée)
- In which directory is your code located? **./** (Entrée)

À la fin, Vercel affiche une adresse du type `https://poselien-xxxx.vercel.app`.
(À ce stade, l'app se charge mais les données ne marchent pas encore : il manque
les clés — étape suivante.)

## 5. Ajouter les clés (variables d'environnement)

Sur https://vercel.com → votre projet **poselien** → **Settings** →
**Environment Variables**. Ajoutez ces 6 variables (nom + valeur). Les **valeurs**
sont dans votre fichier `.env.local` (ouvrez-le avec `open -e ~/Claude/Projects/"adper poseur"/poselien/.env.local`).

| Nom | Où trouver la valeur |
|-----|----------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | .env.local |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | .env.local |
| `SUPABASE_SERVICE_ROLE_KEY` | .env.local |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | .env.local |
| `VAPID_PRIVATE_KEY` | .env.local |
| `VAPID_SUBJECT` | .env.local |

Pour chacune : collez le nom, collez la valeur, laissez les 3 environnements
cochés (Production/Preview/Development), **Save**.

## 6. Redéployer avec les clés

```bash
cd ~/Claude/Projects/"adper poseur"/poselien
vercel --prod
```

Notez l'adresse finale (ex. `https://poselien.vercel.app`).

## 7. Prévenir Supabase de la nouvelle adresse

Supabase → **Authentication** → **URL Configuration** :
- **Site URL** : votre adresse Vercel (ex. `https://poselien.vercel.app`)
- **Redirect URLs** : ajoutez `https://poselien.vercel.app/**`

## 8. Tester

Ouvrez l'adresse Vercel sur votre ordinateur, puis sur votre téléphone. Sur
iPhone : ouvrez l'adresse dans Safari → bouton Partager → **Sur l'écran
d'accueil** → ouvrez l'app installée → activez les notifications depuis l'Espace.

## Mises à jour futures

À chaque changement du code, il suffit de relancer :

```bash
vercel --prod
```

# Briquothèque

Catalogue de **tous les sets et minifigs** de briques (anciens, actuels, retirés), avec des comptes utilisateurs pour gérer sa **collection** et sa **wishlist**.

> LEGO® est une marque du groupe LEGO, qui ne parraine ni n'approuve ce site. Données : Rebrickable, Brickset.

## Stack

- [AdonisJS 7](https://docs.adonisjs.com) (kit « react ») : Lucid (ORM), Auth (sessions), Shield (CSRF), VineJS (validation), Limiter (rate limiting)
- **React 19 + Inertia**, avec rendu côté serveur (SSR) pour le référencement et le fonctionnement sans JavaScript
- Tuyau : URL des routes typées côté React (`urlFor('search')`, `<Link route="home">`)
- MySQL 8+ / MariaDB (local et production)
- CSS natif (variables CSS, grille de 8 px), Vite
- Tests : Japa

## Prérequis

- **Node.js ≥ 24** (exigé par AdonisJS 7). Sur o2switch, choisir Node 24 dans « Setup Node.js App ».
- **MySQL** en local (macOS : `brew install mysql && brew services start mysql`)
- npm

## Installation

```bash
git clone <url-du-depot> briquotheque
cd briquotheque
npm install
cp .env.example .env
node ace generate:key          # remplit APP_KEY
```

Créer les bases et l'utilisateur MySQL (adapter le mot de passe, puis le reporter dans `.env`) :

```sql
CREATE DATABASE briquotheque CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE briquotheque_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'briquotheque'@'localhost' IDENTIFIED BY 'un-mot-de-passe-solide';
GRANT ALL PRIVILEGES ON briquotheque.* TO 'briquotheque'@'localhost';
GRANT ALL PRIVILEGES ON briquotheque_test.* TO 'briquotheque'@'localhost';
```

Puis :

```bash
node ace migration:run
npm run dev                    # http://localhost:3333
```

## Variables d'environnement

Toutes les clés sont dans `.env` (jamais commité). `.env.example` liste les variables attendues :

| Variable                                                      | Rôle                                                                                         |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE` | Connexion MySQL                                                                              |
| `LIMITER_STORE`                                               | `database` (recommandé) ou `memory`                                                          |
| `BRICKSET_API_KEY`                                            | Clé API Brickset v3 ([demande gratuite](https://brickset.com/tools/webservices/requestkey/)) |
| `BRICKLINK_*`                                                 | Identifiants OAuth BrickLink (optionnels)                                                    |

`.env.test` surcharge quelques valeurs pour les tests (base `briquotheque_test`, sessions et limiter en mémoire).

## Commandes

| Commande                                        | Description                                        |
| ----------------------------------------------- | -------------------------------------------------- |
| `npm run dev`                                   | Serveur de développement avec rechargement à chaud |
| `npm test`                                      | Tests Japa (migre la base de test automatiquement) |
| `npm run lint` / `npm run typecheck`            | Qualité du code                                    |
| `npm run format`                                | Formatage Prettier                                 |
| `npm run build`                                 | Build de production dans `build/`                  |
| `node ace migration:run` / `migration:rollback` | Migrations                                         |

> ⚠️ Lucid régénère `database/schema.ts` après chaque migration. Sur la base de test, toujours ajouter `--no-schema-generate`, sinon le fichier est vidé.

## Structure

```
app/                   contrôleurs, modèles, middleware, transformers, validateurs
config/                configuration AdonisJS (inertia.ts : SSR activé)
database/migrations    migrations Lucid
inertia/               front React
  app.tsx, ssr.tsx     points d'entrée navigateur et SSR
  layouts/app.tsx      layout : lien d'évitement, header, footer avec mention légale
  components/          logo, formulaire de recherche, SEO (<title>, description)…
  pages/               une page Inertia par fichier
  css/app.css          feuille de style (variables, boutons « brique », tenons)
  fonts/               Nunito 700/800 en woff2 (licence SIL OFL)
public/                fichiers statiques (favicons, site.webmanifest, images/)
resources/views/       inertia_layout.edge : squelette HTML (<html lang="fr">, favicons)
start/                 routes, kernel, env, limiter
tests/                 tests Japa
tmp/                   fichiers temporaires (CSV Rebrickable téléchargés, etc.)
```

Le logo provisoire est dans `inertia/components/logo.tsx` : c'est le seul fichier à modifier pour le remplacer.

## Disque externe exFAT (macOS)

macOS crée des fichiers `._*` sur les volumes exFAT. Ils sont ignorés par Git, ESLint et Prettier, et supprimés automatiquement avant `npm run typecheck` et `npm run build` (script `npm run clean:appledouble`). Avant un envoi manuel :

```bash
dot_clean -m .
# node_modules exclu : ses exécutables doivent garder leur droit d'exécution
find . -path ./node_modules -prune -o -type d -exec chmod 755 {} \;
find . -path ./node_modules -prune -o -type f -exec chmod 644 {} \;
```

## Déploiement

Le guide de déploiement o2switch sera complété à l'étape 11.

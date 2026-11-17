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

## Enrichissement Brickset (prix, disponibilité, description)

```bash
node ace import:brickset                  # import complet, année par année
node ace import:brickset --resume         # reprend un import arrêté (quota, erreur) ; ne fait rien sinon
node ace import:brickset --set=75192-1    # un seul set (debug)
node ace import:brickset --refresh        # ignore le cache des réponses
```

- Clé gratuite à demander sur https://brickset.com/tools/webservices/requestkey/, à mettre dans `.env` (`BRICKSET_API_KEY`).
- Brickset limite les appels `getSets` par jour (`BRICKSET_DAILY_LIMIT`, 100 par défaut). La commande vérifie l'usage du jour avec `getKeyUsageStats`, garde 2 appels de marge, puis **s'arrête proprement** en enregistrant où elle en est (`import_runs.cursor`) : il suffit de relancer le lendemain avec `--resume`.
- Les sets sont demandés **par année** (pages de 500, de l'année prochaine vers la plus ancienne) : une centaine d'appels pour tout le catalogue, contre des milliers par thème × année. Le rapprochement se fait par numéro + variante (`75192-1`, ou `71048-0` pour les sachets surprise).
- Les réponses sont mises en cache 20 h dans `tmp/brickset/` : une relance le même jour ne consomme pas de quota.
- Colonnes remplies : `rrp_eur` (LEGO.com Allemagne), `rrp_usd`, `rrp_gbp`, `date_first_available` (`launchDate`), `date_last_available` (`exitDate`), `subtheme`, `description` (HTML nettoyé ; texte anglais de LEGO.com), `brickset_id`, `brickset_synced_at`.
- **Règle de disponibilité** (`availability_status`, recalculée pour tous les sets) :
  1. date de fin connue : aujourd'hui ou plus tard → `available`, passée → `retired` ;
  2. sans date de fin, sorti il y a plus de 3 ans (date de sortie, sinon 1er janvier de l'année) → `retired` ;
  3. sans date de fin, déjà sorti → `available` ;
  4. sinon (pas encore sorti, aucune donnée) → `unknown`.
- Sans description Brickset, l'affichage génère un texte de remplacement (`app/services/set_description.ts`), jamais enregistré en base.

## Langues (français / anglais)

- Tout le site existe en français et en anglais. La langue vient du cookie `locale` (posé par le sélecteur FR/EN du header, lien `/langue/fr` ou `/langue/en`), sinon de la langue du navigateur si elle est anglaise, sinon le français.
- Les textes de l'interface sont dans `inertia/i18n/fr.ts` (référence) et `inertia/i18n/en.ts` (TypeScript refuse une clé manquante). Dans un composant : `const { t, tc, formatPrice, formatDate } = useI18n()`.
- Les noms des sets, minifigs et thèmes restent ceux de Rebrickable (anglais).

## Traduction des descriptions (Claude)

Brickset ne fournit les descriptions qu'en anglais. La commande les traduit en français avec Claude Opus 5.5 via l'API Batches (-50 %) et les stocke dans `sets.description_fr`. Les visiteurs francophones lisent la traduction (l'original reste accessible), les anglophones l'original.

```bash
node ace translate:descriptions --dry-run      # nombre de descriptions et coût estimé, n'envoie rien
node ace translate:descriptions --set=75192-1  # un seul set, tout de suite (pour juger la qualité)
node ace translate:descriptions                # envoie un lot (confirmation demandée)
node ace translate:descriptions                # plus tard : enregistre les traductions du lot terminé
node ace translate:descriptions --yes --wait   # sans confirmation, attend la fin (cron)
```

- Clé API dans `.env` : `ANTHROPIC_API_KEY` (https://platform.claude.com/settings/keys).
- Seules les descriptions nouvelles ou modifiées depuis leur dernière traduction sont envoyées (empreinte SHA-1 du texte anglais dans `description_fr_source_hash`).
- Chaque lot est suivi dans `import_runs` (source `translation`).
- Coût du stock initial (9 573 descriptions) : estimé entre 45 et 85 $ ; ensuite quelques centimes par import hebdomadaire.

## Base de données

| Table                        | Modèle                   | Contenu                                                                  |
| ---------------------------- | ------------------------ | ------------------------------------------------------------------------ |
| `themes`                     | `Theme`                  | Thèmes Rebrickable (id Rebrickable, imbriqués via `parent_id`)           |
| `sets`                       | `BrickSet`               | Sets (nommé ainsi pour ne pas masquer le `Set` natif de JavaScript)      |
| `minifigs`                   | `Minifig`                | Minifigs, avec thème principal et année de première apparition           |
| `set_minifigs`               | —                        | Table pivot sets ↔ minifigs (`quantity`), via les relations `manyToMany` |
| `users`                      | `User`                   | Comptes (email, pseudo, jeton de partage de wishlist)                    |
| `user_sets`, `user_minifigs` | `UserSet`, `UserMinifig` | Collection (`owned`) et wishlist (`wanted`)                              |
| `import_runs`                | `ImportRun`              | Journal des imports, avec curseur JSON pour la reprise                   |

Les classes de colonnes sont générées dans `database/schema.ts` (ne pas modifier à la main). Les règles de génération (prix en `number`, enums typés, JSON) sont dans `database/schema_rules.ts`.

## Pages publiques

| URL                                                                                                                                                                                             | Contenu                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                                                                                                                                                                             | Recherche, thèmes populaires, derniers sets sortis                                                                                                                                                                                                                                                                                                                                                         |
| `/sets`                                                                                                                                                                                         | Catalogue paginé (48 par page) avec recherche et filtres dans l'URL : `q`, `theme` (sous-thèmes inclus), `year_min`/`year_max`, `parts_min`/`parts_max`, `price_min`/`price_max` (€), `status` (`available`, `retired`, `unknown`), `type` (`set` par défaut, `book`, `gear`, `parts`, `bundle`, `all`), `sort` (`recent`, `oldest`, `name`, `parts_desc`, `parts_asc`, `price_asc`, `price_desc`), `page` |
| `/sets/75192-1-millennium-falcon`                                                                                                                                                               | Fiche d'un set ; `/sets/75192-1` ou un ancien slug redirigent (301) vers l'URL canonique                                                                                                                                                                                                                                                                                                                   |
| `/themes`, `/themes/star-wars`                                                                                                                                                                  | Thèmes avec leur nombre de sets ; sets d'un thème (et de ses sous-thèmes) par année                                                                                                                                                                                                                                                                                                                        |
| `/minifigs`                                                                                                                                                                                     | Catalogue des minifigs paginé (48 par page) : `q` (nom, ou numéro : `fig-000123`, `000123` ou `123`), `theme` (thème principal), `year_min`/`year_max` (première apparition), `sort` (`recent`, `oldest`, `name`, `number`), `page`                                                                                                                                                                        |
| `/minifigs/fig-000001-han-solo`                                                                                                                                                                 | Fiche d'une minifig avec les sets qui la contiennent (et le nombre d'exemplaires) ; URL partielle → redirection 301                                                                                                                                                                                                                                                                                        |
| `/recherche?q=…`                                                                                                                                                                                | Recherche globale du header : sets et minifigs dans deux sections (12 premiers résultats chacune, avec un lien vers la liste complète)                                                                                                                                                                                                                                                                     |
| La recherche par numéro (`75192`) trouve toutes les variantes (`75192-1`, `75192-2`…) ; la recherche par nom ignore la casse et les accents (les noms sont en anglais, comme chez Rebrickable). |

## Import du catalogue (Rebrickable)

```bash
node ace import:rebrickable                   # télécharge les CSV puis importe tout
node ace import:rebrickable --skip-download   # réutilise les fichiers de tmp/rebrickable/
node ace import:rebrickable --only=sets       # seulement les sets (les thèmes doivent exister)
node ace import:rebrickable --only=minifigs   # minifigs + liens avec les sets + champs calculés
```

- Source : les exports CSV publics de Rebrickable (`https://cdn.rebrickable.com/media/downloads/`). L'API Rebrickable n'est pas utilisée pour l'import en masse.
- Lecture en streaming, écriture par lots de 500, **upsert** : relancer la commande met à jour les lignes existantes sans créer de doublons, et ne touche jamais aux données Brickset/BrickLink.
- Chaque import est journalisé dans `import_runs` (créés, mis à jour, inchangés, ignorés, erreurs).
- Les images ne sont pas téléchargées : seule leur URL est stockée.
- Étapes : `themes` → `sets` → `minifigs`. L'étape `minifigs` utilise `minifigs.csv.gz`, `inventories.csv.gz` et `inventory_minifigs.csv.gz` :
  - les liens sets ↔ minifigs (`set_minifigs`) viennent de la **dernière version** d'inventaire de chaque set ; les liens qui ont disparu du fichier sont supprimés ;
  - `sets.num_minifigs` = total des minifigs du set, quantités comprises ;
  - `minifigs.year_first` = année du premier set (tous types) qui la contient ;
  - `minifigs.main_theme_id` = thème **racine** le plus fréquent parmi ses vrais sets (`kind = set`) ; à défaut, parmi ses livres/gear ; vide si la minifig n'est dans aucun set.
- Rebrickable range aussi des produits qui ne sont pas des sets. Ils sont importés mais **marqués** dans `sets.kind` d'après leur thème racine (`app/services/rebrickable/set_kinds.ts`) :

| `kind`   | Thèmes racine Rebrickable                       |
| -------- | ----------------------------------------------- |
| `set`    | tous les autres                                 |
| `book`   | Books                                           |
| `gear`   | Gear (porte-clés, sacs, vêtements, jeux vidéo…) |
| `parts`  | Service Packs, Bulk Bricks                      |
| `bundle` | Value Packs                                     |

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

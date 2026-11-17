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
| `LEGAL_PUBLISHER`, `CONTACT_EMAIL`, `CONTACT_ISSUES_URL`      | Éditeur et moyens de contact affichés sur les mentions légales et la page À propos           |

`.env.test` surcharge quelques valeurs pour les tests (base `briquotheque_test`, sessions et limiter en mémoire).

## Commandes

| Commande                                        | Description                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------- |
| `npm run dev`                                   | Serveur de développement avec rechargement à chaud                              |
| `npm test`                                      | Tests Japa (migre la base de test automatiquement)                              |
| `npm run test:a11y`                             | Test d'accessibilité axe-core des pages types (serveur lancé ; voir ci-dessous) |
| `npm run lint` / `npm run typecheck`            | Qualité du code                                                                 |
| `npm run format`                                | Formatage Prettier                                                              |
| `npm run build`                                 | Build de production dans `build/`                                               |
| `node ace migration:run` / `migration:rollback` | Migrations                                                                      |

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
- **Règle de disponibilité** (`availability_status`, recalculée pour tous les sets à chaque import Brickset) : 0. pas encore en vente → `upcoming` (badge « Bientôt ») : date de mise en vente dans le futur, ou, sans cette date, année postérieure à l'année en cours ;
  1. date de fin connue : aujourd'hui ou plus tard → `available`, passée → `retired` ;
  2. sans date de fin, sorti il y a plus de 3 ans (date de sortie, sinon 1er janvier de l'année) → `retired` ;
  3. sans date de fin, déjà sorti → `available` ;
  4. sinon (aucune donnée) → `unknown`.
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

## Comptes utilisateurs

| URL                                                           | Rôle                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/inscription`, `/connexion`, `/deconnexion`                  | Compte : pseudo, e-mail, mot de passe d'au moins 10 caractères (haché par AdonisJS), avec jauge de solidité                                                                                                                                                                            |
| `/inscription/confirmation`, `/inscription/confirmer/:id`     | Le compte n'est actif qu'après le clic sur le lien signé reçu par e-mail (24 h) ; nouveau lien sur demande ou à la connexion                                                                                                                                                           |
| `/mot-de-passe-oublie` → `/mot-de-passe/reinitialiser/:jeton` | Lien par e-mail, valable 1 h et utilisable une seule fois (seule son empreinte SHA-256 est stockée)                                                                                                                                                                                    |
| `/mon-compte`                                                 | Cartes empilées, un formulaire par action : pseudo, e-mail (mot de passe actuel demandé, l'ancienne adresse est prévenue), mot de passe, préférences, partage de la wishlist ; en bas, à part, suppression du compte (case à cocher + mot de passe ; la collection est supprimée avec) |

- **Confidentialité des comptes** : l'inscription répond la même chose que l'adresse ait déjà un compte ou non (son titulaire reçoit alors un e-mail). Un changement de mot de passe ou d'e-mail déclenche un e-mail d'alerte (à l'ancienne adresse pour l'e-mail).
- **Pages privées** (`middleware.auth()`) : un visiteur non connecté est envoyé vers `/connexion`, puis ramené à la page qu'il voulait.
- **Sécurité** : jeton CSRF (Shield) sur tous les formulaires ; message identique pour un mauvais mot de passe ou un e-mail inconnu (et pour « mot de passe oublié ») ; limites de fréquence par adresse IP :
  - connexion : 5 échecs en 15 min par adresse e-mail → blocage 15 min (les connexions réussies ne comptent pas) ;
  - inscription : 5 comptes par heure ; mot de passe oublié : 5 demandes par 15 min.

  Les compteurs sont dans la table `rate_limits` (`LIMITER_STORE=database`).

- **E-mails** : en local, `MAIL_MAILER=log` écrit chaque e-mail en HTML dans `tmp/mails/` (le chemin s'affiche dans les logs du serveur). En production, `MAIL_MAILER=smtp` avec `SMTP_HOST`, `SMTP_PORT` (465), `SMTP_USERNAME`, `SMTP_PASSWORD` et `MAIL_FROM_ADDRESS` (une adresse de ton domaine sur o2switch). Les e-mails sont envoyés dans la langue du visiteur.

## Notifications

Les confirmations s'affichent en notifications (« toasts ») : en haut à droite sur ordinateur, en haut en pleine largeur sur mobile. Elles glissent à l'arrivée et au départ (sauf si « réduire les animations » est activé). Succès et informations disparaissent après 3 s (pause au survol et au focus), les erreurs restent jusqu'à leur fermeture. Elles sont annoncées aux lecteurs d'écran (`role="status"`, `role="alert"` pour les erreurs).

- Côté serveur : `session.flash('success' | 'info' | 'error', message)` avant une redirection.
- Côté navigateur, pour une action sans rechargement : `notify('Lien copié')` ou `notify(message, 'error')` (`inertia/lib/notify.ts`).

Les erreurs de formulaire restent affichées à côté des champs.

## Collection et wishlist

| URL                                  | Rôle                                                                                                                                                                                                                                                               |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Boutons « Je l'ai » / « Je le veux » | Sur chaque carte et chaque fiche (sets et minifigs). Formulaires POST (fonctionnent sans JavaScript) ; avec JavaScript, sans rechargement. État annoncé par `aria-pressed`, confirmation par un message. Visiteur non connecté → connexion, puis retour à la page. |
| « Je l'ai eu ! »                     | Sur un objet de la wishlist : le passe dans la collection.                                                                                                                                                                                                         |
| Fiche d'un set possédé               | Quantité et état (monté, en boîte, neuf scellé, incomplet) ; bouton pour ajouter les minifigs du set. Les minifigs possédées n'ont que la quantité.                                                                                                                |
| `/ma-collection`                     | Onglets Sets / Minifigs, mêmes filtres que le catalogue + état, compteurs.                                                                                                                                                                                         |
| `/ma-wishlist`                       | Onglets Sets / Minifigs, **prix estimé total** (valeur BrickLink si connue, sinon prix d'origine), partage.                                                                                                                                                        |
| `/wishlist/:jeton`                   | Wishlist partagée, publique et en lecture seule (ni la collection ni l'e-mail n'y apparaissent). Le partage se désactive depuis `/ma-wishlist` : l'ancien lien renvoie alors une 404.                                                                              |

- **Minifigs incluses** : préférence dans « Mon compte » (ajouter automatiquement les minifigs d'un set ajouté à la collection), et bouton à la demande sur la fiche du set. Une minifig déjà possédée n'est pas dupliquée.
- Chaque action ne touche que la collection de l'utilisateur connecté : aucun identifiant d'entrée n'est transmis par le navigateur (testé dans `tests/functional/collection/`).

## Tableau de bord

`/tableau-de-bord` (menu du compte) résume la collection :

- **Chiffres clés** : sets et minifigs (avec les exemplaires), total de pièces.
- **Répartition par thème** (thème principal, 8 premiers + « Autres ») et **par décennie** : graphiques en « briques empilées », construits en HTML/CSS sans bibliothèque. Ce sont de vraies tables (lisibles par les lecteurs d'écran et sans CSS) ; les nombres sont toujours écrits à côté des barres.
- **Les 5 plus gros sets** et **les 5 plus anciens**.
- **Wishlist : à ne pas rater** : sets qui quittent la vente dans les 6 mois (`date_last_available`) et sets déjà retirés (`availability_status = retired`).

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

| URL                                                                                                                                                                                             | Contenu                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                                                                                                                                                                             | Recherche, dernières annonces (sets pas encore en vente, sortie la plus proche d'abord, date prévue ou « Date à confirmer »), derniers sets sortis                                                                                                                                                                                                                                                                                                                           |
| `/sets`                                                                                                                                                                                         | Catalogue paginé (48 par page) avec recherche et filtres dans l'URL : `q`, `theme` (sous-thèmes inclus), `year_min`/`year_max`, `parts_min`/`parts_max`, `price_min`/`price_max` (€), `status` (`upcoming`, `available`, `retired`, `unknown`), `type` (`set` par défaut, `book`, `gear`, `bundle`, `all` ; les pièces détachées n'apparaissent qu'avec `all`), `sort` (`recent`, `oldest`, `name`, `parts_desc`, `parts_asc`, `price_asc`, `price_desc`, `release`), `page` |
| `/sets/75192-1-millennium-falcon`                                                                                                                                                               | Fiche d'un set ; `/sets/75192-1` ou un ancien slug redirigent (301) vers l'URL canonique                                                                                                                                                                                                                                                                                                                                                                                     |
| `/themes`, `/themes/star-wars`                                                                                                                                                                  | Thèmes avec leur nombre de sets ; sets d'un thème (et de ses sous-thèmes) par année                                                                                                                                                                                                                                                                                                                                                                                          |
| `/minifigs`                                                                                                                                                                                     | Catalogue des minifigs paginé (48 par page) : `q` (nom, ou numéro : `fig-000123`, `000123` ou `123`), `theme` (thème principal), `year_min`/`year_max` (première apparition), `sort` (`recent`, `oldest`, `name`, `number`), `page`                                                                                                                                                                                                                                          |
| `/minifigs/fig-000001-han-solo`                                                                                                                                                                 | Fiche d'une minifig avec les sets qui la contiennent (et le nombre d'exemplaires) ; URL partielle → redirection 301                                                                                                                                                                                                                                                                                                                                                          |
| `/recherche?q=…`                                                                                                                                                                                | Recherche globale du header : sets et minifigs dans deux sections (12 premiers résultats chacune, avec un lien vers la liste complète)                                                                                                                                                                                                                                                                                                                                       |
| La recherche par numéro (`75192`) trouve toutes les variantes (`75192-1`, `75192-2`…) ; la recherche par nom ignore la casse et les accents (les noms sont en anglais, comme chez Rebrickable). |

## Pages d'information et qualité (Opquast)

| URL                                                                         | Contenu                                                                                      |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `/a-propos`                                                                 | Le site, sources des données et date de mise à jour, glossaire, déclaration Opquast, contact |
| `/mentions-legales`, `/confidentialite`, `/conditions-utilisation`          | Pages légales (éditeur et contact lus dans `.env`, tableau des cookies)                      |
| `/plan-du-site`                                                             | Toutes les pages, dont les thèmes principaux                                                 |
| `/robots.txt`, `/sitemap.xml`, `/sitemaps/{pages,themes,sets,minifigs}.xml` | Générés à partir de `APP_URL` ; les espaces privés sont exclus                               |

- **Audit** : `docs/audit-opquast.md` (référentiel Opquast 2025, v5.0) liste les 245 règles, leur statut avant et après corrections, et ce qui reste à faire hors code.
- **En-têtes** : CSP avec nonce, Referrer-Policy, X-Frame-Options, HSTS, nosniff ; réponses compressées (gzip / brotli) ; `/assets` en cache 1 an.
- **Pages d'erreur** 403, 404 et 500 personnalisées en production et en test (en développement, la page de débogage d'AdonisJS reste affichée).
- **Test d'accessibilité** : `npm run test:a11y` passe axe-core (WCAG 2.2 A/AA) sur les pages types de `http://localhost:3333` (ou `A11Y_BASE_URL`). Avec `A11Y_EMAIL` et `A11Y_PASSWORD` (compte activé), il teste aussi les pages du compte. Il échoue en cas de violation « serious » ou « critical ».

## Backoffice (administration)

Réservé aux administrateurs : les autres comptes reçoivent une 404 sur `/admin/*` et ne voient aucun lien.

```bash
node ace user:make-admin ton@adresse.fr            # donner les droits
node ace user:make-admin ton@adresse.fr --remove   # les retirer
```

| URL                   | Contenu                                                                                                                                                                                                                                                                                |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/admin`              | Chiffres : sets, minifigs, utilisateurs, éléments sans image, descriptions non traduites, date de la dernière mise à jour                                                                                                                                                              |
| `/admin/images`       | Sets / minifigs sans image ou dont l'image est cassée (signalée par le navigateur d'un administrateur). URL collée à la main avec aperçu, vérifiée (https + image), prioritaire et jamais écrasée par les imports (`img_url_manual`). Aussi via « Modifier l'image » sur chaque fiche. |
| `/admin/mises-a-jour` | Bouton « Mettre à jour les LEGO », état en direct (en attente, en cours, terminé, erreur), nouveautés ajoutées, historique des imports (`import_runs`)                                                                                                                                 |
| `/admin/utilisateurs` | Pseudo, e-mail, date d'inscription, nombre de sets possédés                                                                                                                                                                                                                            |

### Mises à jour en arrière-plan (sans Redis)

Le bouton n'exécute rien lui-même : il ajoute une ligne « en attente » dans la table `jobs`. Le cron lance chaque minute `node ace jobs:work`, qui prend le job, enchaîne `import:rebrickable` puis `import:brickset --resume` (ou un nouveau passage s'il n'y a rien à reprendre) et enregistre la progression. Un seul job à la fois ; un job sans nouvelles depuis 10 minutes est marqué en erreur.

`node ace sync:all` fait la même chose immédiatement (même verrou) : c'est la commande de la mise à jour automatique de la nuit.

Tâches cron à créer dans cPanel (adapter le chemin) :

```
* * * * *   cd ~/briquotheque && node ace jobs:work >> tmp/jobs.log 2>&1
30 3 * * *  cd ~/briquotheque && node ace sync:all >> tmp/sync.log 2>&1
```

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

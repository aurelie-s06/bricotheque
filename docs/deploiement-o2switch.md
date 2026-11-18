# Mettre Briquothèque en ligne sur o2switch

Procédure complète, de zéro jusqu'au site en ligne avec la mise à jour automatique des données. Remplace partout :

- `USER` par ton identifiant cPanel ;
- `briquotheque.exemple.fr` par ton domaine ou sous-domaine.

Le dossier de l'application sera `/home/USER/briquotheque`. Il est **hors** de `public_html`, pour qu'aucun fichier ne soit téléchargeable directement.

---

## 1. Préparer le domaine et le HTTPS

1. **Sous-domaine (si besoin)** : cPanel › **Sous-domaines** (pas « Domaines supplémentaires »). Crée `briquotheque.exemple.fr`. Garde le dossier racine proposé : il servira seulement au fichier `.htaccess`.
2. **Certificat** : cPanel › **Statut SSL/TLS** › coche le domaine › **Exécuter AutoSSL**. Après un changement DNS, laisse le temps à la propagation DNS et au certificat avant de chercher plus loin.

## 2. Créer la base de données

cPanel › **Bases de données MySQL** :

1. **Nouvelle base** : `USER_briquotheque`.
2. **Nouvel utilisateur** : `USER_briquo`, avec un mot de passe long, généré par le bouton « Générateur ». Note-le, il ira dans `.env`.
3. **Ajouter l'utilisateur à la base** : **TOUS LES PRIVILÈGES**.

L'hôte est `localhost` et le port `3306`.

## 3. Créer l'adresse d'envoi des e-mails

1. cPanel › **Comptes de messagerie** › crée `ne-pas-repondre@exemple.fr`, avec un mot de passe long.
2. Dans la ligne du compte, ouvre **Connect Devices** pour noter le **serveur SMTP sortant**, le port **465** (SSL) et l'identifiant (l'adresse complète).
3. cPanel › **Délivrabilité des e-mails** › pour le domaine, clique sur **Réparer** si SPF ou DKIM ne sont pas « Valide ». Sans cela, les e-mails de confirmation risquent d'arriver en indésirables (règle Opquast 217).

## 4. Préparer l'archive sur le Mac

Dans le dossier du projet :

```bash
npm run package
```

La commande produit `briquotheque-build.zip`, d'environ 1 Mo :

- build de production ;
- dossier `tmp/` vide ;
- droits 755 sur les dossiers et 644 sur les fichiers ;
- ni `node_modules`, ni `.env`, ni fichiers `._`.

Le script copie le build sur le disque interne du Mac avant de corriger les droits : sur le disque externe (exFAT), `chmod` n'a aucun effet et l'archive provoquerait des erreurs 403.

## 5. Envoyer l'application

1. cPanel › **Gestionnaire de fichiers** › dans `/home/USER`, crée le dossier `briquotheque`.
2. Entre dans `briquotheque` › **Charger** › envoie `briquotheque-build.zip`.
3. Clic droit sur l'archive › **Extraire** dans `/home/USER/briquotheque`, puis supprime l'archive.

On doit voir directement `ace.js`, `bin/`, `app/`, `public/`, `package.json`, `tmp/`… et non un sous-dossier `build/`.

## 6. Créer l'application Node.js

cPanel › **Setup Node.js App** › **Create Application** :

| Champ                    | Valeur                                                                     |
| ------------------------ | -------------------------------------------------------------------------- |
| Node.js version          | **24** (le projet exige Node ≥ 24 ; s'il n'est pas proposé, voir plus bas) |
| Application mode         | **Production**                                                             |
| Application root         | `briquotheque`                                                             |
| Application URL          | `briquotheque.exemple.fr` (racine du domaine)                              |
| Application startup file | `bin/server.js`                                                            |

Clique sur **Create**. En haut de la page de l'application, cPanel affiche une commande du type :

```bash
source /home/USER/nodevenv/briquotheque/24/bin/activate && cd /home/USER/briquotheque
```

**Copie-la** : elle sert aux étapes 7 à 12. Elle met la bonne version de Node dans le terminal.

> Si **Node 24 n'apparaît pas** dans la liste, ne choisis pas une version plus ancienne : AdonisJS 7 ne démarrera pas. Demande au support o2switch si Node 24 peut être activé, puis préviens-moi.

## 7. Installer les dépendances

cPanel › **Terminal**, puis colle la commande copiée et lance l'installation :

```bash
source /home/USER/nodevenv/briquotheque/24/bin/activate && cd /home/USER/briquotheque
npm ci --omit=dev
```

N'utilise pas le bouton « Run NPM Install » : il installe aussi les outils de développement, inutiles en ligne.

## 8. Créer le fichier `.env`

Toujours dans le Terminal, génère d'abord une clé secrète :

```bash
node ace generate:key --show
```

Puis, dans le Gestionnaire de fichiers, crée `/home/USER/briquotheque/.env` avec ce contenu (sans espace autour des `=`, et une valeur contenant des caractères spéciaux entre guillemets) :

```ini
TZ=Europe/Paris
PORT=3333
HOST=127.0.0.1
NODE_ENV=production
LOG_LEVEL=info
APP_KEY=la_cle_generee_juste_avant
APP_URL=https://briquotheque.exemple.fr

LEGAL_PUBLISHER="Ton nom"
CONTACT_EMAIL=contact@exemple.fr
CONTACT_ISSUES_URL=https://github.com/ton-compte/ton-depot/issues

SESSION_DRIVER=cookie

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=USER_briquo
DB_PASSWORD="le_mot_de_passe_de_la_base"
DB_DATABASE=USER_briquotheque

LIMITER_STORE=database

BRICKSET_API_KEY="ta_cle_brickset"
BRICKSET_DAILY_LIMIT=100

MAIL_MAILER=smtp
MAIL_FROM_NAME=Briquothèque
MAIL_FROM_ADDRESS=ne-pas-repondre@exemple.fr
SMTP_HOST=le_serveur_smtp_note_a_l_etape_3
SMTP_PORT=465
SMTP_USERNAME=ne-pas-repondre@exemple.fr
SMTP_PASSWORD="le_mot_de_passe_de_la_boite"
```

Puis protège-le :

```bash
chmod 600 .env
```

`PORT` et `HOST` sont remplacés par Passenger au démarrage, mais les commandes `node ace` en ont besoin. Ne mets jamais ce fichier dans Git.

## 9. Créer les tables

```bash
node ace migration:run --force
```

`--force` est obligatoire en production.

## 10. Importer le catalogue

```bash
node ace import:rebrickable
node ace import:brickset
```

- **Rebrickable** : 1 à 3 minutes. Les fichiers sont téléchargés dans `tmp/rebrickable`.
- **Brickset** : un passage complet utilise environ **98 appels** sur les 100 autorisés par jour. Si le quota est atteint, l'import s'arrête proprement et reprend automatiquement la nuit suivante, grâce au cron de l'étape 12.

## 11. Démarrer le site et créer ton compte administrateur

1. **Setup Node.js App** › ton application › **Restart**.
2. Ouvre `https://briquotheque.exemple.fr`. Le site doit s'afficher en HTTPS.
3. Inscris-toi sur le site et clique sur le lien reçu par e-mail. Si l'e-mail n'arrive pas, vérifie les indésirables et l'étape 3.
4. Dans le Terminal (environnement activé, comme à l'étape 7) :

   ```bash
   node ace user:make-admin ton@adresse.fr
   ```

5. Recharge le site : « Administration » apparaît dans ton menu de compte.

## 12. Programmer les tâches automatiques (cron)

cPanel › **Tâches Cron** › ajoute deux tâches. Remplace le chemin `nodevenv` par celui de l'étape 6.

**Mises à jour demandées avec le bouton**, à lancer chaque minute (réglage « Une fois par minute ») :

```
source /home/USER/nodevenv/briquotheque/24/bin/activate && cd /home/USER/briquotheque && node ace jobs:work >> tmp/jobs.log 2>&1
```

**Mise à jour automatique de la nuit**, tous les jours à 3 h 30 :

```
source /home/USER/nodevenv/briquotheque/24/bin/activate && cd /home/USER/briquotheque && node ace sync:all >> tmp/sync.log 2>&1
```

Si o2switch refuse la fréquence d'une minute, mets « toutes les 5 minutes » (`*/5`). Le bouton fonctionnera pareil, avec un démarrage un peu plus lent.

## 13. Forcer le HTTPS et choisir avec ou sans `www`

Ajoute ces lignes **tout en haut** du fichier `.htaccess` du dossier racine du domaine (celui de l'étape 1, où cPanel a écrit les lignes `PassengerAppRoot`) :

```apache
RewriteEngine On
# HTTPS partout (Opquast 197)
RewriteCond %{HTTPS} off
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
# Adresse sans www (Opquast 218)
RewriteCond %{HTTP_HOST} ^www\.(.+)$ [NC]
RewriteRule ^ https://%1%{REQUEST_URI} [L,R=301]
```

Ne supprime pas les lignes `Passenger…` écrites par cPanel.

## 14. Vérifier

- [ ] `http://…` et `https://www.…` redirigent vers `https://briquotheque.exemple.fr`.
- [ ] Inscription → e-mail reçu → compte activé.
- [ ] Les mentions légales affichent ton nom et ton contact, et plus « à compléter ».
- [ ] Le **bouton de mise à jour** fonctionne :
  1. `/admin/mises-a-jour` › **Mettre à jour les LEGO** : l'état passe à « En attente » ;
  2. au plus tard une minute après (cinq si cron toutes les 5 minutes), il passe à « En cours » avec l'étape et la barre ;
  3. au bout de 2 à 5 minutes : « Terminée », notification, liste des nouveautés et historique mis à jour ;
  4. s'il reste « En attente », regarde `tmp/jobs.log` dans le Gestionnaire de fichiers : en général, c'est le chemin `nodevenv` du cron qui est faux.
- [ ] Sur ton Mac, `A11Y_BASE_URL=https://briquotheque.exemple.fr npm run test:a11y` ne signale aucune erreur.

## Mettre à jour le site plus tard

1. Sur le Mac : `npm run package`.
2. Gestionnaire de fichiers : envoie et **extrais** l'archive dans `/home/USER/briquotheque` en écrasant les fichiers. `.env` et `tmp/` ne sont pas dans l'archive, ils sont conservés.
3. Terminal (environnement activé) :

   ```bash
   npm ci --omit=dev
   node ace migration:run --force
   ```

4. **Setup Node.js App** › **Restart**.

## En cas de problème

| Symptôme                             | Piste                                                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Erreur 503 / « Incomplete response » | Le site n'a pas démarré : `stderr.log` dans `/home/USER/briquotheque`. Souvent une variable manquante dans `.env`.        |
| Erreur 403                           | Droits de fichiers : refais l'archive avec `npm run package`, ne zippe jamais le dossier à la main sur le disque externe. |
| Liens de partage en `http://`        | Le HTTPS n'est pas forcé (étape 13).                                                                                      |
| Le bouton reste « En attente »       | Le cron ne tourne pas : vérifie la commande de l'étape 12 et `tmp/jobs.log`.                                              |
| Une mise à jour tombe en « Erreur »  | Le message d'erreur est affiché sur la page ; le détail est dans `tmp/jobs.log` ou `tmp/sync.log`.                        |

# 🧭 dsh-explore-button

[![Version](https://img.shields.io/badge/version-1.4.1-blue)](package.json)
[![License](https://img.shields.io/badge/licence-MIT-green)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-339933)](package.json)
[![DSH](https://img.shields.io/badge/DSH-DeepSeek%20Harness-8b5cf6)]()

Plugin **DSH (DeepSeek Harness)** — Barre flottante `Explorateur de dossiers` avec navigateur de fichiers en modal.

Répond au besoin de beaucoup d'utilisateurs : **parcourir visuellement les dossiers, lire ET modifier les fichiers directement depuis l'interface DSH Web**, sans passer par une commande shell.

---

## ✨ Fonctionnalités

- **Barre d'accès rapide flottante** en haut à droite, alignée au niveau des onglets *Chat* / *Trajectory* (`top: 52px`).
- Raccourcis configurables vers les dossiers projets (`/var/www`, `/var/www/sieasset4all`, …).
- **Modal / navigateur de fichiers** au clic sur un raccourci :
  - Lis et affiche l'arborescence d'un dossier (fichiers + sous-dossiers).
  - Navigation par **breadcrumb** (remonter dans les parents) et par clic sur un sous-dossier.
  - **Ouvre un fichier au clic** : affiche son contenu dans un viewer texte (fond blanc, texte sombre).
- **✏️ Modification + 💾 enregistrement** (nouveau en v1.2.0) :
  - Bouton **« ✏️ Modifier »** sur tout fichier texte → édition dans une grande zone de texte monospace.
  - **« 💾 Enregistrer »** réécrit le fichier sur le disque ; le viewer se recharge automatiquement avec le contenu à jour (toast de confirmation avec le nombre d'octets).
  - **« ↩ Annuler »** pour revenir au viewer sans écrire.
  - Détecte les fichiers **binaires** (message dédié, aucune édition proposée).
  - Boutons d'action : **↩ Retour**, **📋 Copier le chemin**, **💬 Envoyer dans le chat**.
- **Chemins de fichiers cliquables dans le chat DSH** : les références de fichiers
  mentionnées dans les messages (ex. `AGENTS.md`, `database/seeders/CatalogueUpdate.php`)
  sont repérées (soulignées en bleu) et s'ouvrent **directement dans le viewer** au clic.
  - Détection par `MutationObserver` (fonctionne sur les nouveaux messages).
  - Résolution depuis la racine projet `/var/www/sieasset4all` ; tout chemin hors `/var/www` est refusé.
  - **Recherche auto dans les sous-dossiers** : si le fichier n'existe pas à la racine, le plugin le retrouve lui-même (ex. `session_memory.md` → `.agent/workflows/session_memory.md`) via `/api/fs/resolve` (v1.3.0).
  - Approche non-intrusive : n'intercepte jamais les autres clics de la GUI.
- **🕒 Monitor de fichiers modifiés** (nouveau en v1.4.0) :
  - Item **« 🕒 Monitor »** dans la barre flottante → modal listant les fichiers
    modifiés du projet (`/var/www/sieasset4all`), triés du plus récent au plus ancien,
    avec **temps relatif** (« il y a 2 min », « hier », date/heure) et taille.
  - Filtres de période : **1 h / 24 h / 7 j / Tout**.
  - Bouton **« 🔴 Suivi »** : surveillance automatique toutes les **5 s** — toast
    « 🔔 N fichier(s) modifié(s) » + insertion en tête de liste à chaque changement.
  - Clic sur un fichier → ouverture dans le viewer (view/edit/save existant).
  - Nouvel endpoint `GET /api/fs/recent?root=&since=&limit=&depth=` : parcours
    **borné et sécurisé** de l'arbre (dossiers lourds `node_modules`/`vendor`/… ignorés,
    symlinks sautés), résultats mémorisés 4 s côté serveur pour absorber les polls.
- **4 endpoints API** serveur (sans toucher au directory-picker DSH) :

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/fs/list?path=<dir>` | Liste JSON (nom, type, taille, caché, tronqué à 1000 entrées) |
| `GET` | `/api/fs/read?path=<file>` | Contenu du fichier en UTF-8 + nombre de lignes |
  | `GET` | `/api/fs/resolve?name=<basename>` | Recherche d'un fichier dans le projet (dossiers doc prioritaires, parcours borné) → `{ found, path, via }` |
| `GET` | `/api/fs/recent?root=<dir>&since=<ms>&limit=<n>` | Fichiers modifiés (parcours borné, mémo 4 s) → `{ root, scannedAt, count, files: [{ path, mtime, size }] }` |
| `POST` | `/api/fs/write` | Body `{ "path": "<file>", "content": "<texte>" }` → `{ ok, path, bytes }` |

---

## 📦 Installation

### Méthode rapide (install.sh)

```bash
# Depuis le dossier du plugin
./install.sh               # installe dans le profil DSH "web"
# PROFILE=mon-profil ./install.sh   # autre profil
```

Puis **redémarrez le serveur DSH** :

```bash
pkill -f 'dsh web'  &&  dsh web
```

> ⚠️ **Gotcha** : lancez `dsh` depuis un répertoire **sans `.env` projet** (ex. `cd ~`) —
> `dsh` refuse de démarrer si le `.env` courant définit des variables réservées
> comme `DEEPSEEK_BASE_URL`.

### Méthode manuelle

1. Copier `explore-button.js` dans `~/.dsh/profiles/<profil>/plugins/`.
2. S'assurer que `~/.dsh/profiles/<profil>/plugins/package.json` existe avec le contenu `{"type":"module"}`.
3. Ajouter dans `~/.dsh/profiles/<profil>/cordis.patch.yml` :

```yaml
- insert:
    - id: fs-browser
      name: './plugins/explore-button.js?ver=<timestamp>'
```

> 💡 Le `?ver=<timestamp>` (ou `?v=<timestamp>`) dans le nom force le re-import
> du module à chaque redémarrage — indispensable quand vous mettez à jour le
> fichier du plugin (cache de module Node).

---

## ⚙️ Configuration des raccourcis

Modifier le tableau `QUICK_PATHS` en haut de `explore-button.js` — les entrées par défaut :

```js
const QUICK_PATHS = [
  { label: "🏠 /var/www",      path: "/var/www" },
  { label: "🔧 sieasset4all",  path: "/var/www/sieasset4all" },
  { label: "🔐 apipki",        path: "/var/www/apipki" },
  { label: "⚙️  core",         path: "/var/www/core" },
  { label: "🌐 main",          path: "/var/www/main" },
  { label: "🔔 notifications", path: "/var/www/notifications" },
  { label: "📲 mobileedr",     path: "/var/www/mobileedr" },
  { label: "🔍 recherche",     path: "SEARCH" },
];
```

La valeur spéciale `"SEARCH"` ouvre un raccourci de recherche libre.

---

## 🗂️ Contenu du paquet

```
dsh-explore-button/
├── explore-button.js     # le plugin (source ESM)
├── install.sh            # script d'installation
├── package.json          # exports ESM + métadonnées
└── README.md             # ce fichier
```

---

## 🛠️ Fonctionnement technique

- Le plugin écoute l'événement `webserver/index-inject` pour injecter le **CSS**, le **HTML** (barre + modal) et le **JS** dans `index.html` à chaque rendu.
- Il enregistre trois routes HTTP sur le serveur web DSH (`ctx.webServer.register`) : `/api/fs/list`, `/api/fs/read` et `/api/fs/write` (dispatcher par chemin, méthode gérée par le handler — `405` hors `POST`).
- Aucune dépendance supplémentaire : utilise les modules Node natifs (`node:fs/promises`, `node:path`, `node:os`).
- `POST /api/fs/write` n'écrit que sur des **fichiers existants** (jamais de création), en UTF-8.

---

## 🔒 Sécurité — à lire avant d'activer l'édition

- `POST /api/fs/write` **écrase un fichier existant** sans sauvegarde : ce que vous
  enregistrez remplace immédiatement le contenu sur le disque (journaux SVN/Git
  disponibles pour revenir en arrière dans le cadre d'un dépôt).
- L'endpoint respecte le même niveau de confiance que l'endpoint de lecture :
  il agit avec les droits du processus DSH. **Ne l'exposez pas sur un serveur
  multi-utilisateurs ou public** sans contrôle d'accès.
- Les fichiers **binaires** ne sont jamais proposés à l'édition.
- Pour verrouiller l'écriture sur une zone précise (ex. `/var/www` uniquement),
  ajoutez un garde-fou dans `handleWriteFile` (racine `resolve(...)` → préfixe attendu).

---

## 📋 Changelog

### v1.4.1 (2026-09-03)
- 🐛 **Correctif critique** : les apostrophes dans le JS injecté (`\'`) étaient avalées par
  la template literal serveur → script invalide dans le navigateur (plugin mort au clic).
  Remplacées par des apostrophes typographiques `’`, texte injecté vérifié par test
  d'exécution (chargement + clic « Monitor »).
- 🏷️ Libellé de l'item renommé **« 🕒 Monitor »** (au lieu de « Modifiés »).

### v1.4.0 (2026-09-03)
- 🕒 **Monitor de fichiers modifiés** : item « Monitor » dans la barre, vue liste avec temps relatif + taille, filtres 1 h / 24 h / 7 j / Tout, suivi auto 🔴 toutes les 5 s (toast + insertion en tête), ouverture directe dans le viewer, endpoint `GET /api/fs/recent` (parcours borné + mémo 4 s).

### v1.3.0 (2026-09-03)
- 🔎 **Résolution automatique des chemins de fichiers** : référence introuvable à la racine → recherche bornée dans le projet (dossiers doc prioritaires) via le nouvel endpoint `GET /api/fs/resolve` → toast « 📂 Résolu » + ouverture directe du bon fichier (ex. `session_memory.md` → `.agent/workflows/session_memory.md`).

### v1.2.0 (2026-09-03)
- ✏️ **Édition + enregistrement** de fichiers texte depuis le viewer (boutons Modifier / Enregistrer / Annuler).
- Zone d'édition haute (min 1080 px) avec confirmation toast (octets écrits) et rechargement automatique.
- Nouvel endpoint `POST /api/fs/write`.

### v1.1.0
- Barre flottante, navigateur de fichiers en modal, viewer lecture seule, endpoints `GET /api/fs/list` et `GET /api/fs/read`.
- Chemins de fichiers cliquables dans le chat (MutationObserver).

---

## ❓ Dépendances / Compatibilité

- **DSH Web profile** (le GUI web servi sur un port).
- **Node.js ≥ 18** (modules natifs uniquement — **aucun `npm install` requis**).
- Testé sur DSH serveur `dsh web` (profil `web`), Node 24.

---

## 📄 Licence

MIT — voir le fichier `LICENSE` du dépôt. Utilisation, modification et redistribution libres (attribution requise).
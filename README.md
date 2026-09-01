# 🧭 dsh-explore-button

Plugin **DSH (DeepSeek Harness)** — Barre flottante `Explorateur de dossiers` avec navigateur de fichiers en modal.

Répond au besoin de beaucoup d'utilisateurs : **parcourir visuellement les dossiers et lire les fichiers directement depuis l'interface DSH Web**, sans passer par une commande shell.

---

## ✨ Fonctionnalités

- **Barre d'accès rapide flottante** en haut à droite, alignée au niveau des onglets *Chat* / *Trajectory* (`top: 52px`).
- Raccourcis configurables vers les dossiers projets (`/var/www`, `/var/www/sieasset4all`, …).
- **Modal / navigateur de fichiers** au clic sur un raccourci :
  - Lis et affiche l'arborescence d'un dossier (fichiers + sous-dossiers).
  - Navigation par **breadcrumb** (remonter dans les parents) et par clic sur un sous-dossier.
  - **Ouvre un fichier au clic** : affiche son contenu dans un viewer texte (fond blanc, texte sombre).
  - Détecte les fichiers **binaires** (message dédié).
  - Boutons d'action : **↩ Retour**, **📋 Copier le chemin**, **💬 Envoyer dans le chat**.
- **2 endpoints API** serveur (sans toucher au directory-picker DSH) :
  - `GET /api/fs/list?path=<dir>` → liste JSON (nom, type, taille, caché).
  - `GET /api/fs/read?path=<file>` → contenu du fichier.

---

## 📦 Installation

### Méthode rapide (install.sh)

```bash
# Depuis le dossier du plugin
./install.sh            # installe dans le profil DSH "web"
# PROFILE=mon-profil ./install.sh   # autre profil
```

Puis **redémarrez le serveur DSH** :

```bash
pkill -f 'dsh web'  &&  dsh web
```

### Méthode manuelle

1. Copier `explore-button.js` dans `~/.dsh/profiles/<profil>/plugins/`.
2. S'assurer que `~/.dsh/profiles/<profil>/plugins/package.json` existe avec le contenu `{"type":"module"}`.
3. Ajouter dans `~/.dsh/profiles/<profil>/cordis.patch.yml` :

```yaml
- insert:
    - id: fs-browser
      name: './plugins/explore-button.js'
```

> 💡 Le `?ver=<timestamp>` dans le nom force le re-import du module (utile en cas de cache HMR).

---

## ⚙️ Configuration des raccourcis

Modifier le tableau `QUICK_PATHS` en haut de `explore-button.js` :

```js
const QUICK_PATHS = [
  { label: "🏠 /var/www",      path: "/var/www" },
  { label: "🔧 sieasset4all",  path: "/var/www/sieasset4all" },
  { label: "🔍 recherche",     path: "SEARCH" },
];
```

---

## 🗂️ Contenu du paquet

```
dsh-explore-button/
├── explore-button.js     # le plugin (source ESM)
├── install.sh            # script d'installation
├── package.json          # exports ESM
└── README.md             # ce fichier
```

---

## 🛠️ Fonctionnement technique

- Le plugin écoute l'événement `webserver/index-inject` pour injecter le **CSS**, le **HTML** (barre + modal) et le **JS** dans `index.html` à chaque rendu.
- Il enregistre deux routes HTTP sur le serveur web DSH (`ctx.webServer.register`).
- Aucune dépendance supplémentaire : utilise les modules Node natifs (`node:fs/promises`, `node:path`, `node:os`).

---

## ❓ Dépendances

- DSH Web profile (serve le GUI web sur un port).
- Node.js natifs uniquement — **aucun `npm install` requis**.
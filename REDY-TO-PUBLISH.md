# DRAG & DROP — Prêt à publier (PR GitHub + npm)

> Copiez-collez simplement. Tout est prêt.

---

## 🅰️ PR vers awesome-deepseek-harness

### Étape 1 — Fork + édition (navigateur)

1. Ouvrir https://github.com/Dominic789654/awesome-deepseek-harness
2. **Fork** → **Create fork**
3. Dans ton fork, ouvrir `README.md`, cliquer l'icône ✏️ (edit)
4. Ajouter l'entrée ci-dessous dans la section `## UI / Clients` (ligne sous un autre plugin de la section)
5. **Commit changes** sur une nouvelle branche (ex: `add-dsh-explore-button`)
6. **Contribute** → **Open pull request**

### Entrée à coller dans la section `## UI / Clients`

```markdown
- [adegams/dsh-explore-button](https://github.com/adegams/dsh-explore-button) — Floating directory explorer for the DSH Web GUI: a top-right quick-access bar plus a modal file browser (list/tree navigation, breadcrumb, file viewer on click) and `/api/fs/list` + `/api/fs/read` endpoints, injected via `webserver/index-inject`.
```

---

### Étape 2 — Titre du PR

```
add dsh-explore-button: directory explorer + modal file viewer for DSH Web
```

### Étape 3 — Corps du PR (coller tel quel)

```markdown
## Summary

Adds **[adegams/dsh-explore-button](https://github.com/adegams/dsh-explore-button)** to the **UI / Clients** section.

This is a DSH Web GUI plugin that gives users a **directory explorer + file viewer** directly in the interface — a need many users have.

## Features

- **Floating quick-access bar** — top-right, aligned with the Chat/Trajectory header tabs (`top: 52px`).
- Configurable project-path shortcuts (e.g. `/var/www`, `/var/www/sieasset4all`, …).
- **Modal file browser** on click:
  - Lists a directory (files + subdirectories), directories first, name-sorted.
  - Breadcrumb navigation (click parents) + click subdirectory to navigate.
  - **Opens a file on click**: displays its content in a text viewer (white bg, dark text).
  - Detects binary files (dedicated message).
  - Action buttons: ↩ Back, 📋 Copy path, 💬 Send to chat.
- **2 server endpoints** (no DSH directory-picker change needed):
  - `GET /api/fs/list?path=<dir>` → JSON listing (name, type, size, hidden).
  - `GET /api/fs/read?path=<file>` → file content.

## Technical

- Injects CSS / HTML / JS via the `webserver/index-inject` event.
- Registers routes via `ctx.webServer.register`.
- No external dependencies (Node core modules only: `node:fs/promises`, `node:path`, `node:os`).

## Install

```bash
# from the cloned repo:
./install.sh     # installs into the DSH "web" profile
# then restart:
pkill -f 'dsh web' && dsh web
```

Or manual: copy `explore-button.js` into `<profile>/plugins/`, ensure `"type":"module"`, add the Cordis insert entry to `cordis.patch.yml`.

## Checklist

- [x] MIT licensed
- [x] Public repo, code pushed
- [x] Tested locally (listing + file reading work)
- [x] Idempotent installer
```

---

## 🅱️ Publication npm

```bash
cd /var/www/sieasset4all/.dsh-shared/dsh-explore-button

# 1) Connexion npm (une seule fois)
npm login

# 2) Vérifier le contenu du package
npm pack --dry-run

# 3) Vérifier que le nom est libre
npm view dsh-explore-button 2>/dev/null && echo "NOM PRIS" || echo "nom libre ✔"

# 4) Publier
npm publish --access public
```

> Si le nom `dsh-explore-button` est déjà pris sur npm, utiliser un scope :
> - dans `package.json`, mettre `"name": "@adegams/dsh-explore-button"`
> - puis `npm publish --access public`

---

## 📏 Vérifications déjà faites

- [x] `npm pack --dry-run` passe → paquet `9,4 kB`, 5 fichiers (LICENSE, README, explore-button.js, install.sh, package.json)
- [x] `install.sh` testé (profil jetable) et **idempotent**
- [x] Plugin fonctionnel : `/api/fs/list` et `/api/fs/read` opérationnels
- [x] Dépôt GitHub **publié** : https://github.com/adegams/dsh-explore-button
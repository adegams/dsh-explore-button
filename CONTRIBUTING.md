# ➕ Soumettre le plugin à la communauté DSH

Ce plugin peut être partagé via **GitHub**, **npm**, et référencé dans les registres `awesome-*`.

---

## 1️⃣ Publier sur npm

```bash
cd dsh-explore-button

# (une seule fois) se connecter au compte npm
npm login

# vérifier que le paquet est prêt
npm pack --dry-run          # liste les fichiers qui seront publiés

# publier
npm publish --access public
```

> ⚠️ Avant publier, remplacer dans `package.json` :
> - `author`
> - `repository.url` → `https://github.com/<VOTRE-USER>/dsh-explore-button.git`
>
> Si le nom `dsh-explore-button` est déjà pris sur npm, utiliser un scope : `@<VOTRE-USER>/dsh-explore-button`.

---

## 2️⃣ Publier sur GitHub

```bash
# depuis le dossier du repo (déjà initialisé + commité)
gh repo create <VOTRE-USER>/dsh-explore-button --public --source . --push
# (ou sans gh CLI) créer le repo sur github.com puis :
git remote add origin git@github.com:<VOTRE-USER>/dsh-explore-button.git
git push -u origin main
```

---

## 3️⃣ Ajouter aux listes `awesome-*` (PR)

Faire un **Pull Request** vers l'une (ou plusieurs) des listes. Entrée à ajouter (format Markdown) :

```markdown
- [dsh-explore-button](https://github.com/<VOTRE-USER>/dsh-explore-button)
  — Barre flottante d'exploration de dossiers + navigateur de fichiers en modal
  (listage, navigation arborescence, lecture de fichiers). Injection via
  `webserver/index-inject` + endpoints `/api/fs/list` et `/api/fs/read`.
```

Cibles principales :
- [Dominic789654/awesome-deepseek-harness](https://github.com/Dominic789654/awesome-deepseek-harness)
  → PR via le [CONTRIBUTING.md](https://github.com/fendouai/awesome-deepseek-harness/blob/main/CONTRIBUTING.md)
- [Anil-matcha/awesome-dsh-plugin](https://github.com/Anil-matcha/awesome-dsh-plugin)
- [SihanTeng/awesome-deepseek-harness-plugins](https://github.com/SihanTeng/awesome-deepseek-harness-plugins)
- [ukinch605/awesome-dsh-hub](https://github.com/ukinch605/awesome-dsh-hub)
- [hikariming/dshfind](https://github.com/hikariming/dshfind)

---

## 🔄 Garder la synchro

Après toute modification de `explore-button.js` :
1. Committer dans le repo Git local.
2. `npm publish` (si déjà publié) pour bump version.
3. Re-generer l'archive tar.gz si besoin.
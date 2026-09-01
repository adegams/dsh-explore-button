# ➕ Entrée PR pour les listes awesome-*

Cette entrée est prête à coller dans un Pull Request vers les registres DSH.

## Description du plugin (à utiliser dans le PR)

> **dsh-explore-button** — Barre flottante d'exploration de dossiers pour le GUI Web DSH, avec navigateur de fichiers en modal (listage, navigation par breadcrumb/arborescence, lecteur de fichiers au clic) et 2 endpoints serveur `/api/fs/list` + `/api/fs/read`. Injection via `webserver/index-inject`, aucune dépendance externe.

## Entrée markdown à ajouter à la section `## UI / Clients`

Dans [`awesome-deepseek-harness`](https://github.com/Dominic789654/awesome-deepseek-harness) (section `## UI / Clients`) :

```markdown
- [adegams/dsh-explore-button](https://github.com/adegams/dsh-explore-button) — Floating directory explorer for the DSH Web GUI: a top-right quick-access bar plus a modal file browser (list/tree navigation, breadcrumb, file viewer on click) and `/api/fs/list` + `/api/fs/read` endpoints, injected via `webserver/index-inject`.
```

## Comment soumettre le PR (3 méthodes)

### Méthode A — depuis le navigateur (la plus simple)
1. Ouvrir https://github.com/Dominic789654/awesome-deepseek-harness
2. Cliquer **Fork** → **Create fork**
3. Dans le fork, éditer `README.md` (icône ✏️) et ajouter l'entrée dans `## UI / Clients`
4. **Commit changes** sur une nouvelle branche
5. **Contribute** → **Open pull request**

### Méthode B — via l'API avec un nouveau token
```bash
export PAT="ghp_..."   # nouveau token (scope repo)
# 1. Fork
curl -X POST -H "Authorization: Bearer $PAT" https://api.github.com/repos/Dominic789654/awesome-deepseek-harness/forks
# 2. Créer la branche + committer + PR (ou utiliser gh CLI)
```

### Méthode C — via GitHub CLI `gh`
```bash
gh repo fork Dominic789654/awesome-deepseek-harness --clone
cd awesome-deepseek-harness
git checkout -b add-dsh-explore-button
# éditer README.md, ajouter l'entrée dans ## UI / Clients
git add README.md
git commit -m "Add dsh-explore-button (file explorer) to UI/Clients"
git push origin add-dsh-explore-button
gh pr create --repo Dominic789654/awesome-deepseek-harness \
  --title "add dsh-explore-button: directory explorer + file viewer" \
  --body "Adds \`adegams/dsh-explore-button\` — floating directory explorer with modal file browser for the DSH Web GUI."
```

## Autres listes à cibler (optionnel)
- [Anil-matcha/awesome-dsh-plugin](https://github.com/Anil-matcha/awesome-dsh-plugin)
- [SihanTeng/awesome-deepseek-harness-plugins](https://github.com/SihanTeng/awesome-deepseek-harness-plugins)
- [ukinch605/awesome-dsh-hub](https://github.com/ukinch605/awesome-dsh-hub)

---

## 📦 Publication npm (commandes exactes)

```bash
cd /var/www/sieasset4all/.dsh-shared/dsh-explore-button

# 1. (une seule fois) s'authentifier à npm
npm login

# (ou avec un token npm : echo "//registry.npmjs.org/:_authToken=<TOKEN>" >> ~/.npmrc)

# 2. Vérifier le contenu du paquet
npm pack --dry-run

# 3. Vérifier le nom n'est pas pris
npm view dsh-explore-button 2>/dev/null || echo "nom libre ✔"

# 4. Publier
npm publish --access public

# Si le nom est pris, utiliser un scope :
#   "name": "@adegams/dsh-explore-button"  puis npm publish --access public
```
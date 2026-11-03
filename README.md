# La Noblesse du Cœur — saisie en ligne

Site de saisie des supports du programme « La Noblesse du Cœur » (BMT Green Academy × ONG Lueur d'Espoir).

- `index.html` : accueil, liens vers les formulaires et les fiches PDF.
- `form.html?f=eval|ens|inc|suivi|rapport|ong` : formulaires.
- `dashboard.html` : tableau de bord (code d'accès).
- `backend/Code.gs` : base de données Google Sheets (Apps Script). Voir les instructions en tête du fichier.
- `config.js` : coller l'URL `/exec` de l'application web Apps Script.

## Sécurité et tests

- Le **code d'accès du tableau de bord** n'est plus dans le code : il se règle dans Apps Script (Paramètres du projet → Propriétés du script → `CODE_ACCES`). Le dépôt est public : ne jamais l'écrire dans un fichier.
- Le site publié sur GitHub Pages ne contient ni `backend/` ni `tests/` (voir `.github/workflows/pages.yml`).
- Les calculs du tableau de bord sont testés : `node --test tests/calculer.test.js` (lancé aussi automatiquement sur GitHub).
- Après chaque modification de `backend/Code.gs` : recoller le fichier dans Apps Script puis **Déployer → Gérer les déploiements → Nouvelle version**.

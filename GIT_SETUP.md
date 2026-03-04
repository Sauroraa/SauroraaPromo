# 📝 Promoteam - Git Setup Instructions

## 🔧 Initialisation Git

### 1. Initialiser le repository

```bash
cd promoteam
git init
git add .
git commit -m "initial: Promoteam SaaS platform - complete setup"
```

### 2. Ajouter remote (remplacer par votre repo)

```bash
git remote add origin https://github.com/yourusername/promoteam.git
git branch -M main
git push -u origin main
```

## 📁 .gitignore - Déjà configuré

Les fichiers suivants sont ignorés:
- `node_modules/`
- `dist/`, `build/`
- `.env` (local), `.env.local`
- `logs/`, `uploads/`
- `.DS_Store`, `.vscode/`, `.idea/`

## 🔒 Fichiers sensibles à ne PAS committer

⚠️ Avant de committer en production:

```bash
# Supprimer du git si committés
git rm --cached .env
git rm --cached .env.*.local
git commit -m "Remove sensitive env files"

# Ajouter au .gitignore si absent
echo ".env" >> .gitignore
echo ".env.*.local" >> .gitignore
git add .gitignore
git commit -m "Update gitignore"
```

## 🚀 CI/CD Setup (optionnel)

### GitHub Actions Example

Créer `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      mariadb:
        image: mariadb:11
        env:
          MYSQL_PASSWORD: test
          MYSQL_DATABASE: promoteam
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      
      - name: Install dependencies
        run: cd backend && npm install
      
      - name: Run linter
        run: cd backend && npm run lint

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      
      - name: Install dependencies
        run: cd frontend && npm install
      
      - name: Build
        run: cd frontend && npm run build
      
      - name: Run linter
        run: cd frontend && npm run lint
```

## 📦 Gestion des versions

### Versioning Scheme
- Utiliser semantic versioning: MAJOR.MINOR.PATCH
- Exemple: v1.0.0, v1.1.0, v1.0.1

### Créer une release

```bash
# Tag release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Créer GitHub Release avec changelist
# Via GitHub interface ou CLI:
# gh release create v1.0.0 --generate-notes
```

## 🔄 Workflow collaboratif

### Feature branch workflow

```bash
# Créer feature branch
git checkout -b feature/add-ocr

# Faire les modifications
git add .
git commit -m "feat: add OCR detection for proofs"

# Push branch
git push origin feature/add-ocr

# Créer Pull Request via GitHub

# Après merge:
git checkout main
git pull origin main
git branch -d feature/add-ocr
```

### Commits conventionnels

```
feat: nouvelle feature
fix: correction de bug
docs: documentation
style: formatage code
refactor: refactorisation
perf: amélioration performance
test: ajout de tests
chore: configuration, deps
```

## 🛡️ Branch Protection (recommandé)

Sur GitHub:
1. Settings → Branches
2. Add rule for `main`
3. Require pull request reviews
4. Require status checks to pass
5. Dismiss stale PR approvals

## 📊 Remotes utiles

```bash
# Voir les remotes
git remote -v

# Ajouter staging
git remote add staging https://github.com/.../promoteam-staging.git

# Ajouter production
git remote add production https://github.com/.../promoteam-prod.git

# Push vers staging
git push staging main
```

## 🔐 Secrets Management

### GitHub Secrets (pour CI/CD)

1. Settings → Secrets and variables → Actions
2. New repository secret

Secrets à ajouter:
- `DOCKER_REGISTRY_USERNAME`
- `DOCKER_REGISTRY_PASSWORD`
- `DEPLOYMENT_KEY`
- `SLACK_WEBHOOK` (optionnel)

```bash
# Utilisé dans workflows
- name: Deploy
  env:
    DOCKER_USERNAME: ${{ secrets.DOCKER_REGISTRY_USERNAME }}
    DOCKER_PASSWORD: ${{ secrets.DOCKER_REGISTRY_PASSWORD }}
  run: bash deploy.sh
```

## 📋 Hooks Git (optionnel)

### Pre-commit hook

Créer `.git/hooks/pre-commit`:

```bash
#!/bin/bash

echo "Running pre-commit checks..."

# Backend lint
cd backend
npm run lint
if [ $? -ne 0 ]; then
  echo "Backend lint failed"
  exit 1
fi
cd ..

# Frontend lint
cd frontend
npm run lint
if [ $? -ne 0 ]; then
  echo "Frontend lint failed"
  exit 1
fi

echo "Pre-commit checks passed"
exit 0
```

Rendre exécutable:
```bash
chmod +x .git/hooks/pre-commit
```

## 🗂️ Repository Structure

```
promoteam/
├── .git/
├── .github/
│   └── workflows/          # CI/CD configurations
├── backend/
├── frontend/
├── database/
├── nginx/
├── .gitignore
├── README.md
├── package.json
└── docker-compose.yml
```

## ✅ Pre-push checklist

Avant de push:

```bash
# 1. Update local repo
git pull origin main

# 2. Run tests
npm test

# 3. Run linter
npm run lint

# 4. Build project
npm run build

# 5. Check for secrets
git diff --cached | grep -i "password\|secret\|token\|key"

# 6. Push
git push origin main
```

---

**Configuration Git complétée!**

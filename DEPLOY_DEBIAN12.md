# Déploiement sur Debian 12

Ce document décrit les étapes recommandées pour déployer le projet Promoteam sur un serveur Debian 12 (stable). La stack attendue est celle fournie dans le repo : Docker + Docker Compose (plugin `docker compose`), Nginx (optionnel), et services définis dans `docker-compose.yml`.

## Pré-requis (sur la machine target)
- Compte utilisateur avec `sudo` (ex : `deploy`).
- Accès SSH et pare-feu (ex: `ufw`).
- Port 22 ouvert pour SSH, ports 80/443 pour HTTP/S (ou via reverse proxy).

## Installer Docker Engine et le plugin Docker Compose
1. Mettre à jour le système:

```pwsh
sudo apt update
sudo apt upgrade -y
```

2. Installer les dépendances et ajouter le dépôt Docker:

```pwsh
sudo apt install -y ca-certificates curl gnupg lsb-release
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

3. Vérifier l'installation:

```pwsh
sudo docker version
docker compose version
```

Optionnel: ajouter l'utilisateur `deploy` au groupe `docker` pour éviter `sudo`:

```pwsh
sudo usermod -aG docker deploy
# puis reconnectez-vous (logout/login)
```

## Préparer le dépôt et les configurations
1. Cloner le repo:

```pwsh
git clone https://github.com/Sauroraa/SauroraaPromo.git /opt/promoteam
cd /opt/promoteam
```

2. Copier le fichier `.env.example` vers `.env` et remplir les variables (secrets, mots de passe DB, clés JWT, etc.). Ne commitez jamais `.env` contenant des secrets.

```pwsh
cp .env.example .env
# Éditez .env avec les valeurs pour l'environnement de production
```

3. (Si vous utilisez la base de données locale via `docker-compose`) - vérifier les paramètres `MARIADB_ROOT_PASSWORD` et autres credentials dans `.env`.

## Démarrer avec Docker Compose
Le projet inclut un `docker-compose.yml` prêt. Pour démarrer:

```pwsh
docker compose up -d --build
```

Vérifiez les logs/services:

```pwsh
docker compose ps
docker compose logs -f backend
```

## Base de données & migrations
- Le repo contient un fichier `database/migrations/001-init.sql`. Si vous utilisez MariaDB en container, vous pouvez importer le SQL via `docker exec`:

```pwsh
docker compose exec mariadb sh -c 'mysql -u root -p"$MARIADB_ROOT_PASSWORD" < /workspace/database/migrations/001-init.sql'
```

(Adapter le chemin en fonction de votre montage de volume dans `docker-compose.yml`.)

## Nginx / SSL (optionnel)
- Vous pouvez soit utiliser le service `nginx` fourni dans la `docker-compose.yml`, soit configurer un Nginx system-level.
- Pour TLS, utilisez Certbot (Let's Encrypt). Exemple rapide avec `nginx` system-level:

```pwsh
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your.domain.example
```

Assurez-vous que le reverse-proxy redirige vers le port exposé du frontend/backend (ou utilisez le service `nginx` dans Docker Compose déjà configuré).

## Sécurité & pare-feu
- Utiliser `ufw` (exemple minimal):

```pwsh
sudo apt install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'   # si nginx system-level
sudo ufw enable
```

## Supervision & backups
- Ajoutez sauvegardes régulières pour la base MariaDB (dump + rotation). Exemple simple:

```pwsh
docker compose exec mariadb sh -c 'mysqldump -u root -p"$MARIADB_ROOT_PASSWORD" promoteam > /backups/promoteam-$(date +%F).sql'
```

- Utilisez `docker compose restart` ou des outils comme `watchtower` pour mise à jour automatique (avec prudence en prod).

## Healthchecks et services
- Le repo contient `health-check.sh` et des endpoints `/health` côté backend. Configurez un service de monitoring (Prometheus, UptimeRobot) pour vérifier la disponibilité.

## Notes pratiques
- Pour des déploiements reproduisibles, préférez CI/CD (GitHub Actions) qui construit les images et pousse vers un registry, puis déploie via SSH/Ansible ou `docker compose pull` sur le serveur.
- Stockez secrets dans Vault ou GitHub Secrets et injectez via CI; n'envoyez pas secrets en clair dans le repo.

---
Si vous voulez, j'ajoute un unit systemd pour lancer `docker compose` au boot, ou je prépare un script d'upgrade/migration sécurisé (stop, pull, migrate, start). Voulez-vous que je génère ces fichiers également ?

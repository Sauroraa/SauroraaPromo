#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Promoteam — Bootstrap complet (Debian 12)
# Une seule commande pour tout installer + sécuriser :
#
#   curl -sSL https://raw.githubusercontent.com/Sauroraa/SauroraaPromo/main/bootstrap.sh | sudo bash
#
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

# ─── Config ──────────────────────────────────────────────────────────────────
DOMAIN="promoteam.sauroraa.be"
REPO="https://github.com/Sauroraa/SauroraaPromo.git"
DEPLOY_DIR="/var/www/promoteam.sauroraa.be"
BACKUP_DIR="/var/backups/promoteam"
SMTP_HOST="smtp.us.appsuite.cloud"
SMTP_PORT="587"
SMTP_USER="contact@sauroraa.be"
SMTP_FROM="Promoteam <noreply@sauroraa.be>"
CERTBOT_EMAIL="contact@sauroraa.be"

# ─── Colors ──────────────────────────────────────────────────────────────────
R='\033[0;31m'; G='\033[0;32m'; Y='\033[1;33m'; C='\033[0;36m'; N='\033[0m'
step()    { echo -e "\n${C}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}\n${C}  $*${N}"; }
ok()      { echo -e "  ${G}✓${N}  $*"; }
warn()    { echo -e "  ${Y}!${N}  $*"; }
die()     { echo -e "\n${R}ERREUR: $*${N}\n"; exit 1; }

# ─── Must be root ─────────────────────────────────────────────────────────────
[ "$(id -u)" = "0" ] || die "Lancer en root : sudo bash bootstrap.sh"

echo -e "${C}"
echo "  ██████╗ ██████╗  ██████╗ ███╗   ███╗ ██████╗ ████████╗███████╗ █████╗ ███╗   ███╗"
echo "  ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔═══██╗╚══██╔══╝██╔════╝██╔══██╗████╗ ████║"
echo "  ██████╔╝██████╔╝██║   ██║██╔████╔██║██║   ██║   ██║   █████╗  ███████║██╔████╔██║"
echo "  ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██║   ██║   ██║   ██╔══╝  ██╔══██║██║╚██╔╝██║"
echo "  ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║╚██████╔╝   ██║   ███████╗██║  ██║██║ ╚═╝ ██║"
echo "  ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝ ╚═════╝    ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝"
echo -e "${N}"
echo -e "  Deploy automatique pour ${Y}${DOMAIN}${N}"
echo ""

# ─── Demande les secrets sensibles ───────────────────────────────────────────
step "Configuration des accès"

read -r -p "  Mot de passe SMTP (contact@sauroraa.be) : " -s SMTP_PASS; echo ""
[ -z "$SMTP_PASS" ] && die "SMTP_PASS requis"

read -r -p "  Email admin (défaut: admin@${DOMAIN}) : " ADMIN_EMAIL
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@${DOMAIN}}"

read -r -p "  Mot de passe admin : " -s ADMIN_PASS; echo ""
[ -z "$ADMIN_PASS" ] && die "ADMIN_PASS requis"

# ─── Génération des secrets automatiques ─────────────────────────────────────
step "Génération des secrets sécurisés"

gen_pass() { openssl rand -base64 32 | tr -d '/+=' | head -c 32; }

JWT_SECRET=$(openssl rand -hex 64)
MYSQL_ROOT_PASS=$(gen_pass)
MYSQL_PASS=$(gen_pass)
REDIS_PASS=$(gen_pass)

ok "JWT_SECRET       : ${JWT_SECRET:0:16}…  (64 bytes)"
ok "MYSQL_ROOT_PASS  : ${MYSQL_ROOT_PASS:0:8}…  (32 chars)"
ok "MYSQL_PASS       : ${MYSQL_PASS:0:8}…  (32 chars)"
ok "REDIS_PASS       : ${REDIS_PASS:0:8}…  (32 chars)"

# ─── 1. System update ─────────────────────────────────────────────────────────
step "1/8 — Mise à jour système"
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
  curl wget git ufw unzip \
  ca-certificates gnupg lsb-release \
  apt-transport-https software-properties-common \
  fail2ban logrotate
ok "Système à jour"

# ─── 2. Docker ────────────────────────────────────────────────────────────────
step "2/8 — Installation Docker"
if ! command -v docker &>/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/debian \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    | tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update -qq
  apt-get install -y -qq \
    docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
  ok "Docker installé ($(docker --version | cut -d' ' -f3 | tr -d ','))"
else
  ok "Docker déjà présent ($(docker --version | cut -d' ' -f3 | tr -d ','))"
fi

# ─── 3. Répertoires ───────────────────────────────────────────────────────────
step "3/8 — Création des répertoires"
mkdir -p "$DEPLOY_DIR" "$BACKUP_DIR" /var/log/promoteam
chmod 750 "$DEPLOY_DIR" "$BACKUP_DIR"
ok "Répertoires créés"

# ─── 4. Clone du repo ─────────────────────────────────────────────────────────
step "4/8 — Clonage du repository"
# Fix ownership (dubious directory error when dir was created by another user)
chown -R root:root "$DEPLOY_DIR" 2>/dev/null || true
git config --system --add safe.directory "$DEPLOY_DIR" 2>/dev/null || true
if [ -d "$DEPLOY_DIR/.git" ]; then
  cd "$DEPLOY_DIR"
  git fetch --all
  git reset --hard origin/main
  ok "Code mis à jour ($(git rev-parse --short HEAD))"
else
  git clone "$REPO" "$DEPLOY_DIR"
  cd "$DEPLOY_DIR"
  ok "Repository cloné ($(git rev-parse --short HEAD))"
fi

# ─── 5. Génération du .env sécurisé ──────────────────────────────────────────
step "5/8 — Génération du .env sécurisé"

cat > "$DEPLOY_DIR/.env" << ENVEOF
# ─── Généré automatiquement le $(date '+%Y-%m-%d %H:%M:%S') UTC ───────────────────────────
NODE_ENV=production
APP_URL=https://${DOMAIN}
FRONTEND_URL=https://${DOMAIN}
PORT=5000

# Database
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASS}
MYSQL_PASSWORD=${MYSQL_PASS}
DB_HOST=mariadb
DB_PORT=3306
DB_USER=promoteam
DB_NAME=promoteam

# Redis
REDIS_PASSWORD=${REDIS_PASS}

# JWT (64 bytes random)
JWT_SECRET=${JWT_SECRET}

# Mail SMTP
MAIL_HOST=${SMTP_HOST}
MAIL_PORT=${SMTP_PORT}
MAIL_USER=${SMTP_USER}
MAIL_PASSWORD=${SMTP_PASS}
MAIL_FROM="${SMTP_FROM}"

# Frontend
VITE_API_URL=https://${DOMAIN}/api
VITE_APP_URL=https://${DOMAIN}

# Admin seed
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASS}
ENVEOF

# Permissions strictes (lecture root uniquement)
chmod 600 "$DEPLOY_DIR/.env"
chown root:root "$DEPLOY_DIR/.env"

ok ".env créé avec droits 600 (root uniquement)"

# ─── 6. Pare-feu ──────────────────────────────────────────────────────────────
step "6/8 — Configuration du pare-feu UFW"
ufw --force reset > /dev/null
ufw default deny incoming  > /dev/null
ufw default allow outgoing > /dev/null
ufw allow 22/tcp   comment "SSH"   > /dev/null
ufw allow 80/tcp   comment "HTTP"  > /dev/null
ufw allow 443/tcp  comment "HTTPS" > /dev/null
ufw --force enable > /dev/null
ok "Pare-feu actif : SSH(22) HTTP(80) HTTPS(443) — tout le reste bloqué"

# ─── 6b. fail2ban ─────────────────────────────────────────────────────────────
cat > /etc/fail2ban/jail.d/promoteam.conf << 'F2B'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port    = ssh
logpath = /var/log/auth.log
F2B
systemctl enable --now fail2ban > /dev/null 2>&1
ok "fail2ban actif (5 essais → ban 1h)"

# ─── 7. Certificat SSL (Let's Encrypt) ────────────────────────────────────────
step "7/8 — Certificat SSL Let's Encrypt"

CERT_PATH="/var/lib/docker/volumes/promoteam_certbot_conf/_data/live/${DOMAIN}"

if [ -f "${CERT_PATH}/fullchain.pem" ]; then
  ok "Certificat déjà présent"
else
  # Démarrer nginx HTTP seul pour le challenge ACME
  mkdir -p /tmp/certbot-www
  docker run --rm -d --name nginx-acme \
    -p 80:80 \
    -v /tmp/certbot-www:/var/www/certbot \
    nginx:1.25-alpine \
    sh -c 'echo "server { listen 80; location /.well-known/acme-challenge/ { root /var/www/certbot; } location / { return 200 ok; } }" > /etc/nginx/conf.d/default.conf && nginx -g "daemon off;"' \
    2>/dev/null

  sleep 3

  # Obtenir le certificat
  docker run --rm \
    -v promoteam_certbot_conf:/etc/letsencrypt \
    -v /tmp/certbot-www:/var/www/certbot \
    certbot/certbot certonly \
      --webroot \
      --webroot-path=/var/www/certbot \
      --email "${CERTBOT_EMAIL}" \
      --agree-tos \
      --no-eff-email \
      --non-interactive \
      -d "${DOMAIN}" \
    && ok "Certificat SSL obtenu pour ${DOMAIN}" \
    || warn "Échec SSL — assure-toi que ${DOMAIN} pointe vers ce serveur"

  docker stop nginx-acme 2>/dev/null || true
fi

# ─── 8. Build + démarrage ─────────────────────────────────────────────────────
step "8/8 — Build des images + démarrage"

cd "$DEPLOY_DIR"
COMPOSE="docker compose -f docker-compose.prod.yml"

# Build backend et frontend
$COMPOSE build \
  --build-arg VITE_API_URL="https://${DOMAIN}/api" \
  --build-arg VITE_APP_URL="https://${DOMAIN}" \
  backend frontend 2>&1 | tail -5

ok "Images construites"

# Démarrer tous les services
$COMPOSE up -d --remove-orphans
ok "Services démarrés"

# Attendre que la DB soit prête
echo -n "  Attente DB"
MAX=40; COUNT=0
until docker exec promoteam-db \
    mariadb-admin ping -h localhost -u promoteam -p"${MYSQL_PASS}" --silent 2>/dev/null; do
  COUNT=$((COUNT+1)); [ $COUNT -ge $MAX ] && { echo ""; die "DB timeout"; }
  echo -n "."; sleep 3
done
echo ""; ok "Base de données prête"

# Seed admin
ADMIN_EXISTS=$(docker exec promoteam-db \
  mariadb -u promoteam -p"${MYSQL_PASS}" promoteam \
  -se "SELECT COUNT(*) FROM users WHERE role='admin';" 2>/dev/null || echo "0")

if [ "${ADMIN_EXISTS}" = "0" ]; then
  docker exec promoteam-backend node scripts/seed-admin.js
  ok "Admin créé : ${ADMIN_EMAIL}"
else
  ok "Admin déjà existant"
fi

# ─── Cron : backup quotidien à 03h00 ─────────────────────────────────────────
CRON_CMD="0 3 * * * root bash ${DEPLOY_DIR}/deploy.sh --backup-only >> /var/log/promoteam/backup.log 2>&1"
grep -qF "deploy.sh --backup" /etc/crontab 2>/dev/null \
  || echo "$CRON_CMD" >> /etc/crontab
ok "Backup automatique quotidien à 03:00"

# ─── Log rotation ─────────────────────────────────────────────────────────────
cat > /etc/logrotate.d/promoteam << 'LR'
/var/log/promoteam/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
}
LR

# ─── Sauvegarde des secrets ───────────────────────────────────────────────────
SECRETS_FILE="/root/promoteam-secrets-$(date +%Y%m%d).txt"
cat > "$SECRETS_FILE" << SECRETS
Promoteam — Secrets générés le $(date '+%Y-%m-%d %H:%M:%S')
════════════════════════════════════════════════════
DOMAINE        : https://${DOMAIN}

ADMIN EMAIL    : ${ADMIN_EMAIL}
ADMIN PASSWORD : ${ADMIN_PASS}

MYSQL ROOT     : ${MYSQL_ROOT_PASS}
MYSQL USER     : ${MYSQL_PASS}
REDIS          : ${REDIS_PASS}

JWT SECRET     : ${JWT_SECRET}

SMTP USER      : ${SMTP_USER}
SMTP PASS      : (non affiché — dans .env)
════════════════════════════════════════════════════
.env path      : ${DEPLOY_DIR}/.env  (chmod 600)
Backups        : ${BACKUP_DIR}/
Logs           : /var/log/promoteam/
SECRETS
chmod 600 "$SECRETS_FILE"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo -e "${G}  DEPLOY TERMINÉ — https://${DOMAIN}${N}"
echo -e "${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo ""
echo -e "  ${Y}Connexion admin :${N}"
echo -e "  Email    : ${ADMIN_EMAIL}"
echo -e "  Password : ${ADMIN_PASS}"
echo ""
echo -e "  ${Y}Secrets sauvegardés dans :${N} ${SECRETS_FILE}"
echo -e "  ${R}→ Sauvegarde ce fichier en lieu sûr puis supprime-le du serveur${N}"
echo ""
echo -e "  ${Y}Commandes utiles :${N}"
echo "  docker compose -f ${DEPLOY_DIR}/docker-compose.prod.yml ps"
echo "  docker compose -f ${DEPLOY_DIR}/docker-compose.prod.yml logs -f backend"
echo "  ${DEPLOY_DIR}/deploy.sh           # mise à jour"
echo "  ${DEPLOY_DIR}/deploy.sh --rollback # rollback DB"
echo ""

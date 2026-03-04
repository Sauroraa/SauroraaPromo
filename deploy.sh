#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Promoteam — Deploy script for Debian 12
# Usage:
#   ./deploy.sh           → update deployment (standard)
#   ./deploy.sh --init    → first-time deploy (SSL issuance + admin seed)
#   ./deploy.sh --rollback → restore last DB backup
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────────────
DOMAIN="promoteam.sauroraa.be"
PROJECT_PATH="/var/www/promoteam.sauroraa.be"
BACKUP_PATH="/var/backups/promoteam"
COMPOSE="docker compose -f docker-compose.prod.yml"
EMAIL="contact@sauroraa.be"   # certbot registration email

# ─── Colors ──────────────────────────────────────────────────────────────────
R='\033[0;31m'; G='\033[0;32m'; Y='\033[1;33m'; B='\033[0;34m'; N='\033[0m'
info()    { echo -e "${B}[INFO]${N}  $*"; }
success() { echo -e "${G}[OK]${N}    $*"; }
warn()    { echo -e "${Y}[WARN]${N}  $*"; }
error()   { echo -e "${R}[ERR]${N}   $*"; exit 1; }
step()    { echo -e "\n${Y}━━━ $* ${N}"; }

# ─── Arg parsing ─────────────────────────────────────────────────────────────
INIT=false
ROLLBACK=false
for arg in "$@"; do
  case $arg in
    --init)     INIT=true ;;
    --rollback) ROLLBACK=true ;;
  esac
done

# ─────────────────────────────────────────────────────────────────────────────
# ROLLBACK
# ─────────────────────────────────────────────────────────────────────────────
if $ROLLBACK; then
  step "Rolling back to last backup"
  LATEST=$(ls -t "$BACKUP_PATH"/*.sql.gz 2>/dev/null | head -1)
  [ -z "$LATEST" ] && error "No backup found in $BACKUP_PATH"
  source "$PROJECT_PATH/.env"
  info "Restoring: $LATEST"
  zcat "$LATEST" | docker exec -i promoteam-db \
    mariadb -u promoteam -p"${MYSQL_PASSWORD}" promoteam
  success "Database restored from $LATEST"
  exit 0
fi

# ─────────────────────────────────────────────────────────────────────────────
# PREREQUISITES
# ─────────────────────────────────────────────────────────────────────────────
step "Checking prerequisites"
command -v docker        >/dev/null || error "Docker not installed. Run setup-server.sh first."
command -v git           >/dev/null || error "git not installed"
[ -f "$PROJECT_PATH/.env" ] || error ".env file missing at $PROJECT_PATH/.env"

cd "$PROJECT_PATH"
source .env

success "Prerequisites OK"

# ─────────────────────────────────────────────────────────────────────────────
# BACKUP before any change
# ─────────────────────────────────────────────────────────────────────────────
step "Backing up database"
mkdir -p "$BACKUP_PATH"

if docker ps --format '{{.Names}}' | grep -q promoteam-db; then
  BACKUP_FILE="$BACKUP_PATH/backup-$(date +%Y%m%d-%H%M%S).sql.gz"
  docker exec promoteam-db \
    mariadb-dump -u promoteam -p"${MYSQL_PASSWORD}" promoteam \
    | gzip > "$BACKUP_FILE"
  success "Backup saved: $BACKUP_FILE"

  # Keep only last 7 daily backups
  ls -t "$BACKUP_PATH"/*.sql.gz | tail -n +8 | xargs -r rm --
else
  warn "DB not running — skipping backup"
fi

# ─────────────────────────────────────────────────────────────────────────────
# GIT PULL
# ─────────────────────────────────────────────────────────────────────────────
step "Pulling latest code"
git fetch --all
git reset --hard origin/main
success "Code updated to $(git rev-parse --short HEAD)"

# ─────────────────────────────────────────────────────────────────────────────
# FIRST-TIME: SSL certificate issuance
# ─────────────────────────────────────────────────────────────────────────────
if $INIT; then
  step "First-time init — issuing SSL certificate"

  # Start nginx HTTP-only (for certbot challenge)
  # Temporarily use a minimal config without SSL
  cat > /tmp/promoteam-init.conf << 'NGINXEOF'
server {
    listen 80;
    server_name promoteam.sauroraa.be;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / { return 200 "init"; }
}
NGINXEOF

  docker run --rm -d \
    --name nginx-init \
    -p 80:80 \
    -v /tmp/promoteam-init.conf:/etc/nginx/conf.d/default.conf:ro \
    -v "$(docker volume inspect promoteam_certbot_www --format '{{.Mountpoint}}' 2>/dev/null || echo /tmp/certbot-www)":/var/www/certbot \
    nginx:1.25-alpine 2>/dev/null || true

  # Create certbot volumes and get cert
  docker run --rm \
    -v "$(docker volume inspect promoteam_certbot_conf --format '{{.Mountpoint}}' 2>/dev/null || echo /tmp/certbot-conf)":/etc/letsencrypt \
    -v "$(docker volume inspect promoteam_certbot_www --format '{{.Mountpoint}}' 2>/dev/null || echo /tmp/certbot-www)":/var/www/certbot \
    certbot/certbot certonly \
      --webroot \
      --webroot-path=/var/www/certbot \
      --email "$EMAIL" \
      --agree-tos \
      --no-eff-email \
      -d "$DOMAIN" || warn "Certbot failed — using $COMPOSE run certbot manually if needed"

  docker stop nginx-init 2>/dev/null || true

  success "SSL certificate issued (or already exists)"
fi

# ─────────────────────────────────────────────────────────────────────────────
# BUILD IMAGES
# ─────────────────────────────────────────────────────────────────────────────
step "Building Docker images"
$COMPOSE build \
  --build-arg VITE_API_URL="https://${DOMAIN}/api" \
  --build-arg VITE_APP_URL="https://${DOMAIN}" \
  --no-cache backend frontend
success "Images built"

# ─────────────────────────────────────────────────────────────────────────────
# START / RESTART SERVICES
# ─────────────────────────────────────────────────────────────────────────────
step "Starting services"
$COMPOSE up -d --remove-orphans
success "Services started"

# ─────────────────────────────────────────────────────────────────────────────
# WAIT FOR DB
# ─────────────────────────────────────────────────────────────────────────────
step "Waiting for database to be ready"
MAX=30; COUNT=0
until docker exec promoteam-db mariadb-admin ping -h localhost -u promoteam -p"${MYSQL_PASSWORD}" --silent 2>/dev/null; do
  COUNT=$((COUNT+1))
  [ $COUNT -ge $MAX ] && error "DB did not become ready in time"
  info "Waiting... ($COUNT/$MAX)"
  sleep 3
done
success "Database ready"

# ─────────────────────────────────────────────────────────────────────────────
# FIRST-TIME: seed admin user
# ─────────────────────────────────────────────────────────────────────────────
if $INIT; then
  step "Seeding admin user"
  # Check if admin already exists
  ADMIN_EXISTS=$(docker exec promoteam-db \
    mariadb -u promoteam -p"${MYSQL_PASSWORD}" promoteam \
    -se "SELECT COUNT(*) FROM users WHERE role='admin';" 2>/dev/null || echo "0")

  if [ "${ADMIN_EXISTS}" = "0" ]; then
    docker exec promoteam-backend \
      node scripts/seed-admin.js
    success "Admin user created: ${ADMIN_EMAIL:-admin@promoteam.sauroraa.be}"
    warn "IMPORTANT — change your admin password immediately after first login!"
  else
    info "Admin already exists — skipping seed"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────────────────────────────────────
step "Verifying deployment"
sleep 5

API_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" \
  "https://${DOMAIN}/api/health" 2>/dev/null || echo "000")

if [ "$API_STATUS" = "200" ]; then
  success "API health check passed (HTTP $API_STATUS)"
else
  warn "API health check returned HTTP $API_STATUS (nginx may still be loading SSL)"
fi

# ─────────────────────────────────────────────────────────────────────────────
# STATUS SUMMARY
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo -e "${G}  Deploy terminé — https://${DOMAIN}${N}"
echo -e "${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo ""
$COMPOSE ps
echo ""
info "Logs backend : docker compose -f docker-compose.prod.yml logs -f backend"
info "Logs nginx   : docker compose -f docker-compose.prod.yml logs -f nginx"

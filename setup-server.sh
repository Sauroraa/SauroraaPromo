#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Promoteam — First-time server provisioning (Debian 12)
# Run as root on a fresh Debian 12 VPS:
#   curl -sSL https://... | bash
#   OR: wget -O setup.sh ... && chmod +x setup.sh && sudo ./setup.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────────────
DOMAIN="promoteam.sauroraa.be"
DEPLOY_DIR="/var/www/promoteam.sauroraa.be"
GIT_REPO="git@github.com:your-org/promoteam.git"   # ← change to your repo
GIT_BRANCH="main"
BACKUP_DIR="/var/backups/promoteam"
DEPLOY_USER="promoteam"

# ─── Colors ──────────────────────────────────────────────────────────────────
R='\033[0;31m'; G='\033[0;32m'; Y='\033[1;33m'; N='\033[0m'
step()    { echo -e "\n${Y}━━━ $* ${N}"; }
success() { echo -e "${G}[OK]${N}    $*"; }
info()    { echo -e "       $*"; }

# ─── Must be root ─────────────────────────────────────────────────────────────
[ "$(id -u)" = "0" ] || { echo -e "${R}Run as root${N}"; exit 1; }

# ─────────────────────────────────────────────────────────────────────────────
step "1/9 — System update"
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
  curl wget git ufw unzip \
  ca-certificates gnupg lsb-release \
  apt-transport-https software-properties-common \
  logrotate fail2ban
success "System updated"

# ─────────────────────────────────────────────────────────────────────────────
step "2/9 — Install Docker"
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
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin

  systemctl enable docker
  systemctl start docker
  success "Docker installed"
else
  success "Docker already installed ($(docker --version))"
fi

# ─────────────────────────────────────────────────────────────────────────────
step "3/9 — Create deploy user"
if ! id "$DEPLOY_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$DEPLOY_USER"
  usermod -aG docker "$DEPLOY_USER"
  success "User '$DEPLOY_USER' created"
else
  usermod -aG docker "$DEPLOY_USER"
  success "User '$DEPLOY_USER' already exists"
fi

# ─────────────────────────────────────────────────────────────────────────────
step "4/9 — Create directory structure"
mkdir -p "$DEPLOY_DIR"
mkdir -p "$BACKUP_DIR"
mkdir -p /var/log/promoteam

chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$BACKUP_DIR"

success "Directories created"
info "Deploy path : $DEPLOY_DIR"
info "Backups     : $BACKUP_DIR"

# ─────────────────────────────────────────────────────────────────────────────
step "5/9 — Clone repository"
if [ ! -d "$DEPLOY_DIR/.git" ]; then
  sudo -u "$DEPLOY_USER" git clone "$GIT_REPO" "$DEPLOY_DIR"
  success "Repository cloned"
else
  sudo -u "$DEPLOY_USER" bash -c "cd '$DEPLOY_DIR' && git pull origin $GIT_BRANCH"
  success "Repository updated"
fi

# ─────────────────────────────────────────────────────────────────────────────
step "6/9 — Setup .env"
if [ ! -f "$DEPLOY_DIR/.env" ]; then
  cp "$DEPLOY_DIR/.env.example" "$DEPLOY_DIR/.env"
  chown "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR/.env"
  chmod 600 "$DEPLOY_DIR/.env"

  echo ""
  echo -e "${Y}ACTION REQUIRED${N}: Edit the .env file before continuing:"
  echo "  nano $DEPLOY_DIR/.env"
  echo ""
  echo "  Set at minimum:"
  echo "    MYSQL_ROOT_PASSWORD, MYSQL_PASSWORD, REDIS_PASSWORD"
  echo "    JWT_SECRET (run: openssl rand -hex 64)"
  echo "    MAIL_PASSWORD"
  echo "    ADMIN_EMAIL, ADMIN_PASSWORD"
  echo ""
  read -r -p "Press ENTER when .env is configured..."
else
  success ".env already exists"
fi

# ─────────────────────────────────────────────────────────────────────────────
step "7/9 — Configure UFW firewall"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   comment "SSH"
ufw allow 80/tcp   comment "HTTP"
ufw allow 443/tcp  comment "HTTPS"
ufw --force enable
success "Firewall configured (22, 80, 443)"

# ─────────────────────────────────────────────────────────────────────────────
step "8/9 — Configure fail2ban"
cat > /etc/fail2ban/jail.d/promoteam.conf << 'F2BEOF'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port    = ssh
filter  = sshd
logpath = /var/log/auth.log
F2BEOF
systemctl enable fail2ban
systemctl restart fail2ban
success "fail2ban configured"

# ─────────────────────────────────────────────────────────────────────────────
step "9/9 — Configure log rotation"
cat > /etc/logrotate.d/promoteam << 'LREOF'
/var/log/promoteam/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    sharedscripts
}
LREOF
success "Log rotation configured"

# ─────────────────────────────────────────────────────────────────────────────
# Setup automatic DB backup cron
step "Setup automatic daily backup"
CRON_JOB="0 3 * * * $DEPLOY_USER bash $DEPLOY_DIR/deploy.sh --backup-only >> /var/log/promoteam/backup.log 2>&1"
(crontab -l 2>/dev/null | grep -v "deploy.sh --backup" ; echo "$CRON_JOB") | crontab -
success "Daily backup cron at 03:00"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo -e "${G}  Server provisioned for ${DOMAIN}${N}"
echo -e "${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo ""
echo "Next steps:"
echo ""
echo "  1. Edit .env if not done:"
echo "       nano $DEPLOY_DIR/.env"
echo ""
echo "  2. First deploy (builds images + SSL + seeds admin):"
echo "       cd $DEPLOY_DIR"
echo "       chmod +x deploy.sh"
echo "       ./deploy.sh --init"
echo ""
echo "  3. For subsequent deploys:"
echo "       ./deploy.sh"
echo ""
echo "  4. Useful commands:"
echo "       docker compose -f docker-compose.prod.yml ps"
echo "       docker compose -f docker-compose.prod.yml logs -f backend"
echo "       docker compose -f docker-compose.prod.yml logs -f nginx"
echo ""

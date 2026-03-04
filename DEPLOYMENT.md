# 🚀 Guide de déploiement Promoteam

## Déploiement local (développement)

### 1. Préalables
```bash
- Docker & Docker Compose
- Git
- Node.js 20+ (optionnel, pour le dev sans Docker)
```

### 2. Installation rapide

```bash
# Clone
git clone <repo> promoteam
cd promoteam

# Configuration
cp .env.example .env

# Setup (crée les dossiers et lance Docker)
bash setup.sh

# Accès
# Frontend:  http://localhost:5173
# Backend:   http://localhost:5000
# Admin:     http://localhost (via Nginx)
```

## Déploiement production (Debian 12)

### 1. Préparation serveur

```bash
# Update système
sudo apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Ajouter user à docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Certbot (SSL)
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Configuration DNS

```
promoteam.sauroraa.be  A  YOUR_SERVER_IP
```

### 3. Clone et configuration

```bash
# Clone repo
sudo git clone <repo> /opt/promoteam
cd /opt/promoteam

# Permissions
sudo chown -R $USER:$USER /opt/promoteam

# Copier .env
cp .env.example .env

# Éditer .env pour production
nano .env
```

### 4. Variables d'environnement production (.env)

```env
# Database
MYSQL_ROOT_PASSWORD=changez_mot_de_passe_complexe
MYSQL_PASSWORD=changez_mot_de_passe_complexe
DB_HOST=mariadb
DB_USER=promoteam
DB_PASSWORD=changez_mot_de_passe_complexe
DB_NAME=promoteam

# Redis
REDIS_PASSWORD=changez_mot_de_passe_complexe

# Backend
NODE_ENV=production
JWT_SECRET=changez_secret_jwt_complexe_avec_caracteres_speciaux
PORT=5000
DATABASE_URL=mysql://promoteam:changez_mot_de_passe_complexe@mariadb:3306/promoteam
REDIS_URL=redis://:changez_mot_de_passe_complexe@redis:6379

# Frontend
VITE_API_URL=https://promoteam.sauroraa.be/api
VITE_APP_URL=https://promoteam.sauroraa.be

# Domain
APP_DOMAIN=promoteam.sauroraa.be
APP_URL=https://promoteam.sauroraa.be
```

### 5. SSL/TLS (Let's Encrypt)

```bash
# Générer certificat
sudo certbot certonly --standalone -d promoteam.sauroraa.be

# Copier dans Docker volume
sudo cp /etc/letsencrypt/live/promoteam.sauroraa.be/fullchain.pem ./certbot/conf/
sudo cp /etc/letsencrypt/live/promoteam.sauroraa.be/privkey.pem ./certbot/conf/
sudo chown -R $USER:$USER ./certbot

# Auto-renew
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Vérifier
sudo systemctl status certbot.timer
```

### 6. Démarrage production

```bash
# Build images
docker-compose build --no-cache

# Démarrer services
docker-compose up -d

# Vérifier
docker-compose ps

# Logs
docker-compose logs -f
```

### 7. Vérification

```bash
# Health check
bash health-check.sh

# Frontend
curl -I https://promoteam.sauroraa.be

# Backend API
curl -I https://promoteam.sauroraa.be/api/health

# Database
docker exec promoteam-db mysql -u promoteam -p promoteam -e "SELECT 1;"
```

## Backups

### Backup manuel

```bash
# Database
docker exec promoteam-db mysqldump -u promoteam -p$MYSQL_PASSWORD promoteam | \
  gzip > backup-promoteam-$(date +%Y%m%d-%H%M%S).sql.gz

# Uploads
tar -czf backup-uploads-$(date +%Y%m%d-%H%M%S).tar.gz uploads/
```

### Backup automatisé (Cron)

```bash
# Ajouter cron job
crontab -e

# Daily backup à 2h du matin
0 2 * * * cd /opt/promoteam && docker exec promoteam-db mysqldump \
  -u promoteam -p$MYSQL_PASSWORD promoteam | \
  gzip > /backup/db-$(date +\%Y\%m\%d-\%H\%M\%S).sql.gz

# Cleanup vieux backups (> 30 jours)
0 3 * * * find /backup -name "db-*.sql.gz" -mtime +30 -delete
```

### Restauration

```bash
# Restore database
docker exec -i promoteam-db mysql -u promoteam -p$MYSQL_PASSWORD promoteam < backup.sql

# Restore uploads
tar -xzf backup-uploads-*.tar.gz
docker cp uploads promoteam-backend:/app/
```

## Monitoring

### Logs en temps réel

```bash
# Tous les services
docker-compose logs -f

# Un service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mariadb
docker-compose logs -f nginx
```

### Métriques

```bash
# Utilisation disque
df -h
du -sh uploads/ logs/

# Utilisation Docker
docker stats

# Logs système
journalctl -u docker -n 50 -f
```

## Troubleshooting

### Port déjà utilisé

```bash
# Tuer le processus
lsof -i :5000  # Backend
lsof -i :5173  # Frontend
lsof -i :3306  # Database
lsof -i :80    # Nginx

kill -9 <PID>
```

### Docker daemon erreur

```bash
sudo systemctl restart docker
docker-compose restart
```

### Database connection failed

```bash
# Vérifier
docker-compose ps
docker-compose logs mariadb

# Restart
docker-compose restart mariadb
```

### Nginx SSL erreur

```bash
# Vérifier certificats
sudo certbot certificates

# Renouveler manuellement
sudo certbot renew --force-renewal

# Restart Nginx
docker-compose restart nginx
```

## Mise à jour

```bash
# Pull latest code
git pull origin main

# Rebuild images
docker-compose build --no-cache

# Redémarrer
docker-compose up -d

# Vérifier
docker-compose ps
docker-compose logs -f
```

## Suppression complète

```bash
# Arrêter et supprimer tout
docker-compose down -v

# Supprimer données
sudo rm -rf /opt/promoteam

# Vérifier
docker volume ls
docker network ls
```

## Performance & Scaling

### Augmenter ressources

Éditer `docker-compose.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### Load balancing (futur)

```bash
# Multiple backend instances
services:
  backend1:
    build: ./backend
  backend2:
    build: ./backend
  
  nginx:
    upstream backend {
      server backend1:5000;
      server backend2:5000;
    }
```

## Support & Contact

Email: support@sauroraa.be  
Documentation: https://docs.sauroraa.be/promoteam

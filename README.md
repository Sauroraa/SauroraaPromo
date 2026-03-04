# 🚀 Promoteam - Plateforme SaaS de gestion de promoteurs

Plateforme complète et sécurisée pour gérer une équipe de promoteurs Instagram.

## 📋 Fonctionnalités

### 👥 Promoteurs
- ✅ Authentification sécurisée (JWT + Refresh tokens)
- ✅ Dashboard personnel
- ✅ Voir les missions actives
- ✅ Upload multi-images (max 10, 5MB chacune)
- ✅ Suivre l'historique des preuves
- ✅ Voir le classement en temps réel
- ✅ Points et récompenses

### 🔒 Admins
- ✅ Valider/Rejeter les preuves
- ✅ Attribuer les points
- ✅ Créer des missions
- ✅ Gérer les utilisateurs
- ✅ Générer codes d'invitation
- ✅ Analytics et statistiques
- ✅ Logs d'actions

## 🏗️ Stack technique

- **Frontend** : React 18 + Vite + Tailwind CSS
- **Backend** : Node.js + Express
- **Database** : MariaDB 11
- **Cache** : Redis
- **Infra** : Docker + Docker Compose + Nginx
- **OS** : Debian 12

## 🚀 Démarrage rapide

### Prérequis
- Docker & Docker Compose
- Git

### Installation

```bash
# 1. Cloner le projet
git clone <repo> promoteam
cd promoteam

# 2. Copier la configuration
cp .env.example .env

# 3. Éditer .env si nécessaire
nano .env

# 4. Démarrer les containers
docker-compose up -d

# 5. Vérifier le statut
docker-compose ps

# 6. Accéder à l'application
# Frontend: http://localhost:5173
# Backend API: http://localhost:5000/api
# Admin panel: http://promoteam.sauroraa.be/admin
```

## 🔐 Accès démo

**Email:** admin@promoteam.sauroraa.be  
**Mot de passe:** admin123

## 📁 Structure du projet

```
promoteam/
├── backend/                 # API Node.js/Express
│   ├── src/
│   │   ├── controllers/    # Logique métier
│   │   ├── routes/        # Routes API
│   │   ├── middleware/    # Auth, upload, rate limit
│   │   ├── services/      # Métier (preuves, points, missions)
│   │   ├── utils/         # JWT, hashing, logging
│   │   ├── config/        # DB, Redis
│   │   └── index.js       # Serveur
│   ├── package.json
│   └── Dockerfile
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── components/    # Réutilisables
│   │   ├── pages/        # Screens
│   │   ├── hooks/        # React Query
│   │   ├── lib/          # API client, store
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
├── database/
│   └── migrations/        # SQL schema
├── nginx/
│   └── conf/             # Configuration Nginx
├── docker-compose.yml    # Orchestration
├── .env.example         # Variables d'environnement
└── README.md
```

## 🔌 API Endpoints

### Auth
```
POST   /api/auth/register      # Inscription
POST   /api/auth/login         # Connexion
POST   /api/auth/logout        # Déconnexion
GET    /api/auth/me            # Utilisateur actuel
POST   /api/auth/refresh       # Refresh token
```

### Missions
```
GET    /api/missions           # Lister missions
GET    /api/missions/:id       # Détail mission
GET    /api/missions/:id/stats # Stats mission
```

### Preuves (Promoteurs)
```
POST   /api/proofs            # Upload preuves
GET    /api/proofs/my         # Mes preuves
GET    /api/proofs/:id        # Détail preuve
```

### Utilisateurs
```
GET    /api/users/me          # Mon profil
GET    /api/users/leaderboard # Classement
GET    /api/users/:id         # Profil utilisateur
PATCH  /api/users/me          # Mettre à jour profil
```

### Admin
```
GET    /api/admin/proofs                    # Toutes les preuves
GET    /api/admin/proofs/:id                # Détail preuve
POST   /api/admin/proofs/:id/approve        # Approuver
POST   /api/admin/proofs/:id/reject         # Rejeter

POST   /api/admin/missions                  # Créer mission
PATCH  /api/admin/missions/:id              # Modifier mission
DELETE /api/admin/missions/:id              # Supprimer mission

GET    /api/admin/stats                     # Stats globales
GET    /api/admin/activity                  # Activité par jour
GET    /api/admin/top-promoters             # Top promoteurs

GET    /api/admin/users                     # Tous utilisateurs
PATCH  /api/admin/users/:id/status          # Modifier statut

POST   /api/admin/invites                   # Générer codes
```

## 🔒 Sécurité

### Authentification
- ✅ Bcrypt pour hashage password
- ✅ JWT avec expiration 24h
- ✅ Refresh tokens (7 jours)
- ✅ Rate limiting (login: 5/min, API: 10/sec)

### Upload
- ✅ Validation type fichier
- ✅ Limite taille (5MB)
- ✅ Compression images (Sharp)
- ✅ Hash détection duplicatas
- ✅ Génération webp

### Réseau
- ✅ HTTPS/SSL obligatoire
- ✅ CORS configuré
- ✅ Helmet headers
- ✅ Nginx rate limiting
- ✅ CSP headers

### Database
- ✅ Prepared statements
- ✅ Foreign keys
- ✅ Indexes optimisés

## 📊 Database Schema

### Utilisateurs
- users (id, email, insta_username, password_hash, role, points_total, status)
- invites (code, created_by, used_by, expires_at)

### Missions
- missions (id, title, description, action_type, points_per_proof, deadline, active)

### Preuves
- proofs (id, user_id, mission_id, status, images_count, reviewed_by, reviewed_at)
- proof_images (id, proof_id, image_path, image_hash)

### Points & Logs
- points_history (id, user_id, proof_id, points, reason)
- admin_logs (id, admin_id, action, target_id, details)

## 🚀 Déploiement Production

### 1. Préparer le serveur (Debian 12)
```bash
# Update packages
sudo apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Cloner et configurer
```bash
# Clone repo
git clone <repo> /opt/promoteam
cd /opt/promoteam

# Configuration SSL (Let's Encrypt)
sudo certbot certonly --standalone -d promoteam.sauroraa.be

# Copier certs
sudo cp /etc/letsencrypt/live/promoteam.sauroraa.be/fullchain.pem ./certbot/conf/
sudo cp /etc/letsencrypt/live/promoteam.sauroraa.be/privkey.pem ./certbot/conf/

# Configuration env
nano .env
```

### 3. Démarrer
```bash
# Build and start
docker-compose up -d

# Check health
docker-compose ps
docker-compose logs -f

# Auto-renew SSL
sudo systemctl enable certbot.timer
```

### 4. Backups
```bash
# Daily DB backup
0 2 * * * docker exec promoteam-db mysqldump -u promoteam -p$MYSQL_PASSWORD promoteam | gzip > /backup/promoteam-$(date +\%Y\%m\%d).sql.gz

# Weekly backup to cloud
0 3 * * 0 rclone sync /backup/ s3:backups/promoteam/
```

## 📈 Performance

### Optimisations activées
- ✅ Redis caching (missions, leaderboard)
- ✅ Image compression WebP
- ✅ Gzip response compression
- ✅ Database indexes
- ✅ Lazy loading images
- ✅ Pagination admin

### Métriques
- Load time: < 2s
- API response: < 200ms
- Image upload: < 5s (avec compression)

## 🔮 Évolutions futures

1. **OCR** - Auto-détection commentaires dans screenshots
2. **AI Validation** - Validation automatique preuves
3. **Discord/Telegram** - Notifications missions
4. **Webhooks** - Intégrations externes
5. **2FA** - Double authentification
6. **Mobile App** - React Native

## 📝 License

Propriétaire - Sauroraa 2026

## 📞 Support

Email: support@sauroraa.be
Discord: [lien serveur]

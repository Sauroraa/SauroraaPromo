#!/bin/bash

# 🧪 Promoteam - Pre-Launch Checklist

echo "╔════════════════════════════════════════════╗"
echo "║   🧪 PROMOTEAM - PRE-LAUNCH CHECKLIST      ║"
echo "╚════════════════════════════════════════════╝"

echo ""
echo "📋 Vérification des fichiers..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1"
    else
        echo -e "${RED}❌${NC} $1 (MANQUANT)"
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅${NC} $1/"
    else
        echo -e "${RED}❌${NC} $1/ (MANQUANT)"
    fi
}

# Backend files
echo "Backend files:"
check_file "backend/package.json"
check_file "backend/Dockerfile"
check_file "backend/src/index.js"
check_file "backend/src/config/db.js"
check_file "backend/src/config/redis.js"
check_file "backend/src/middleware/auth.js"

# Frontend files
echo ""
echo "Frontend files:"
check_file "frontend/package.json"
check_file "frontend/Dockerfile"
check_file "frontend/src/App.jsx"
check_file "frontend/src/main.jsx"
check_file "frontend/index.html"

# Database
echo ""
echo "Database files:"
check_file "database/migrations/001-init.sql"

# Nginx
echo ""
echo "Nginx files:"
check_file "nginx/conf/nginx.conf"
check_file "nginx/conf/promoteam.conf"

# Config
echo ""
echo "Configuration files:"
check_file ".env.example"
check_file "docker-compose.yml"
check_file ".gitignore"

# Documentation
echo ""
echo "Documentation files:"
check_file "README.md"
check_file "DEPLOYMENT.md"
check_file "OVERVIEW.md"
check_file "ARCHITECTURE.yml"

# Scripts
echo ""
echo "Scripts:"
check_file "setup.sh"
check_file "deploy.sh"
check_file "health-check.sh"

# Directories
echo ""
echo "Directory structure:"
check_dir "backend/src/controllers"
check_dir "backend/src/routes"
check_dir "backend/src/middleware"
check_dir "backend/src/services"
check_dir "backend/src/utils"
check_dir "frontend/src/components"
check_dir "frontend/src/pages"
check_dir "frontend/src/hooks"
check_dir "frontend/src/lib"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Configuration Checklist:"
echo ""
echo "[ ] .env.example exists"
echo "[ ] .gitignore configured"
echo "[ ] docker-compose.yml valid"
echo "[ ] Backend package.json has all dependencies"
echo "[ ] Frontend package.json has all dependencies"
echo "[ ] Database migrations present"
echo "[ ] Nginx configuration complete"
echo "[ ] All documentation files present"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Ready to start:"
echo ""
echo "1. Development:"
echo "   bash setup.sh"
echo ""
echo "2. Production:"
echo "   cp .env.example .env"
echo "   # Configure .env"
echo "   docker-compose up -d"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Pre-launch checklist complete!"
echo ""

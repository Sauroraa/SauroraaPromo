# 🛠️ Promoteam - Troubleshooting Guide

## 📋 Table of Contents

1. [Common Issues](#common-issues)
2. [Backend Issues](#backend-issues)
3. [Frontend Issues](#frontend-issues)
4. [Database Issues](#database-issues)
5. [Docker Issues](#docker-issues)
6. [Authentication Issues](#authentication-issues)
7. [Performance Issues](#performance-issues)
8. [Deployment Issues](#deployment-issues)

---

## Common Issues

### Issue: Services won't start

**Symptoms:** `docker-compose up` fails or containers crash immediately

**Solutions:**

```bash
# 1. Check Docker daemon
docker ps

# 2. View error logs
docker-compose logs

# 3. Check ports are free
lsof -i :3306   # MariaDB
lsof -i :6379   # Redis
lsof -i :5000   # Backend
lsof -i :5173   # Frontend
lsof -i :80     # Nginx

# 4. Remove containers and try again
docker-compose down -v
docker-compose up -d

# 5. Check disk space
df -h
```

**Prevention:**
- Ensure Docker daemon is running
- Close other services using ports 3000-9000
- Allocate sufficient disk space (min 10GB)

---

## Backend Issues

### Issue: Backend crashes immediately

**Symptoms:** `docker-compose logs backend` shows errors

**Solutions:**

```bash
# 1. Check environment variables
cat .env

# 2. Verify database connection
docker-compose exec backend npm run test:db

# 3. Check if port is in use
lsof -i :5000

# 4. Review startup logs
docker-compose logs -f backend --tail=50

# 5. Rebuild backend
docker-compose build --no-cache backend
docker-compose up -d backend
```

**Common causes:**
- Missing `.env` file
- Database not ready
- Port already in use
- Invalid environment variables

### Issue: 500 errors from API

**Symptoms:** Requests return HTTP 500

**Solutions:**

```bash
# 1. Check backend logs
docker-compose logs backend | grep -i error

# 2. Access backend console
docker-compose exec backend npm run dev

# 3. Check database logs
docker-compose logs mariadb

# 4. Verify database tables exist
docker-compose exec mariadb mysql -u user -p promoteam -e "SHOW TABLES;"

# 5. Check Redis connection
docker-compose exec redis redis-cli ping

# 6. Test specific endpoint
curl http://localhost:5000/health
```

**Common causes:**
- Database migrations not run
- Redis connection failed
- Invalid JWT tokens
- Unhandled exceptions

### Issue: Requests timeout (504 Gateway Timeout)

**Symptoms:** API requests take too long or timeout

**Solutions:**

```bash
# 1. Check backend performance
docker stats backend

# 2. Check memory usage
docker-compose exec backend ps aux

# 3. Review slow queries in database
docker-compose exec mariadb mysql -u user -p promoteam \
  -e "SET GLOBAL slow_query_log = 'ON'; SELECT * FROM mysql.slow_log;"

# 4. Increase timeout in nginx config
# Edit: nginx/conf/promoteam.conf
# Add: proxy_connect_timeout 30s;
#      proxy_send_timeout 30s;
#      proxy_read_timeout 30s;

# 5. Optimize database indexes
docker-compose exec backend npm run db:analyze
```

**Common causes:**
- Large database queries
- Missing indexes
- Memory constraints
- Network issues

### Issue: "EADDRINUSE: address already in use"

**Symptoms:** Backend won't start due to port conflict

**Solutions:**

```bash
# Find what's using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or change the port in .env
echo "PORT=5001" >> .env

# Or change Docker mapping
# Edit docker-compose.yml:
# ports:
#   - "5001:5000"
```

### Issue: "Cannot find module" errors

**Symptoms:** Backend crashes with module not found

**Solutions:**

```bash
# Reinstall dependencies
docker-compose exec backend npm ci

# Clear npm cache
docker-compose exec backend npm cache clean --force

# Rebuild node_modules
docker-compose down backend
docker-compose build --no-cache backend
docker-compose up -d backend

# Check package.json
cat backend/package.json | grep dependencies
```

---

## Frontend Issues

### Issue: Frontend won't load (blank page)

**Symptoms:** Browser shows blank page or 404

**Solutions:**

```bash
# 1. Check frontend service
docker-compose ps frontend

# 2. Check frontend logs
docker-compose logs frontend

# 3. Check if built correctly
docker-compose exec frontend ls -la dist/

# 4. Check network requests
# Open browser DevTools → Network tab
# Look for failed requests

# 5. Rebuild frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend

# 6. Check Nginx config
docker-compose exec nginx cat /etc/nginx/conf.d/default.conf
```

**Common causes:**
- Build failed
- Incorrect API URL
- Nginx routing issue
- Network connectivity

### Issue: API calls fail with CORS error

**Symptoms:** Browser console: "Access-Control-Allow-Origin" error

**Solutions:**

```bash
# 1. Check backend CORS config
docker-compose exec backend grep -n "CORS\|cors" src/index.js

# 2. Verify CORS allowed origins in .env
cat .env | grep -i "FRONTEND_URL\|ALLOWED_ORIGIN"

# 3. Check Nginx headers
docker-compose exec nginx grep -n "Access-Control" /etc/nginx/conf.d/default.conf

# 4. Test API directly
curl -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  http://localhost:5000/api/missions

# 5. Check if backend is running
curl http://localhost:5000/health
```

**Solutions:**
```bash
# Update backend CORS
# Edit: backend/src/index.js
// Add to app.use(cors()):
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

# Restart backend
docker-compose restart backend
```

### Issue: Login redirects to login indefinitely

**Symptoms:** Can't stay logged in, redirected after refresh

**Solutions:**

```bash
# 1. Check if tokens are stored
# Open browser DevTools → Application → LocalStorage
# Look for 'auth-store' key

# 2. Check token expiry
# The token should have exp claim
# js: jwt_decode(token)

# 3. Verify backend returns token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@promoteam.com","password":"..."}'

# 4. Check refresh token endpoint
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. Clear localStorage and try again
# DevTools → Application → LocalStorage → Clear All
```

**Common causes:**
- JWT secret mismatch
- Token expired
- Refresh token not working
- LocalStorage cleared

### Issue: Images don't load from backend

**Symptoms:** Image URLs return 404 or CORS error

**Solutions:**

```bash
# 1. Check if uploads directory exists
docker-compose exec backend ls -la uploads/

# 2. Check if images are uploaded
docker-compose exec backend ls -la uploads/proofs/

# 3. Verify Nginx serves images
curl http://localhost/uploads/proofs/example.webp

# 4. Check Nginx uploads config
docker-compose exec nginx grep -A5 "uploads" /etc/nginx/conf.d/default.conf

# 5. Set correct permissions
docker-compose exec backend chmod -R 755 uploads/

# 6. Check frontend image URLs
# DevTools → Network → filter by images
# Check the exact URL being requested
```

**Common causes:**
- Upload directory missing
- Wrong permissions
- Nginx not configured for uploads
- Path mismatch between backend/frontend

---

## Database Issues

### Issue: "Connection refused" error

**Symptoms:** Backend can't connect to MariaDB

**Solutions:**

```bash
# 1. Check if MariaDB is running
docker-compose ps mariadb

# 2. Check MariaDB logs
docker-compose logs mariadb

# 3. Test connection
docker-compose exec mariadb mysql -u root -p -e "SELECT VERSION();"

# 4. Wait for MariaDB to be ready
docker-compose up -d mariadb
sleep 20
docker-compose logs mariadb | grep -i "ready"

# 5. Verify connection string
cat .env | grep DATABASE_URL

# 6. Restart MariaDB
docker-compose restart mariadb

# 7. Check Docker network
docker network ls
docker inspect promoteam-network
```

**Common causes:**
- MariaDB not started
- Still initializing
- Wrong credentials
- Network issue

### Issue: Table doesn't exist

**Symptoms:** "Table 'promoteam.users' doesn't exist"

**Solutions:**

```bash
# 1. Check if migrations ran
docker-compose logs mariadb | grep "importing"

# 2. List tables
docker-compose exec mariadb mysql -u user -p promoteam -e "SHOW TABLES;"

# 3. Run migrations manually
docker-compose exec mariadb mysql -u user -p promoteam \
  < database/migrations/001-init.sql

# 4. Check migration file exists
ls -la database/migrations/

# 5. Recreate database
docker-compose exec mariadb mysql -u root -p -e \
  "DROP DATABASE promoteam; CREATE DATABASE promoteam;"

# 6. Restart containers
docker-compose down
docker-compose up -d
```

**Common causes:**
- Migrations not run on startup
- Wrong database name
- Permission denied
- Migration file deleted

### Issue: Slow database queries

**Symptoms:** API endpoints return slowly

**Solutions:**

```bash
# 1. Enable slow query log
docker-compose exec mariadb mysql -u root -p -e \
  "SET GLOBAL slow_query_log = 'ON'; SET GLOBAL long_query_time = 2;"

# 2. Find slow queries
docker-compose exec mariadb mysql -u user -p promoteam \
  -e "SELECT * FROM mysql.slow_log ORDER BY query_time DESC LIMIT 10;"

# 3. Analyze query plans
docker-compose exec mariadb mysql -u user -p promoteam \
  -e "EXPLAIN SELECT * FROM proofs WHERE user_id = 1;"

# 4. Check indexes
docker-compose exec mariadb mysql -u user -p promoteam \
  -e "SHOW INDEXES FROM proofs;"

# 5. Add missing indexes
docker-compose exec mariadb mysql -u user -p promoteam \
  -e "ALTER TABLE proofs ADD INDEX idx_user_created (user_id, created_at);"

# 6. Optimize tables
docker-compose exec mariadb mysql -u user -p promoteam \
  -e "OPTIMIZE TABLE proofs; OPTIMIZE TABLE users;"
```

**Common causes:**
- Missing indexes
- N+1 queries
- Full table scans
- No query caching

### Issue: Disk space full

**Symptoms:** Error: "Disk full", can't write to database

**Solutions:**

```bash
# 1. Check disk usage
docker exec <container> df -h

# 2. Find large files
docker exec <container> du -sh /* | sort -h | tail -10

# 3. Clear old logs
docker exec mariadb rm -f /var/log/mysql/*.log

# 4. Clear uploads
docker exec backend rm -f uploads/proofs/*.webp

# 5. Export database and clear
docker-compose exec mariadb mysqldump -u user -p promoteam > backup.sql
docker-compose exec mariadb mysql -u user -p promoteam -e \
  "TRUNCATE TABLE proofs; TRUNCATE TABLE proof_images;"

# 6. Check volume size in docker-compose.yml
# Consider increasing or moving to larger disk
```

---

## Docker Issues

### Issue: Docker daemon not running

**Symptoms:** "Cannot connect to Docker daemon"

**Solutions:**

**Linux:**
```bash
# Start Docker
sudo systemctl start docker

# Enable on boot
sudo systemctl enable docker

# Check status
sudo systemctl status docker
```

**Mac:**
```bash
# Start Docker Desktop or
open -a Docker

# Check
docker ps
```

**Windows:**
```powershell
# Start Docker Desktop from Start Menu
# Or enable in Settings → Apps → Apps & Features

# Check
docker ps
```

### Issue: "docker-compose: command not found"

**Symptoms:** Command not recognized

**Solutions:**

```bash
# Check installation
docker-compose --version
# or
docker compose version

# If not installed, install it
# Linux:
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Mac: Already included with Docker Desktop

# Windows: Already included with Docker Desktop
```

### Issue: Containers keep crashing

**Symptoms:** `docker-compose logs` shows restart loop

**Solutions:**

```bash
# 1. Check logs for errors
docker-compose logs -f

# 2. Check resource limits
docker stats

# 3. Increase memory allocation
# Edit docker-compose.yml:
# deploy:
#   resources:
#     limits:
#       memory: 2G

# 4. Check for infinite loops
docker-compose exec <service> ps aux

# 5. Restart with verbose logging
docker-compose up -d --verbose

# 6. Check Docker events
docker events --filter type=container
```

### Issue: Volume permission denied

**Symptoms:** "Permission denied" when accessing volumes

**Solutions:**

```bash
# Fix permissions
docker-compose exec <service> chmod -R 777 /app

# Or use user mapping
# Edit docker-compose.yml:
# services:
#   backend:
#     user: "${UID}:${GID}"

# Set environment variables
export UID=$(id -u)
export GID=$(id -g)
docker-compose up -d
```

---

## Authentication Issues

### Issue: "Invalid token" error

**Symptoms:** API returns 401 Unauthorized

**Solutions:**

```bash
# 1. Check JWT secret matches
cat .env | grep JWT_SECRET

# 2. Verify token format
# Should be: "Bearer <token>"

# 3. Decode token to check expiry
# Use: https://jwt.io
# Paste token (without "Bearer ")

# 4. Get a new token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@promoteam.com","password":"password"}'

# 5. Check token in Redis
docker-compose exec redis redis-cli
> KEYS user:*
> GET user:<user_id>:token
```

**Common causes:**
- JWT secret changed
- Token expired
- Token malformed
- Different secret between services

### Issue: Can't login

**Symptoms:** Login fails with 401 or 500

**Solutions:**

```bash
# 1. Check admin user exists
docker-compose exec mariadb mysql -u user -p promoteam \
  -e "SELECT * FROM users WHERE role = 'admin';"

# 2. Reset admin password
docker-compose exec mariadb mysql -u user -p promoteam \
  -e "UPDATE users SET password_hash = '$2a$10$...' WHERE role = 'admin';"

# 3. Check bcrypt hashing
# Use: https://bcrypt-generator.com/
# Or backend command:
docker-compose exec backend node -e \
  "const bcrypt = require('bcryptjs'); bcrypt.hash('password', 10).then(h => console.log(h));"

# 4. Test login endpoint directly
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Content-Length: <size>" \
  -d '{"email":"admin@promoteam.com","password":"password"}'

# 5. Check request body format
# Ensure no extra spaces or newlines
```

### Issue: "Invalid invite code"

**Symptoms:** Registration fails with invalid code

**Solutions:**

```bash
# 1. Check if invite exists
docker-compose exec mariadb mysql -u user -p promoteam \
  -e "SELECT * FROM invites WHERE code = 'YOUR_CODE';"

# 2. Check if expired
docker-compose exec mariadb mysql -u user -p promoteam \
  -e "SELECT * FROM invites WHERE expires_at > NOW();"

# 3. Generate new invite
# Use admin panel or:
curl -X POST http://localhost:5000/api/admin/invites \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"count":5}'

# 4. Check invite format
# Should be UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## Performance Issues

### Issue: Site slow to load

**Symptoms:** Pages take >3s to load

**Solutions:**

```bash
# 1. Check response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5000/api/missions

# 2. Check asset sizes
docker-compose exec frontend ls -lh dist/

# 3. Enable gzip compression
# Already enabled in Nginx

# 4. Check Redis is running
docker-compose exec redis redis-cli ping

# 5. Monitor performance
docker stats

# 6. Check database query times
docker-compose logs mariadb | grep "Query_time"

# 7. Increase cache duration
# Edit services/pointsService.js
# Change: redis.setex(..., 3600, ...)
```

### Issue: High memory usage

**Symptoms:** Container uses >1GB RAM

**Solutions:**

```bash
# 1. Check what's using memory
docker exec <container> ps aux --sort=-%mem | head -5

# 2. Check for memory leaks
docker stats <container>  # Watch for steadily increasing

# 3. Restart container
docker-compose restart <container>

# 4. Limit memory
# Edit docker-compose.yml:
# deploy:
#   resources:
#     limits:
#       memory: 1G
#     reservations:
#       memory: 512M

# 5. Clear caches
docker-compose exec redis redis-cli FLUSHALL

# 6. Check for circular references
docker-compose exec backend npm audit
```

### Issue: High CPU usage

**Symptoms:** Container uses >80% CPU

**Solutions:**

```bash
# 1. Find expensive processes
docker exec <container> top -n 1

# 2. Check for infinite loops
docker exec <container> ps aux

# 3. Check for active connections
docker exec mariadb mysqladmin -u root -p processlist

# 4. Kill long-running queries
docker exec mariadb mysqladmin -u root -p kill <id>

# 5. Check for background tasks
docker-compose logs <container> | grep -i "running\|processing"

# 6. Optimize code
# Profile using: curl --profile-time
```

---

## Deployment Issues

### Issue: Docker build fails

**Symptoms:** `docker-compose build` fails with errors

**Solutions:**

```bash
# 1. Check build logs
docker-compose build --verbose <service>

# 2. Clean and rebuild
docker system prune -a --volumes -f
docker-compose build --no-cache <service>

# 3. Check Dockerfile
cat backend/Dockerfile

# 4. Test Dockerfile locally
docker build -f backend/Dockerfile -t test ./backend

# 5. Check for file size limits
ls -lh backend/node_modules/

# 6. Verify dependencies
cat backend/package.json
npm ci --dry-run
```

### Issue: SSL certificate error

**Symptoms:** "Untrusted certificate" or connection refused

**Solutions:**

```bash
# 1. Check certificate files
ls -la nginx/certs/

# 2. Test certificate
openssl x509 -in nginx/certs/cert.pem -text -noout

# 3. Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365

# 4. Update Nginx config
# Edit: nginx/conf/promoteam.conf
# ssl_certificate /etc/nginx/certs/cert.pem;
# ssl_certificate_key /etc/nginx/certs/key.pem;

# 5. Test SSL
openssl s_client -connect localhost:443

# 6. Force HTTP→HTTPS redirect
# Already done in promoteam.conf
```

### Issue: Deployment script fails

**Symptoms:** `deploy.sh` returns errors

**Solutions:**

```bash
# 1. Check script permissions
ls -la deploy.sh
chmod +x deploy.sh

# 2. Run with verbose mode
bash -x deploy.sh

# 3. Check required commands exist
which git
which docker
which docker-compose

# 4. Check SSH key exists (for Git)
ls ~/.ssh/id_rsa

# 5. Verify backup location has space
df -h /backups/

# 6. Check Git credentials
git config --global user.email
git config --global user.name
```

---

## Debugging Tools

### Useful debugging commands

```bash
# Backend debugging
docker-compose exec backend npm run lint
docker-compose exec backend npm test

# Database debugging
docker-compose exec mariadb mysql -u user -p promoteam -e "CHECK TABLE users;"

# Network debugging
docker-compose exec backend ping -c 1 mariadb
docker-compose exec backend curl http://mariadb:3306

# File system debugging
docker-compose exec backend du -sh *
docker-compose exec backend find . -name "*.log" -newer="-1d"
```

---

## Getting Help

If your issue isn't listed:

1. **Check logs:** `docker-compose logs -f`
2. **Search:** Use error message in Google
3. **Stack Overflow:** Tag: docker, docker-compose, nodejs, react
4. **GitHub Issues:** Check repository issues
5. **Discord/Community:** Ask in communities

---

**Last Updated:** 2024
**Version:** 1.0

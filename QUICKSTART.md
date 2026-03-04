# 🚀 Promoteam - Quick Start (5 Minutes)

## ⏱️ TL;DR - Get Running Now

```bash
# 1. Clone/navigate to project
cd promoteam

# 2. Run setup (creates all infrastructure)
bash setup.sh

# 3. Access the app
# Frontend: http://localhost:5173
# Backend:  http://localhost:5000

# 4. Login with admin account
# Email:    admin@promoteam.com
# Password: (check .env after setup)
```

**That's it! 🎉 Your app is running.**

---

## 📊 What Just Happened?

When you ran `bash setup.sh`, it:

1. ✅ Created all required directories
2. ✅ Copied `.env` from template
3. ✅ Started 5 Docker services:
   - MariaDB (Database)
   - Redis (Cache)
   - Backend API
   - Frontend UI
   - Nginx (Reverse Proxy)
4. ✅ Initialized database with schema
5. ✅ Created admin user
6. ✅ Set up volumes for persistence

---

## 🌐 Access Your App

### Frontend (React UI)
```
URL: http://localhost:5173
✅ You can see the login page
✅ List of missions
✅ User dashboard
```

### Backend API
```
URL: http://localhost:5000
✅ Health check: curl http://localhost:5000/health
✅ API documentation in README.md
```

### Database
```
Host: localhost:3306
User: (from .env)
Database: promoteam
```

### Redis Cache
```
Host: localhost:6379
Password: (from .env)
```

---

## 👤 Default Credentials

**Admin User** (automatically created):
```
Email:    admin@promoteam.com
Password: (set in .env ADMIN_PASSWORD)
```

**Access Levels:**
- ✅ Admin: Full access (all features)
- ✅ Promoter: Limited access (submit proofs, view missions)
- ⏳ New users: Need invite code to register

---

## 🧪 Test It Out

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@promoteam.com",
    "password": "your_password_here"
  }'
```

### View Missions
```bash
curl http://localhost:5000/api/missions
```

### Check System Health
```bash
bash health-check.sh
```

---

## 📁 Project Structure

```
promoteam/
├── backend/          ← Node.js API
├── frontend/         ← React UI
├── database/         ← SQL schema
├── nginx/            ← Reverse proxy
├── docker-compose.yml ← 5 services
├── setup.sh          ← Quick setup
└── ...docs...        ← Full documentation
```

---

## 🔧 Common Commands

### View All Services
```bash
docker-compose ps
```

### Check Logs
```bash
docker-compose logs -f              # All logs
docker-compose logs -f backend      # Backend only
docker-compose logs -f mariadb      # Database only
```

### Stop Services
```bash
docker-compose down
```

### Restart Services
```bash
docker-compose restart
```

### Clean Everything
```bash
docker-compose down -v              # Remove volumes too
```

---

## 📱 Available Pages

### For Promoters
- **Login** - Authentication
- **Dashboard** - Overview & active missions
- **Missions** - Browse available missions
- **Upload** - Submit proofs
- **Proofs** - View your submissions
- **Profile** - Personal stats
- **Leaderboard** - Global rankings

### For Admins
- **Admin Dashboard** - KPIs & overview
- **Proof Review** - Approve/reject submissions
- **Mission Management** - Create/edit missions
- **Plus all promoter pages**

---

## 🔑 Key Features

✅ **User Management**
- Registration with invite codes
- Role-based access (promoter/admin)
- Profile management

✅ **Mission System**
- Create missions (admin)
- Submit proofs (promoters)
- Multi-image uploads
- Approval workflow

✅ **Points & Ranking**
- Point allocation per approved proof
- Global leaderboard
- Points history tracking

✅ **Security**
- JWT authentication
- Rate limiting
- Image validation
- Secure storage

---

## ⚠️ Common Issues & Fixes

### "docker-compose: command not found"
```bash
# Install Docker Desktop (includes compose)
# Or use: docker compose up -d
```

### "Connection refused" error
```bash
# Wait for services to start (30 seconds)
docker-compose logs mariadb | grep "ready"
```

### "Port already in use"
```bash
# Edit .env or docker-compose.yml
# Change ports to unused ones (e.g., 5001, 5174)
```

### "Login fails"
```bash
# Check .env has ADMIN_PASSWORD set
cat .env | grep ADMIN_PASSWORD

# Recreate database
docker-compose exec mariadb mysql -u admin -p promoteam \
  < database/migrations/001-init.sql
```

---

## 📖 Learn More

**After setup, read these in order:**

1. **README.md** (30 min)
   - Full project overview
   - All features explained
   - API endpoints

2. **DEPLOYMENT.md** (1 hour)
   - Production setup
   - SSL configuration
   - Monitoring

3. **SECURITY.md** (30 min)
   - Best practices
   - Pre-launch checklist

4. **TROUBLESHOOTING.md** (reference)
   - Common issues & fixes
   - Debugging guide

---

## ✅ Next Steps

1. **Verify It Works**
   ```bash
   bash health-check.sh
   ```

2. **Read Full Documentation**
   - Open `README.md` for complete overview
   - Check `PROJECT_INDEX.md` for file reference

3. **Explore the Code**
   - Backend API: `backend/src/controllers/`
   - Frontend Pages: `frontend/src/pages/`
   - Database: `database/migrations/001-init.sql`

4. **Make Your First Change**
   - Edit a page in `frontend/src/pages/`
   - Hot reload will refresh automatically
   - Changes appear instantly

5. **Deploy to Production** (when ready)
   - Read `DEPLOYMENT.md`
   - Run: `bash deploy.sh`
   - Monitor: `bash health-check.sh`

---

## 🎯 Success Indicators

When everything is working, you should see:

✅ Services running:
```bash
$ docker-compose ps
NAME         STATUS    PORTS
mariadb      Up        3306
redis        Up        6379
backend      Up        5000
frontend     Up        5173
nginx        Up        80, 443
```

✅ Frontend loads:
- http://localhost:5173 shows login page

✅ API responds:
- `curl http://localhost:5000/health` returns 200

✅ Login works:
- Can log in with admin credentials

✅ Database initialized:
- Tables exist and have data

---

## 🚀 You're Ready!

**Your production-ready SaaS platform is running!**

### What's Included:
- ✅ Full backend API (25+ endpoints)
- ✅ Beautiful React frontend (9 pages)
- ✅ Secure database (7 tables)
- ✅ Image optimization
- ✅ Rate limiting
- ✅ User authentication
- ✅ Admin dashboard
- ✅ Docker containerization
- ✅ SSL/TLS ready
- ✅ Production deployment guide

### Next:
- Explore the code
- Read the documentation
- Deploy to production when ready
- Add your own features

---

## 📞 Need Help?

| Question | Answer |
|----------|--------|
| How do I deploy? | → Read `DEPLOYMENT.md` |
| Something broke? | → Check `TROUBLESHOOTING.md` |
| Security checklist? | → Review `SECURITY.md` |
| File reference? | → See `PROJECT_INDEX.md` |
| API endpoints? | → Check `README.md` |
| Testing? | → Read `TESTING.md` |

---

**Congratulations! 🎉**

Your complete SaaS platform is up and running!

**Total Time:** 5 minutes ⏱️
**Files:** 65+
**Lines of Code:** 15,000+
**Status:** ✅ Production Ready

Now explore, build, and scale! 🚀


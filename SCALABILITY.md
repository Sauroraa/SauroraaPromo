# 🚀 Promoteam - Scalability & Future Architecture

## 📊 Architecture actuelle

```
┌─────────────────────────────────────┐
│         Nginx (Reverse Proxy)       │
│  - SSL/TLS Termination              │
│  - Load Balancing (upcoming)         │
│  - Rate Limiting                    │
│  - Static Files Serving             │
└──────────────────┬──────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
    ┌───▼──┐  ┌───▼──┐  ┌───▼──┐
    │Front │  │Back  │  │Redis │
    │end   │  │end   │  │Cache │
    │React │  │Node  │  │Layer │
    └───┬──┘  └───┬──┘  └──────┘
        │         │
        │    ┌────▼────────┐
        │    │  MariaDB    │
        │    │  Database   │
        └────┤    (1GB)    │
             └─────────────┘

Current: Monolithic single-server
Status: Development/MVP
```

---

## 🔄 Phase 2: Scalabilité (3-6 mois)

### Objectifs
- 10,000+ utilisateurs actifs
- 99.9% uptime
- <200ms latency p95

### Architecture proposée

```
┌────────────────────────────────────────┐
│        CloudFlare CDN                  │
│  - DDoS Protection                     │
│  - Global Distribution                 │
│  - Cache Layer                         │
└────────────────────┬───────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
    ┌───▼─────┐  ┌──▼──────┐  ┌─▼──────┐
    │ Nginx   │  │ Nginx   │  │ Nginx  │
    │Load Bal │  │ LB 2    │  │ LB 3   │
    │Zone 1   │  │ Zone 2  │  │ Zone 3 │
    └──┬──────┘  └──┬──────┘  └───┬────┘
       │            │             │
   ┌───┴────────────┼─────────────┤
   │                │             │
   │          ┌─────▼─────┐ ┌────▼────┐
   │          │ Backend   │ │ Backend  │
   │          │ Instance 1│ │Instance 2│
   │          └─────┬─────┘ └────┬────┘
   │                │            │
   │       ┌────────┴────────────┤
   │       │                     │
   │  ┌────▼──────────┐   ┌─────▼────┐
   │  │Redis Cluster  │   │Redis      │
   │  │ + Replica      │   │Replica 2  │
   │  └────┬──────────┘   └──────┬────┘
   │       │                    │
   └───────┼────────────────────┘
           │
    ┌──────▼──────────────┐
    │  MariaDB Cluster    │
    │  - Master           │
    │  - Replica 1        │
    │  - Replica 2        │
    │  - Read Pool        │
    └─────────────────────┘

Status: Planned for Q3 2024
```

---

## 🗄️ Phase 1: Database Optimization (1-2 mois)

### Problème actuel
- Single MariaDB instance (point de défaillance)
- Pas de réplication
- Pas de partitioning
- Toutes les requêtes au même serveur

### Solutions

#### 1. Master-Replica Architecture

```yaml
# docker-compose-prod.yml addition

services:
  mariadb-master:
    image: mariadb:11
    environment:
      SERVER_ID: 1
      MYSQL_REPLICATION_MODE: master
      MYSQL_REPLICATION_USER: replicator
      MYSQL_REPLICATION_PASSWORD: strong_password
    volumes:
      - master_data:/var/lib/mysql
      - ./mysql/master.cnf:/etc/mysql/conf.d/master.cnf

  mariadb-replica-1:
    image: mariadb:11
    environment:
      SERVER_ID: 2
      MYSQL_MASTER_SERVICE_NAME: mariadb-master
      MYSQL_REPLICATION_USER: replicator
      MYSQL_REPLICATION_PASSWORD: strong_password
    depends_on:
      - mariadb-master

  mariadb-replica-2:
    image: mariadb:11
    environment:
      SERVER_ID: 3
      MYSQL_MASTER_SERVICE_NAME: mariadb-master
    depends_on:
      - mariadb-master
```

#### 2. Read-Write Splitting

```javascript
// services/db.js - Updated

const connections = {
  master: createPool({
    host: process.env.MYSQL_MASTER_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  }),
  replicas: [
    createPool({ host: 'replica-1' }),
    createPool({ host: 'replica-2' }),
    createPool({ host: 'replica-3' })
  ]
};

function getWriteConnection() {
  return connections.master;  // Toujours au master
}

function getReadConnection() {
  // Round-robin sur replicas
  const replica = connections.replicas[
    Math.floor(Math.random() * connections.replicas.length)
  ];
  return replica;
}

// Usage
app.get('/api/leaderboard', async (req, res) => {
  const conn = getReadConnection();  // Read
  const data = await conn.query('SELECT * FROM users ORDER BY points_total');
  res.json(data);
});

app.post('/api/auth/login', async (req, res) => {
  const conn = getWriteConnection();  // Write
  await conn.query('UPDATE users SET last_login = NOW() WHERE id = ?', [userId]);
});
```

#### 3. Query Optimization

```sql
-- Ajouter des indexes stratégiques
ALTER TABLE proofs 
  ADD INDEX idx_user_status (user_id, status),
  ADD INDEX idx_created_at (created_at DESC),
  ADD INDEX idx_mission_status (mission_id, status);

ALTER TABLE points_history
  ADD INDEX idx_user_date (user_id, created_at DESC);

-- Materialized view pour leaderboard
CREATE TABLE leaderboard_cache (
  user_id INT,
  insta_username VARCHAR(255),
  points_total INT,
  rank INT,
  last_updated TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY (rank)
);

-- Rafraîchir toutes les heures
EVENT refresh_leaderboard
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
  DELETE FROM leaderboard_cache;
  INSERT INTO leaderboard_cache
  SELECT 
    u.id,
    u.insta_username,
    u.points_total,
    ROW_NUMBER() OVER (ORDER BY u.points_total DESC) as rank,
    NOW()
  FROM users u;
END;
```

---

## ⚡ Phase 2: Backend Scaling (2-3 mois)

### Problème actuel
- Single Node.js instance
- Pas de load balancing
- Pas de session sharing
- Memory leak risk

### Solutions

#### 1. Horizontal Scaling

```yaml
# docker-compose-prod.yml

version: '3.8'

services:
  backend-1:
    build: ./backend
    environment:
      INSTANCE_ID: 1
      PORT: 5000
    ports:
      - "5001:5000"

  backend-2:
    build: ./backend
    environment:
      INSTANCE_ID: 2
      PORT: 5000
    ports:
      - "5002:5000"

  backend-3:
    build: ./backend
    environment:
      INSTANCE_ID: 3
      PORT: 5000
    ports:
      - "5003:5000"

  nginx-loadbalancer:
    image: nginx:alpine
    volumes:
      - ./nginx/lb.conf:/etc/nginx/conf.d/default.conf
    ports:
      - "5000:80"
```

#### 2. Load Balancing Config

```nginx
# nginx/lb.conf

upstream backend {
  least_conn;  # Load balancing algorithm
  server backend-1:5000 max_fails=2 fail_timeout=10s;
  server backend-2:5000 max_fails=2 fail_timeout=10s;
  server backend-3:5000 max_fails=2 fail_timeout=10s;
}

server {
  listen 80;
  
  location /api/ {
    proxy_pass http://backend;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Host $host;
    
    # Health check
    proxy_connect_timeout 5s;
    proxy_send_timeout 10s;
    proxy_read_timeout 10s;
  }
}
```

#### 3. Session Management (Redis)

```javascript
// backend/src/middleware/session.js - NEW

const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL
});

module.exports = session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  }
});

// Usage in index.js
app.use(sessionMiddleware);
```

---

## 📦 Phase 3: Frontend Optimization (1-2 mois)

### Problème actuel
- Single Vite instance
- Pas de caching strategy
- Pas de code splitting
- Pas de service workers

### Solutions

#### 1. Static Content CDN

```nginx
# nginx/cdn.conf

# Cache static assets
location ~* \.(js|css|png|jpg|gif|svg|woff|woff2)$ {
  proxy_pass http://frontend:5173;
  proxy_cache frontend_cache;
  proxy_cache_valid 200 365d;
  add_header Cache-Control "public, immutable, max-age=31536000";
  add_header X-Cache-Status $upstream_cache_status;
}

# HTML - never cache
location / {
  proxy_pass http://frontend:5173;
  add_header Cache-Control "no-cache, must-revalidate";
}
```

#### 2. Service Workers & PWA

```javascript
// frontend/public/sw.js - NEW

const CACHE_VERSION = 'v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/assets/app.js',
  '/assets/style.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached or fetch
      return response || fetch(event.request);
    })
  );
});
```

#### 3. Code Splitting

```javascript
// frontend/src/App.jsx - Updated

import { lazy, Suspense } from 'react';

const AdminDashboard = lazy(() => import('./pages/AdminDashboardPage'));
const MissionUpload = lazy(() => import('./pages/MissionUploadPage'));

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/upload" element={<MissionUpload />} />
      </Routes>
    </Suspense>
  );
}
```

---

## 📱 Phase 4: Infrastructure (3-6 mois)

### Kubernetes Deployment

```yaml
# k8s/deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: promoteam-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: promoteam/backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
spec:
  type: LoadBalancer
  selector:
    app: backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 5000
```

### Auto-scaling

```yaml
# k8s/hpa.yaml

apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: promoteam-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## 🔄 Phase 5: Advanced Features (6+ mois)

### Real-time Notifications

```javascript
// WebSocket setup
npm install socket.io

// backend/src/websocket.js
const io = require('socket.io')(server, {
  cors: { origin: process.env.FRONTEND_URL }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const user = verifyToken(token);
  socket.userId = user.id;
  next();
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.userId);
  
  // Notifications en temps réel
  socket.on('proof_reviewed', (data) => {
    io.to(`user:${data.userId}`).emit('notification', {
      type: 'proof_approved',
      points: data.points
    });
  });
});
```

### Microservices Architecture

```
┌─────────────────────────────────────┐
│     API Gateway (Kong)              │
│  - Request routing                  │
│  - Rate limiting                    │
│  - Authentication                   │
└──────────────────┬──────────────────┘
                   │
      ┌────────────┼────────────┐
      │            │            │
  ┌───▼──┐     ┌──▼──┐     ┌───▼──┐
  │Auth  │     │Proof│     │Upload│
  │Svc   │     │Svc  │     │Svc   │
  └─────┘     └─────┘     └─────┘
      │            │            │
      └────────────┼────────────┘
                   │
            ┌──────▼──────┐
            │  Message    │
            │  Queue      │
            │ (RabbitMQ)  │
            └─────────────┘

Benefits:
- Independent scaling
- Fault isolation
- Technology diversity
- Team autonomy
```

---

## 📊 Performance Metrics

### Targets

| Metric | Current | 1000 users | 10k users | 100k users |
|--------|---------|-----------|-----------|-----------|
| API p95 latency | 100ms | <150ms | <200ms | <300ms |
| Frontend load | 2s | <2s | <1.5s | <2s |
| DB query p95 | 50ms | <75ms | <100ms | <150ms |
| Uptime | 99% | 99.5% | 99.9% | 99.95% |
| Concurrent users | 10 | 100 | 1000 | 10k |

### Monitoring Stack

```yaml
# docker-compose-monitoring.yml

services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"

  alertmanager:
    image: prom/alertmanager
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
```

---

## 💰 Cost Estimation

| Infrastructure | Users | Monthly Cost |
|---|---|---|
| Current (Single Server) | 100 | $20-50 |
| Phase 2 (3 servers) | 1,000 | $100-150 |
| Phase 3 (10 servers + K8s) | 10,000 | $500-1000 |
| Phase 4 (Enterprise) | 100,000+ | $2000+ |

---

## 🛣️ Migration Timeline

```
Month 1-2: Database Optimization
├── Implement master-replica setup
├── Add indexes
├── Query optimization
└── Load testing

Month 3-4: Backend Scaling
├── Load balancer setup
├── Session management
├── Horizontal scaling
└── Stress testing

Month 5-6: Frontend & Infra
├── CDN setup
├── Service workers
├── Code splitting
└── Kubernetes planning

Month 7+: Advanced Features
├── WebSockets for real-time
├── Microservices evaluation
├── Advanced caching
└── Global distribution
```

---

## ✅ Pre-scaling Checklist

Before scaling to 10k users:

- [ ] Database optimized & replicated
- [ ] Backend stateless (sessions in Redis)
- [ ] Load balancing tested
- [ ] Monitoring in place
- [ ] Logging aggregated
- [ ] Backup strategy verified
- [ ] Disaster recovery tested
- [ ] Security audit complete
- [ ] Performance benchmarks established
- [ ] Team trained on new infrastructure

---

**Document Version:** 1.0
**Last Updated:** 2024

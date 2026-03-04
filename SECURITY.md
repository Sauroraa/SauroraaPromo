# 🔐 Promoteam - Security Best Practices

## 📋 Checklist Pré-Lancement

### Avant le déploiement en production

- [ ] Changé JWT_SECRET en valeur forte
- [ ] Changé REDIS_PASSWORD en valeur forte
- [ ] Changé MYSQL_PASSWORD en valeur forte
- [ ] Généré certificat SSL valide (pas auto-signé)
- [ ] Configuré firewall pour ports 80, 443 seulement
- [ ] Configuré backups automatiques
- [ ] Testé restauration depuis backup
- [ ] Activé HTTPS partout
- [ ] Configuré rate limiting approprié
- [ ] Testé avec OWASP ZAP ou Burp Suite
- [ ] Fait audit de dépendances: `npm audit`
- [ ] Configuré monitoring et alertes
- [ ] Documenté toutes les clés/secrets
- [ ] Configuré logs centralisés
- [ ] Testé scénarios de récupération de crash

---

## 🔑 Gestion des Secrets

### Variables d'environnement sensibles

**JAMAIS en production:**
```bash
# ❌ Hardcoder dans le code
const secret = "my-secret-key";

# ❌ Committer dans Git
git add .env

# ❌ Log dans les erreurs
console.log(process.env.DATABASE_URL);

# ❌ Exposer via API
app.get('/config', (req, res) => {
  res.json(process.env);  // ❌ NON!
});
```

**OUI en production:**
```bash
# ✅ Utiliser des variables d'environnement
const secret = process.env.JWT_SECRET;

# ✅ Utiliser un gestionnaire de secrets
# - AWS Secrets Manager
# - HashiCorp Vault
# - Azure Key Vault
# - 1Password

# ✅ Chiffrer les secrets
# - GPG pour Git
# - Sealed Secrets pour Kubernetes
# - Docker Secrets pour Swarm

# ✅ Rotation régulière
# Changer les secrets mensuellement
```

### Secrets forts

```bash
# Générer secrets forts
openssl rand -base64 32  # JWT_SECRET
openssl rand -base64 32  # REDIS_PASSWORD
openssl rand -base64 32  # MYSQL_ROOT_PASSWORD

# Exigences minimales:
# - Longueur: 32+ caractères
# - Mix: Majuscules, minuscules, chiffres, symboles
# - Pas de patterns simples
# - Pas de dictionary words

# Exemple fort:
jwt_secret = "k7$mP9@qL2#vR8xY4nJ6%wZ1&tS3^bF5!cG0*hD7+aE2=iO9"
```

---

## 🔐 Authentification

### JWT Best Practices

```javascript
// ✅ BON: Expiry court, refresh tokens
const accessToken = jwt.sign(
  { userId: user.id },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }  // Court: 24h
);

const refreshToken = jwt.sign(
  { userId: user.id },
  process.env.REFRESH_TOKEN_SECRET,
  { expiresIn: '7d' }
);

// ✅ BON: Stocker refresh token en DB/Redis
await redis.setex(
  `user:${user.id}:token`,
  7 * 24 * 60 * 60,
  refreshToken
);

// ❌ MAUVAIS: Token qui n'expire jamais
jwt.sign({ userId: user.id }, secret);
```

### Stockage de mots de passe

```javascript
// ✅ BON: Bcrypt avec salt approprié
const hashedPassword = await bcrypt.hash(
  password,
  10  // Salt rounds: 10 (standard)
);

// ❌ MAUVAIS: SHA256 ou MD5
const hashedPassword = sha256(password);

// ❌ MAUVAIS: Pas de salt
const hashedPassword = bcrypt.hashSync(password, 1);
```

### Authentification multi-facteur (MFA)

```javascript
// TODO: Implémenter TOTP (Google Authenticator)
// Ajouter colonne: users.mfa_secret
// Ajouter colonne: users.mfa_enabled

// Installer: npm install speakeasy qrcode

const speakeasy = require('speakeasy');

// Générer secret
const secret = speakeasy.generateSecret({
  name: 'Promoteam',
  issuer: 'Promoteam'
});

// Vérifier code
const verified = speakeasy.totp.verify({
  secret: secret.base32,
  encoding: 'base32',
  token: userCode,
  window: 2
});
```

---

## 🛡️ Injection & Validation

### Protection contre l'injection SQL

```javascript
// ✅ BON: Prepared statements
const result = await db.query(
  'SELECT * FROM users WHERE email = ?',
  [email]
);

// ❌ MAUVAIS: String concatenation
const query = `SELECT * FROM users WHERE email = '${email}'`;
const result = await db.query(query);
```

### Validation d'input

```javascript
// ✅ BON: Validation stricte
const { body, validationResult } = require('express-validator');

router.post('/register',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/[A-Z]/).matches(/[0-9]/),
  body('username').matches(/^[a-zA-Z0-9_]{3,20}$/),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Processus
  }
);

// ❌ MAUVAIS: Pas de validation
router.post('/register', (req, res) => {
  const { email, password } = req.body;
  // Utiliser directement
});
```

### Protection XSS

```javascript
// ✅ BON: Escaper output
const xss = require('xss');

res.json({
  message: xss(userInput)
});

// ✅ BON: React échappe par défaut
return <div>{userInput}</div>;  // Safe

// ❌ MAUVAIS: dangerouslySetInnerHTML
return <div dangerouslySetInnerHTML={{ __html: userInput }} />;

// ❌ MAUVAIS: Pas d'escaping
res.send(`<h1>${userInput}</h1>`);
```

### Protection CSRF

```javascript
// ✅ BON: Tokens CSRF
const csrf = require('csurf');

const csrfProtection = csrf({ cookie: false });

router.post('/form', csrfProtection, (req, res) => {
  if (req.body._csrf !== req.csrfToken()) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  // Processus
});

// Frontend:
<form method="post">
  <input type="hidden" name="_csrf" value={csrfToken} />
</form>
```

---

## 🚫 Rate Limiting

### Configuration multi-niveaux

```javascript
// Niveau 1: Global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                    // 100 requests
  message: 'Too many requests'
});
app.use('/api/', globalLimiter);

// Niveau 2: Login (strict)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,  // Seulement 5 tentatives
  skipSuccessfulRequests: true
});

// Niveau 3: Upload
const uploadLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,  // 24h
  max: 50  // 50 uploads/jour
});

// Niveau 4: Nginx (voir nginx.conf)
// limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;
```

### DDoS Protection

```bash
# Nginx: Rate limiting
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
limit_req zone=general burst=20 nodelay;

# Nginx: Connection limiting
limit_conn_zone $binary_remote_addr zone=addr:10m;
limit_conn addr 10;  # Max 10 connections/IP

# CloudFlare / AWS Shield
# - Automatique DDoS mitigation
# - Rate limiting
# - IP reputation
# - Geographic blocking
```

---

## 📡 Transport de données

### HTTPS obligatoire

```bash
# ✅ BON: Tout en HTTPS
server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;

  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
}

# Redirect HTTP → HTTPS
server {
  listen 80;
  return 301 https://$host$request_uri;
}

# ❌ MAUVAIS: HTTP en production
server {
  listen 80;
  # Aucun SSL
}
```

### Security Headers

```bash
# Nginx: Headers de sécurité
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
add_header Content-Security-Policy "default-src 'self'" always;
```

### Chiffrement des données

```javascript
// ✅ BON: Chiffrer données sensibles en DB
const crypto = require('crypto');

function encryptSensitiveData(data) {
  const cipher = crypto.createCipher(
    'aes-256-cbc',
    process.env.ENCRYPTION_KEY
  );
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Stocker images proofs chiffrées?
// Ou au minimum: HTTPS + TLS en transit
```

---

## 🗄️ Sécurité base de données

### Permissions

```sql
-- ✅ BON: Least privilege
CREATE USER 'promoteam_app'@'localhost' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE ON promoteam.* TO 'promoteam_app'@'localhost';
-- NON: DELETE, DROP (sauf backup user)

-- Backup user
CREATE USER 'promoteam_backup'@'localhost' IDENTIFIED BY 'backup_password';
GRANT SELECT ON promoteam.* TO 'promoteam_backup'@'localhost';

-- ❌ MAUVAIS: Permissions excessives
GRANT ALL PRIVILEGES ON *.* TO 'promoteam'@'localhost';
```

### Backups chiffrés

```bash
# ✅ BON: Backups chiffrés
mysqldump -u user -p promoteam | \
  gpg --encrypt --recipient email@example.com > backup.sql.gpg

# Stockage sécurisé:
# - S3 avec encryption + versioning
# - Vault chiffré hors-site
# - Stockage froid (Glacier)
```

---

## 📊 Logging & Monitoring

### Logs sans données sensibles

```javascript
// ✅ BON: Logs sanitisés
logger.info('User login', {
  userId: user.id,
  timestamp: new Date(),
  ipAddress: req.ip
  // PAS: password, token
});

// ❌ MAUVAIS: Logs avec secrets
logger.info('User login', {
  ...req.body  // Contient password!
});
```

### Monitoring d'anomalies

```bash
# À monitorer:
# - Trop de login failures
# - Accès administrateur inhabituels
# - Changements de fichiers critiques
# - Uploads soudains importants
# - Requêtes de pattern injection

# Outils:
# - ELK Stack (Elasticsearch, Logstash, Kibana)
# - Datadog
# - New Relic
# - Splunk

# Alertes:
# - 10+ login failures = block IP
# - Admin action à 2h du matin = alert
# - Backup failed = urgent alert
```

---

## 🔄 Maintenance de sécurité

### Mises à jour des dépendances

```bash
# Vérifier les vulnérabilités
npm audit

# Fixer automatiquement
npm audit fix

# Mettre à jour manuellement
npm outdated
npm update

# Vérifier dépendances transitives
npm ls

# En production: tester d'abord!
# 1. Dev
# 2. Staging
# 3. Production
```

### Révision du code

```bash
# Code review checklist:
# - Pas de secrets en dur
# - Validation d'input présente
# - Rate limiting OK
# - Permissions correctes
# - SQL injection impossible
# - XSS impossible
# - CSRF tokens validés
# - Error handling OK
# - Logs appropriés
# - Pas de TODO sécurité
```

### Pen testing

```bash
# Outils de test:
# - OWASP ZAP (gratuit)
# - Burp Suite Community (gratuit)
# - SQLmap (injection SQL)
# - nikto (vulnérabilités serveur)

# À tester:
# - SQL Injection
# - XSS attacks
# - CSRF
# - Brute force login
# - Path traversal
# - Privilege escalation
```

---

## 🚨 Incident Response

### Plan de réponse

```
1. Détecter: Monitoring/alertes
   ↓
2. Isoler: Déconnecter les systèmes affectés
   ↓
3. Analyser: Comprendre le problème
   ↓
4. Contenir: Arrêter la propagation
   ↓
5. Éradiquer: Corriger le problème
   ↓
6. Récupérer: Restaurer les services
   ↓
7. Post-mortem: Analyser et prévenir
```

### Checklist incident

```bash
# Immédiat:
- [ ] Identifier la nature de l'incident
- [ ] Isoler les systèmes affectés
- [ ] Notifier les parties prenantes
- [ ] Commencer à logguer les actions

# Court terme (24h):
- [ ] Identifier la cause root
- [ ] Implémenter le fix
- [ ] Tester avant déploiement
- [ ] Déployer en production

# Moyen terme (1 semaine):
- [ ] Audit complet
- [ ] Communication publique
- [ ] Compensation si nécessaire
- [ ] Amélioration des processus

# Documentation:
- [ ] Quoi: Quel était l'incident
- [ ] Quand: Date/heure de détection
- [ ] Durée: Combien de temps
- [ ] Impact: Utilisateurs affectés
- [ ] Cause: Analyse root cause
- [ ] Fix: Quelle correction
- [ ] Prevention: Comment éviter
```

---

## ✅ Compliance

### GDPR

```javascript
// ✅ Droit à l'oubli: Supprimer all user data
router.delete('/api/users/:id', async (req, res) => {
  // Supprimer:
  // - Profil utilisateur
  // - Données personnelles
  // - Historique transactions
  // - Logs avec PII
  // - Backups vieux

  // Garder:
  // - Données anonymisées
  // - Données légales requises
});

// ✅ Consentement: Tracker consentement
// - Ajouter colonne: users.gdpr_consent
// - Ajouter colonne: users.marketing_consent

// ✅ Data breach: Notifier en 72h
// - Préparer notification template
// - Contacter CNIL si nécessaire
```

### Données utilisateur

```bash
# À catégoriser:
- Public: Nom, photo public
- Privé: Email, téléphone
- Sensible: Mot de passe, token
- PII: Info personnelle identifiable

# Politique de rétention:
- Public: Garder indéfiniment
- Privé: Garder tant que compte actif + 30j
- Sensible: Jamais logguer en dur
- PII: Minimiser, chiffrer, purger régulièrement
```

---

## 📝 Checklist finale

- [ ] JWT_SECRET fort et unique
- [ ] Passwords hashés avec bcrypt
- [ ] HTTPS partout
- [ ] Rate limiting activé
- [ ] Input validation strict
- [ ] SQL injection impossible
- [ ] XSS protection active
- [ ] CSRF tokens validés
- [ ] Headers sécurité en place
- [ ] Logs sans secrets
- [ ] Backups chiffrés et testés
- [ ] Monitoring d'anomalies
- [ ] Dependencies à jour
- [ ] Code review fait
- [ ] Pen test complété
- [ ] Plan incident préparé
- [ ] GDPR compliant
- [ ] Firewall configuré
- [ ] SSH key management ok
- [ ] 2FA staff administratif

---

**Dernière mise à jour:** 2024
**Version:** 1.0

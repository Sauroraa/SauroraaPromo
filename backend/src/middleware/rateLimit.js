import rateLimit from 'express-rate-limit';

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.ip || 'unknown';
}

function intFromEnv(name, fallback) {
  const raw = process.env[name];
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const GLOBAL_WINDOW_MS = intFromEnv('RATE_LIMIT_GLOBAL_WINDOW_MS', 15 * 60 * 1000);
const GLOBAL_MAX = intFromEnv('RATE_LIMIT_GLOBAL_MAX', 600);
const LOGIN_WINDOW_MS = intFromEnv('RATE_LIMIT_LOGIN_WINDOW_MS', 15 * 60 * 1000);
const LOGIN_MAX = intFromEnv('RATE_LIMIT_LOGIN_MAX', 12);
const UPLOAD_WINDOW_MS = intFromEnv('RATE_LIMIT_UPLOAD_WINDOW_MS', 24 * 60 * 60 * 1000);
const UPLOAD_MAX = intFromEnv('RATE_LIMIT_UPLOAD_MAX', 120);
const PROOF_WINDOW_MS = intFromEnv('RATE_LIMIT_PROOF_WINDOW_MS', 60 * 60 * 1000);
const PROOF_MAX = intFromEnv('RATE_LIMIT_PROOF_MAX', 30);

// Global rate limit — increased for production traffic
export const globalLimiter = rateLimit({
  windowMs: GLOBAL_WINDOW_MS,
  max: GLOBAL_MAX,
  keyGenerator: (req) => getClientIp(req),
  skip: (req) => req.path === '/health' || req.path === '/api/health',
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessayez dans quelques minutes.' }
});

// Login limiter — only counts failures
export const loginLimiter = rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  max: LOGIN_MAX,
  keyGenerator: (req) => getClientIp(req),
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' }
});

// Upload limiter — daily cap
export const uploadLimiter = rateLimit({
  windowMs: UPLOAD_WINDOW_MS,
  max: UPLOAD_MAX,
  keyGenerator: (req) => getClientIp(req),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite d\'uploads journalière atteinte.' }
});

// Proof submission limiter — hourly cap
export const proofLimiter = rateLimit({
  windowMs: PROOF_WINDOW_MS,
  max: PROOF_MAX,
  keyGenerator: (req) => getClientIp(req),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de soumissions atteinte. Réessayez dans une heure.' }
});

export default globalLimiter;

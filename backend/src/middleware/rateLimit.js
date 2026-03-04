import rateLimit from 'express-rate-limit';

// Global rate limit — 100 req / 15 min per IP
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessayez dans quelques minutes.' }
});

// Login — 5 attempts / 15 min (only counts failures)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' }
});

// Upload — 50 soumissions / 24h
export const uploadLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite d\'uploads journalière atteinte.' }
});

// Proof submission — 10 / heure
export const proofLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de soumissions atteinte. Réessayez dans une heure.' }
});

export default globalLimiter;

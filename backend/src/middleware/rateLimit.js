import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from '../config/redis.js';

// Limiter global
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests, please try again later.'
});

// Limiter login
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true
});

// Limiter upload
export const uploadLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24h
  max: 50, // 50 uploads per day
  message: 'Daily upload limit exceeded',
  skipSuccessfulRequests: false
});

// Limiter API proof submission
export const proofLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 proofs per hour
  message: 'Proof submission rate limit exceeded'
});

export default globalLimiter;

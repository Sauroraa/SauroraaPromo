import express from 'express';
import { register, login, logout, getCurrentUser, refreshToken } from '../controllers/authController.js';
import { loginLimiter } from '../middleware/rateLimit.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getCurrentUser);
router.post('/refresh', refreshToken);

export default router;

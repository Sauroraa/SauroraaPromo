import express from 'express';
import { getUserProfile, getMyProfile, getLeaderboardData, updateProfile } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', authMiddleware, getMyProfile);
router.get('/leaderboard', getLeaderboardData);
router.get('/:userId', getUserProfile);
router.patch('/me', authMiddleware, updateProfile);

export default router;

import express from 'express';
import {
  getUserProfile,
  getMyProfile,
  getLeaderboardData,
  updateProfile,
  getMyNotifications
} from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', authMiddleware, getMyProfile);
router.get('/me/notifications', authMiddleware, getMyNotifications);
router.get('/leaderboard', getLeaderboardData);
router.get('/:userId', getUserProfile);
router.patch('/me', authMiddleware, updateProfile);

export default router;

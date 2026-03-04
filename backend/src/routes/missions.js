import express from 'express';
import { getMissions, getMissionById, getMissionProofStats } from '../controllers/missionController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getMissions);
router.get('/:missionId', getMissionById);
router.get('/:missionId/stats', getMissionProofStats);

export default router;

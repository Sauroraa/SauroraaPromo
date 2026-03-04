import express from 'express';
import {
  getAllProofs,
  getProofForReview,
  approveProofAdmin,
  rejectProofAdmin,
  getAllMissionsAdmin,
  createMissionAdmin,
  updateMissionAdmin,
  deleteMissionAdmin,
  getAdminStats,
  getActivityData,
  getTopPromoters,
  getAllUsers,
  updateUserStatus,
  generateInvites
} from '../controllers/adminController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require auth + admin role
router.use(authMiddleware, adminMiddleware);

// Proofs
router.get('/proofs', getAllProofs);
router.get('/proofs/:proofId', getProofForReview);
router.post('/proofs/:proofId/approve', approveProofAdmin);
router.post('/proofs/:proofId/reject', rejectProofAdmin);

// Missions
router.get('/missions', getAllMissionsAdmin);
router.post('/missions', createMissionAdmin);
router.patch('/missions/:missionId', updateMissionAdmin);
router.delete('/missions/:missionId', deleteMissionAdmin);

// Stats
router.get('/stats', getAdminStats);
router.get('/activity', getActivityData);
router.get('/top-promoters', getTopPromoters);

// Users
router.get('/users', getAllUsers);
router.patch('/users/:userId/status', updateUserStatus);

// Invites
router.post('/invites', generateInvites);

export default router;

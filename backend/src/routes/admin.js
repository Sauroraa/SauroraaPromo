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
  createInvite,
  getInvites,
  generateInvites,
  resendInvite,
  deleteInvite
} from '../controllers/adminController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Admin panel routes: shared between admin and staff for operational tasks
router.use(authMiddleware, roleMiddleware(['admin', 'staff']));

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
router.get('/invites', getInvites);
router.post('/invite', createInvite);
router.post('/invites', generateInvites);
router.post('/invites/:inviteId/resend', resendInvite);
router.delete('/invites/:inviteId', deleteInvite);

export default router;

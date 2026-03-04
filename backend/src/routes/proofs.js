import express from 'express';
import { uploadProofs, getUserSubmittedProofs, getProofDetails } from '../controllers/proofController.js';
import { authMiddleware } from '../middleware/auth.js';
import { uploadMiddleware } from '../middleware/upload.js';
import { uploadLimiter, proofLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

router.post('/', authMiddleware, uploadLimiter, proofLimiter, uploadMiddleware.array('images', 10), uploadProofs);
router.get('/my', authMiddleware, getUserSubmittedProofs);
router.get('/:proofId', authMiddleware, getProofDetails);

export default router;

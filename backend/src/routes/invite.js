import express from 'express';
import { acceptInvite, getInviteByToken } from '../controllers/authController.js';

const router = express.Router();

router.post('/accept', acceptInvite);
router.get('/:token', getInviteByToken);

export default router;

import { query } from '../config/db.js';
import redis from '../config/redis.js';
import logger from '../utils/logger.js';
import { sendProofApprovedEmail, sendProofRejectedEmail } from './emailService.js';

export async function submitProof(userId, missionId, imageCount) {
  const result = await query(
    `INSERT INTO proofs (user_id, mission_id, status, images_count, created_at)
     VALUES (?, ?, 'pending', ?, NOW())`,
    [userId, missionId, imageCount]
  );

  const proofId = result.insertId;
  logger.info(`Proof submitted: ${proofId} by user ${userId}`);

  await redis.del(`user_proofs:${userId}`);

  return proofId;
}

export async function getProofById(proofId) {
  const result = await query(
    `SELECT p.*, m.title, m.points_per_proof, u.insta_username, u.email, u.first_name
     FROM proofs p
     JOIN missions m ON p.mission_id = m.id
     JOIN users u ON p.user_id = u.id
     WHERE p.id = ?`,
    [proofId]
  );
  return result[0] || null;
}

export async function getUserProofs(userId) {
  const cached = await redis.get(`user_proofs:${userId}`);
  if (cached) return JSON.parse(cached);

  const result = await query(
    `SELECT p.id, p.mission_id, m.title, p.status, p.images_count, p.reject_reason,
            p.created_at, p.reviewed_at
     FROM proofs p
     JOIN missions m ON p.mission_id = m.id
     WHERE p.user_id = ?
     ORDER BY p.created_at DESC
     LIMIT 100`,
    [userId]
  );

  await redis.setEx(`user_proofs:${userId}`, 3600, JSON.stringify(result));

  return result;
}

export async function approveProof(proofId, adminId) {
  const proof = await getProofById(proofId);
  if (!proof) throw new Error('Proof not found');

  if (proof.status !== 'pending') {
    throw new Error('Cette preuve a déjà été traitée');
  }

  await query(
    `UPDATE proofs SET status = 'approved', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?`,
    [adminId, proofId]
  );

  // Business rule: mission validation awards fixed points once,
  // regardless of the number of uploaded images.
  const pointsToAward = Number(proof.points_per_proof || 0);

  await query(
    `INSERT INTO points_history (user_id, proof_id, points, reason, created_at)
     VALUES (?, ?, ?, 'Preuve approuvée', NOW())`,
    [proof.user_id, proofId, pointsToAward]
  );

  await query(
    `UPDATE users SET points_total = points_total + ? WHERE id = ?`,
    [pointsToAward, proof.user_id]
  );

  await logAdminAction(adminId, 'approve_proof', proofId, { points: pointsToAward });

  // Cache invalidation
  await redis.del(`user_proofs:${proof.user_id}`);
  await redis.del(`user_stats:${proof.user_id}`);
  await redis.del(`leaderboard:20:0`);

  // Fetch updated total points for email
  const userRows = await query(`SELECT points_total FROM users WHERE id = ?`, [proof.user_id]);
  const totalPoints = userRows[0]?.points_total ?? 0;

  // Send notification email (non-blocking)
  sendProofApprovedEmail({
    email: proof.email,
    firstName: proof.first_name,
    missionTitle: proof.title,
    pointsAwarded: pointsToAward,
    totalPoints
  }).catch(err => logger.warn('Proof approved email failed:', err.message));

  logger.info(`Proof ${proofId} approved by admin ${adminId}. Points awarded: ${pointsToAward}`);

  return { success: true, pointsAwarded: pointsToAward };
}

export async function rejectProof(proofId, adminId, reason) {
  const proof = await getProofById(proofId);
  if (!proof) throw new Error('Proof not found');

  if (proof.status !== 'pending') {
    throw new Error('Cette preuve a déjà été traitée');
  }

  await query(
    `UPDATE proofs SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW(), reject_reason = ? WHERE id = ?`,
    [adminId, reason || null, proofId]
  );

  await logAdminAction(adminId, 'reject_proof', proofId, { reason });

  // Cache invalidation
  await redis.del(`user_proofs:${proof.user_id}`);

  // Send notification email (non-blocking)
  sendProofRejectedEmail({
    email: proof.email,
    firstName: proof.first_name,
    missionTitle: proof.title,
    reason
  }).catch(err => logger.warn('Proof rejected email failed:', err.message));

  logger.info(`Proof ${proofId} rejected by admin ${adminId}`);

  return { success: true };
}

async function logAdminAction(adminId, action, targetId, details) {
  try {
    await query(
      `INSERT INTO admin_logs (admin_id, action, target_id, details, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [adminId, action, targetId, JSON.stringify(details)]
    );
  } catch (err) {
    logger.error('Error logging admin action:', err);
  }
}

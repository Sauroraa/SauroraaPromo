import { query } from '../config/db.js';
import redis from '../config/redis.js';
import logger from '../utils/logger.js';

export async function submitProof(userId, missionId, imageCount) {
  try {
    const result = await query(
      `INSERT INTO proofs (user_id, mission_id, status, images_count, created_at)
       VALUES (?, ?, 'pending', ?, NOW())`,
      [userId, missionId, imageCount]
    );

    const proofId = result.insertId;
    logger.info(`Proof submitted: ${proofId} by user ${userId}`);

    // Cache invalidation
    await redis.del(`user_proofs:${userId}`);

    return proofId;
  } catch (err) {
    logger.error('Error submitting proof:', err);
    throw err;
  }
}

export async function getProofById(proofId) {
  try {
    const result = await query(
      `SELECT p.*, m.title, m.points_per_proof, u.insta_username
       FROM proofs p
       JOIN missions m ON p.mission_id = m.id
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [proofId]
    );
    return result[0] || null;
  } catch (err) {
    logger.error('Error fetching proof:', err);
    throw err;
  }
}

export async function getUserProofs(userId) {
  try {
    // Try cache first
    const cached = await redis.get(`user_proofs:${userId}`);
    if (cached) return JSON.parse(cached);

    const result = await query(
      `SELECT p.id, p.mission_id, m.title, p.status, p.images_count, p.created_at, p.reviewed_at
       FROM proofs p
       JOIN missions m ON p.mission_id = m.id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC
       LIMIT 100`,
      [userId]
    );

    // Cache for 1 hour
    await redis.setex(`user_proofs:${userId}`, 3600, JSON.stringify(result));

    return result;
  } catch (err) {
    logger.error('Error fetching user proofs:', err);
    throw err;
  }
}

export async function approveProof(proofId, adminId) {
  try {
    const proof = await getProofById(proofId);
    if (!proof) throw new Error('Proof not found');

    // Update proof status
    await query(
      `UPDATE proofs SET status = 'approved', reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [adminId, proofId]
    );

    // Award points for each image
    const pointsToAward = proof.images_count * proof.points_per_proof;
    
    await query(
      `INSERT INTO points_history (user_id, proof_id, points, reason, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [proof.user_id, proofId, pointsToAward, 'Proof approved']
    );

    // Update user total points
    await query(
      `UPDATE users SET points_total = points_total + ? WHERE id = ?`,
      [pointsToAward, proof.user_id]
    );

    // Log admin action
    await logAdminAction(adminId, 'approve_proof', proofId, { points: pointsToAward });

    // Cache invalidation
    await redis.del(`user_proofs:${proof.user_id}`);
    await redis.del(`user_stats:${proof.user_id}`);

    logger.info(`Proof ${proofId} approved by admin ${adminId}. Points awarded: ${pointsToAward}`);

    return { success: true, pointsAwarded: pointsToAward };
  } catch (err) {
    logger.error('Error approving proof:', err);
    throw err;
  }
}

export async function rejectProof(proofId, adminId, reason) {
  try {
    await query(
      `UPDATE proofs SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [adminId, proofId]
    );

    await logAdminAction(adminId, 'reject_proof', proofId, { reason });

    logger.info(`Proof ${proofId} rejected by admin ${adminId}`);

    return { success: true };
  } catch (err) {
    logger.error('Error rejecting proof:', err);
    throw err;
  }
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

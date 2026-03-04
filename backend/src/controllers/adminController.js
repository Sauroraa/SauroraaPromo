import { query } from '../config/db.js';
import logger from '../utils/logger.js';
import { approveProof, rejectProof } from '../services/proofService.js';
import { createMission, updateMission, deleteMission, getAllMissions } from '../services/missionService.js';

// PROOFS

export async function getAllProofs(req, res) {
  try {
    const status = req.query.status;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;

    let sql = `SELECT p.*, u.insta_username, m.title
               FROM proofs p
               JOIN users u ON p.user_id = u.id
               JOIN missions m ON p.mission_id = m.id`;

    const values = [];

    if (status) {
      sql += ` WHERE p.status = ?`;
      values.push(status);
    }

    sql += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    values.push(limit, offset);

    const proofs = await query(sql, values);

    res.json({
      proofs,
      limit,
      offset
    });
  } catch (err) {
    logger.error('Error fetching all proofs:', err);
    res.status(500).json({ error: 'Failed to fetch proofs' });
  }
}

export async function getProofForReview(req, res) {
  try {
    const proofId = req.params.proofId;

    const proof = await query(
      `SELECT p.*, u.id as user_id, u.insta_username, u.first_name, u.last_name, m.title, m.points_per_proof
       FROM proofs p
       JOIN users u ON p.user_id = u.id
       JOIN missions m ON p.mission_id = m.id
       WHERE p.id = ?`,
      [proofId]
    );

    if (proof.length === 0) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    const images = await query(
      `SELECT id, image_path, created_at FROM proof_images WHERE proof_id = ? ORDER BY created_at ASC`,
      [proofId]
    );

    res.json({
      ...proof[0],
      images
    });
  } catch (err) {
    logger.error('Error fetching proof for review:', err);
    res.status(500).json({ error: 'Failed to fetch proof' });
  }
}

export async function approveProofAdmin(req, res) {
  try {
    const proofId = req.params.proofId;
    const adminId = req.user.userId;

    const result = await approveProof(proofId, adminId);

    res.json(result);
  } catch (err) {
    logger.error('Error approving proof:', err);
    res.status(500).json({ error: 'Failed to approve proof' });
  }
}

export async function rejectProofAdmin(req, res) {
  try {
    const proofId = req.params.proofId;
    const adminId = req.user.userId;
    const { reason } = req.body;

    const result = await rejectProof(proofId, adminId, reason);

    res.json(result);
  } catch (err) {
    logger.error('Error rejecting proof:', err);
    res.status(500).json({ error: 'Failed to reject proof' });
  }
}

// MISSIONS

export async function getAllMissionsAdmin(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 200);
    const offset = parseInt(req.query.offset) || 0;

    const missions = await getAllMissions(limit, offset);

    res.json({ missions, limit, offset });
  } catch (err) {
    logger.error('Error fetching all missions:', err);
    res.status(500).json({ error: 'Failed to fetch missions' });
  }
}

export async function createMissionAdmin(req, res) {
  try {
    const { title, description, action_type, points_per_proof, max_per_user, deadline } = req.body;

    if (!title || !action_type || !points_per_proof) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const missionId = await createMission({
      title,
      description,
      action_type,
      points_per_proof,
      max_per_user: max_per_user || 10,
      deadline
    });

    logger.info(`Mission created by admin ${req.user.userId}: ${missionId}`);

    res.status(201).json({
      success: true,
      missionId
    });
  } catch (err) {
    logger.error('Error creating mission:', err);
    res.status(500).json({ error: 'Failed to create mission' });
  }
}

export async function updateMissionAdmin(req, res) {
  try {
    const missionId = req.params.missionId;
    const updates = req.body;

    await updateMission(missionId, updates);

    logger.info(`Mission ${missionId} updated by admin ${req.user.userId}`);

    res.json({ success: true });
  } catch (err) {
    logger.error('Error updating mission:', err);
    res.status(500).json({ error: 'Failed to update mission' });
  }
}

export async function deleteMissionAdmin(req, res) {
  try {
    const missionId = req.params.missionId;

    await deleteMission(missionId);

    logger.info(`Mission ${missionId} deleted by admin ${req.user.userId}`);

    res.json({ success: true });
  } catch (err) {
    logger.error('Error deleting mission:', err);
    res.status(500).json({ error: 'Failed to delete mission' });
  }
}

// STATS

export async function getAdminStats(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const stats = await query(
      `SELECT 
        (SELECT COUNT(*) FROM proofs WHERE DATE(created_at) = CURDATE()) as proofs_today,
        (SELECT SUM(points) FROM points_history WHERE DATE(created_at) = CURDATE()) as points_distributed_today,
        (SELECT COUNT(*) FROM missions WHERE active = 1) as active_missions,
        (SELECT COUNT(DISTINCT user_id) FROM proofs WHERE DATE(created_at) = CURDATE()) as active_promoters_today,
        (SELECT COUNT(*) FROM users WHERE role = 'promoter') as total_promoters,
        (SELECT COUNT(*) FROM proofs WHERE status = 'pending') as pending_proofs`
    );

    res.json(stats[0]);
  } catch (err) {
    logger.error('Error fetching admin stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

export async function getActivityData(req, res) {
  try {
    const days = parseInt(req.query.days) || 7;

    const activity = await query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as proofs_count,
        SUM(images_count) as total_images,
        COUNT(DISTINCT user_id) as unique_users
       FROM proofs
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [days]
    );

    res.json(activity);
  } catch (err) {
    logger.error('Error fetching activity data:', err);
    res.status(500).json({ error: 'Failed to fetch activity data' });
  }
}

export async function getTopPromoters(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const topPromoters = await query(
      `SELECT 
        u.id,
        u.insta_username,
        u.points_total,
        COUNT(DISTINCT p.id) as proofs_submitted,
        COUNT(DISTINCT CASE WHEN p.status = 'approved' THEN p.id END) as proofs_approved
       FROM users u
       LEFT JOIN proofs p ON u.id = p.user_id
       WHERE u.role = 'promoter'
       GROUP BY u.id
       ORDER BY u.points_total DESC
       LIMIT ?`,
      [limit]
    );

    res.json(topPromoters);
  } catch (err) {
    logger.error('Error fetching top promoters:', err);
    res.status(500).json({ error: 'Failed to fetch top promoters' });
  }
}

// USERS MANAGEMENT

export async function getAllUsers(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;

    const users = await query(
      `SELECT id, first_name, last_name, insta_username, email, role, points_total, status, created_at, last_login
       FROM users
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json(users);
  } catch (err) {
    logger.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

export async function updateUserStatus(req, res) {
  try {
    const userId = req.params.userId;
    const { status } = req.body;

    if (!['active', 'suspended', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await query(
      `UPDATE users SET status = ? WHERE id = ?`,
      [status, userId]
    );

    logger.info(`User ${userId} status updated to ${status} by admin ${req.user.userId}`);

    res.json({ success: true });
  } catch (err) {
    logger.error('Error updating user status:', err);
    res.status(500).json({ error: 'Failed to update user status' });
  }
}

// INVITES

export async function generateInvites(req, res) {
  try {
    const { count, expiresIn } = req.body;

    if (!count || count < 1 || count > 100) {
      return res.status(400).json({ error: 'Count must be between 1 and 100' });
    }

    const adminId = req.user.userId;
    const inviteCodes = [];

    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + (expiresIn || 30));

    for (let i = 0; i < count; i++) {
      const code = `INV-${Date.now()}-${Math.random().toString(36).substring(7)}`.toUpperCase();

      await query(
        `INSERT INTO invites (code, created_by, expires_at, created_at)
         VALUES (?, ?, ?, NOW())`,
        [code, adminId, expireDate]
      );

      inviteCodes.push(code);
    }

    logger.info(`Generated ${count} invite codes by admin ${adminId}`);

    res.json({
      success: true,
      invites: inviteCodes
    });
  } catch (err) {
    logger.error('Error generating invites:', err);
    res.status(500).json({ error: 'Failed to generate invites' });
  }
}

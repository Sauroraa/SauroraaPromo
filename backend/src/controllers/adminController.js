import { query } from '../config/db.js';
import logger from '../utils/logger.js';
import { approveProof, rejectProof } from '../services/proofService.js';
import { createMission, updateMission, deleteMission, getAllMissions } from '../services/missionService.js';
import { randomBytes } from 'crypto';
import { sendInviteEmail } from '../services/emailService.js';

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
    const { title, description, action_type, action_types, points_per_proof, max_per_user, deadline } = req.body;

    const allowedActions = ['like', 'comment', 'share', 'story', 'post', 'follow'];
    const selectedActions = Array.isArray(action_types) && action_types.length > 0
      ? action_types
      : (action_type ? [action_type] : []);

    const normalizedActions = [...new Set(selectedActions)]
      .map((a) => String(a).toLowerCase().trim())
      .filter((a) => allowedActions.includes(a));

    if (!title || normalizedActions.length === 0 || !points_per_proof) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const normalizeDeadline = (value) => {
      if (!value) return null;
      const asString = String(value).trim();
      if (!asString) return null;
      return asString.includes('T') ? asString.replace('T', ' ') + ':00' : asString;
    };

    const normalizedDeadline = normalizeDeadline(deadline);
    const createdIds = [];

    for (const action of normalizedActions) {
      const missionId = await createMission({
        title: normalizedActions.length > 1 ? `${title} [${action}]` : title,
        description,
        action_type: action,
        points_per_proof,
        max_per_user: max_per_user || 10,
        deadline: normalizedDeadline
      });
      createdIds.push(missionId);
    }

    logger.info(`Mission(s) created by admin ${req.user.userId}: ${createdIds.join(',')}`);

    res.status(201).json({
      success: true,
      missionId: createdIds[0],
      missionIds: createdIds,
      createdCount: createdIds.length
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
    const metric = async (sql, values = [], key = 'value') => {
      try {
        const rows = await query(sql, values);
        return Number(rows?.[0]?.[key] ?? 0);
      } catch (err) {
        logger.warn(`Admin stats metric failed (${key}): ${err.message}`);
        return 0;
      }
    };

    const [
      proofsToday,
      pointsDistributedToday,
      activeMissions,
      activePromotersToday,
      totalPromoters,
      pendingProofs
    ] = await Promise.all([
      metric(`SELECT COUNT(*) AS value FROM proofs WHERE DATE(created_at) = CURDATE()`),
      metric(`SELECT COALESCE(SUM(points), 0) AS value FROM points_history WHERE DATE(created_at) = CURDATE()`),
      metric(`SELECT COUNT(*) AS value FROM missions WHERE active = 1`),
      metric(`SELECT COUNT(DISTINCT user_id) AS value FROM proofs WHERE DATE(created_at) = CURDATE()`),
      metric(`SELECT COUNT(*) AS value FROM users WHERE role = 'promoter'`),
      metric(`SELECT COUNT(*) AS value FROM proofs WHERE status = 'pending'`)
    ]);

    res.json({
      proofs_today: proofsToday,
      points_distributed_today: pointsDistributedToday,
      active_missions: activeMissions,
      active_promoters_today: activePromotersToday,
      total_promoters: totalPromoters,
      pending_proofs: pendingProofs
    });
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

export async function getInvites(req, res) {
  try {
    const invites = await query(
      `SELECT i.id, i.email, i.first_name, i.last_name, i.phone, i.role, i.token, i.code,
              i.expires_at, i.used_at, i.created_at, i.used_by, u.email AS created_by_email
       FROM invites i
       LEFT JOIN users u ON u.id = i.created_by
       ORDER BY i.created_at DESC
       LIMIT 200`
    );

    res.json({ invites });
  } catch (err) {
    logger.error('Error fetching invites:', err);
    res.status(500).json({ error: 'Failed to fetch invites' });
  }
}

export async function createInvite(req, res) {
  try {
    const { email, role } = req.body;
    const inviteRole = role || 'promoter';
    const inviteExpiresHours = 24 * 7;

    if (!email) {
      return res.status(400).json({ error: 'Missing required field: email' });
    }

    if (!['promoter', 'staff'].includes(inviteRole)) {
      return res.status(400).json({ error: 'Invalid role, allowed: promoter, staff' });
    }

    const adminId = req.user.userId;
    const expireDate = new Date();
    expireDate.setHours(expireDate.getHours() + inviteExpiresHours);
    const token = randomBytes(32).toString('hex');
    const code = `INV-${randomBytes(4).toString('hex').toUpperCase()}`;

    await query(
      `INSERT INTO invites (email, first_name, last_name, phone, role, token, code, created_by, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [email, '', '', null, inviteRole, token, code, adminId, expireDate]
    );

    const creator = await query(
      `SELECT CONCAT(first_name, ' ', last_name) AS full_name FROM users WHERE id = ? LIMIT 1`,
      [adminId]
    );
    const createdByName = creator[0]?.full_name || 'Un membre de l\'équipe';

    let emailSent = true;
    try {
      await sendInviteEmail({
        to: email,
        inviteToken: token,
        inviteCode: code,
        expiresAt: expireDate,
        createdByName
      });
    } catch (err) {
      emailSent = false;
      logger.warn(`Invite email failed for ${email}: ${err.message}`);
    }

    logger.info(`Invite created by ${req.user.role} ${adminId} for ${email} (${inviteRole})`);

    res.status(201).json({
      success: true,
      invite: {
        email,
        firstName: '',
        lastName: '',
        phone: null,
        role: inviteRole,
        token,
        code,
        expiresAt: expireDate,
        emailSent
      },
      message: emailSent
        ? 'Invitation creee et email envoye'
        : 'Invitation creee mais email non envoye (SMTP a verifier)'
    });
  } catch (err) {
    logger.error('Error creating invite:', err);
    res.status(500).json({ error: 'Failed to create invite' });
  }
}

export async function generateInvites(req, res) {
  return createInvite(req, res);
}

export async function resendInvite(req, res) {
  try {
    const inviteId = req.params.inviteId;
    const inviteRows = await query(
      `SELECT id, email, role, used_by FROM invites WHERE id = ? LIMIT 1`,
      [inviteId]
    );

    if (inviteRows.length === 0) {
      return res.status(404).json({ error: 'Invitation introuvable' });
    }

    const invite = inviteRows[0];
    if (invite.used_by) {
      return res.status(400).json({ error: 'Invitation deja utilisee' });
    }

    const token = randomBytes(32).toString('hex');
    const code = `INV-${randomBytes(4).toString('hex').toUpperCase()}`;
    const expireDate = new Date();
    expireDate.setHours(expireDate.getHours() + 24 * 7);

    await query(
      `UPDATE invites
       SET token = ?, code = ?, expires_at = ?, used_at = NULL
       WHERE id = ?`,
      [token, code, expireDate, inviteId]
    );

    const creator = await query(
      `SELECT CONCAT(first_name, ' ', last_name) AS full_name FROM users WHERE id = ? LIMIT 1`,
      [req.user.userId]
    );
    const createdByName = creator[0]?.full_name || 'Un membre de l\'equipe';

    let emailSent = true;
    try {
      await sendInviteEmail({
        to: invite.email,
        inviteToken: token,
        inviteCode: code,
        expiresAt: expireDate,
        createdByName
      });
    } catch (err) {
      emailSent = false;
      logger.warn(`Invite resend email failed for ${invite.email}: ${err.message}`);
    }

    return res.json({
      success: true,
      invite: {
        id: inviteId,
        email: invite.email,
        role: invite.role,
        token,
        code,
        expiresAt: expireDate,
        emailSent
      },
      message: emailSent
        ? 'Invitation renvoyee par email'
        : 'Invitation mise a jour mais email non envoye (SMTP a verifier)'
    });
  } catch (err) {
    logger.error('Error resending invite:', err);
    res.status(500).json({ error: 'Failed to resend invite' });
  }
}

export async function deleteInvite(req, res) {
  try {
    const inviteId = req.params.inviteId;
    const result = await query(`DELETE FROM invites WHERE id = ?`, [inviteId]);

    if (!result?.affectedRows) {
      return res.status(404).json({ error: 'Invitation introuvable' });
    }

    logger.info(`Invite ${inviteId} deleted by ${req.user.role} ${req.user.userId}`);
    res.json({ success: true });
  } catch (err) {
    logger.error('Error deleting invite:', err);
    res.status(500).json({ error: 'Failed to delete invite' });
  }
}

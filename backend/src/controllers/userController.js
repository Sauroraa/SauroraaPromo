import { query } from '../config/db.js';
import logger from '../utils/logger.js';
import { getUserStats, getLeaderboard, getUserPointsHistory } from '../services/pointsService.js';

export async function getUserProfile(req, res) {
  try {
    const userId = req.params.userId;
    
    const user = await query(
      `SELECT id, first_name, last_name, insta_username, email, points_total, created_at
       FROM users WHERE id = ?`,
      [userId]
    );

    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stats = await getUserStats(userId);

    res.json({
      user: user[0],
      stats
    });
  } catch (err) {
    logger.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

export async function getMyProfile(req, res) {
  try {
    const userId = req.user.userId;
    
    const user = await query(
      `SELECT id, first_name, last_name, insta_username, email, points_total, role, created_at, last_login
       FROM users WHERE id = ?`,
      [userId]
    );

    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stats = await getUserStats(userId);
    const pointsHistory = await getUserPointsHistory(userId, 10);

    res.json({
      user: user[0],
      stats,
      recentPoints: pointsHistory
    });
  } catch (err) {
    logger.error('Error fetching my profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

export async function getLeaderboardData(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    const leaderboard = await getLeaderboard(limit, offset);
    const total = await query(`SELECT COUNT(*) as count FROM users WHERE role = 'promoter'`);

    res.json({
      leaderboard,
      total: total[0].count,
      limit,
      offset
    });
  } catch (err) {
    logger.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
}

export async function updateProfile(req, res) {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, email, phone, instaUsername } = req.body;

    const updates = [];
    const values = [];

    if (firstName) {
      updates.push('first_name = ?');
      values.push(firstName);
    }
    if (lastName) {
      updates.push('last_name = ?');
      values.push(lastName);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone || null);
    }
    if (instaUsername) {
      updates.push('insta_username = ?');
      values.push(instaUsername);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(userId);

    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    logger.info(`User ${userId} profile updated`);

    res.json({ success: true });
  } catch (err) {
    logger.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

export async function getMyNotifications(req, res) {
  try {
    const userId = req.user.userId;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

    const proofEvents = await query(
      `SELECT p.id, p.status, p.reviewed_at, m.title
       FROM proofs p
       JOIN missions m ON m.id = p.mission_id
       WHERE p.user_id = ?
         AND p.status IN ('approved', 'rejected')
         AND p.reviewed_at IS NOT NULL
       ORDER BY p.reviewed_at DESC
       LIMIT ?`,
      [userId, limit]
    );

    const pointEvents = await query(
      `SELECT id, points, reason, created_at
       FROM points_history
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, limit]
    );

    const notifications = [
      ...proofEvents.map((event) => ({
        id: `proof-${event.id}`,
        type: event.status === 'approved' ? 'proof_approved' : 'proof_rejected',
        title: event.status === 'approved' ? 'Preuve approuvee' : 'Preuve rejetee',
        message: `Mission: ${event.title}`,
        createdAt: event.reviewed_at
      })),
      ...pointEvents.map((event) => ({
        id: `points-${event.id}`,
        type: 'points',
        title: `+${event.points} points`,
        message: event.reason || 'Points attribues',
        createdAt: event.created_at
      }))
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);

    res.json({ notifications });
  } catch (err) {
    logger.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

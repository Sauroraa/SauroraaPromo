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
    const { firstName, lastName, email } = req.body;

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

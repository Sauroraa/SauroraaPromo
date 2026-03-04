import { query } from '../config/db.js';
import redis from '../config/redis.js';
import logger from '../utils/logger.js';

export async function getUserStats(userId) {
  try {
    // Try cache first (non-blocking if Redis has issues)
    try {
      const cached = await redis.get(`user_stats:${userId}`);
      if (cached) return JSON.parse(cached);
    } catch (cacheErr) {
      logger.warn(`Redis cache read failed for user stats ${userId}: ${cacheErr.message}`);
    }

    const result = await query(
      `SELECT 
        u.id,
        u.insta_username,
        u.points_total,
        COUNT(DISTINCT p.id) as proofs_submitted,
        COUNT(DISTINCT CASE WHEN p.status = 'approved' THEN p.id END) as proofs_approved,
        COUNT(DISTINCT CASE WHEN p.status = 'pending' THEN p.id END) as proofs_pending
       FROM users u
       LEFT JOIN proofs p ON u.id = p.user_id
       WHERE u.id = ?
       GROUP BY u.id`,
      [userId]
    );

    const stats = result[0];
    
    // Calculate ranking
    const ranking = await query(
      `SELECT COUNT(*) + 1 as rank FROM users WHERE points_total > ?`,
      [stats.points_total]
    );

    stats.rank = ranking[0].rank;

    // Cache for 1 hour (non-blocking)
    try {
      await redis.setex(`user_stats:${userId}`, 3600, JSON.stringify(stats));
    } catch (cacheErr) {
      logger.warn(`Redis cache write failed for user stats ${userId}: ${cacheErr.message}`);
    }

    return stats;
  } catch (err) {
    logger.error('Error fetching user stats:', err);
    throw err;
  }
}

export async function getLeaderboard(limit = 20, offset = 0) {
  try {
    try {
      const cached = await redis.get(`leaderboard:${limit}:${offset}`);
      if (cached) return JSON.parse(cached);
    } catch (cacheErr) {
      logger.warn(`Redis cache read failed for leaderboard ${limit}:${offset}: ${cacheErr.message}`);
    }

    const result = await query(
      `SELECT 
        u.id,
        u.insta_username,
        u.points_total,
        COUNT(DISTINCT p.id) as total_proofs,
        COUNT(DISTINCT CASE WHEN p.status = 'approved' THEN p.id END) as approved_proofs
       FROM users u
       LEFT JOIN proofs p ON u.id = p.user_id
       WHERE u.role = 'promoter'
       GROUP BY u.id
       ORDER BY u.points_total DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    // Add ranking
    const leaderboard = result.map((user, index) => ({
      ...user,
      rank: offset + index + 1
    }));

    // Cache for 30 minutes (non-blocking)
    try {
      await redis.setex(`leaderboard:${limit}:${offset}`, 1800, JSON.stringify(leaderboard));
    } catch (cacheErr) {
      logger.warn(`Redis cache write failed for leaderboard ${limit}:${offset}: ${cacheErr.message}`);
    }

    return leaderboard;
  } catch (err) {
    logger.error('Error fetching leaderboard:', err);
    throw err;
  }
}

export async function getUserPointsHistory(userId, limit = 50) {
  try {
    const result = await query(
      `SELECT ph.*, p.mission_id, m.title
       FROM points_history ph
       JOIN proofs p ON ph.proof_id = p.id
       JOIN missions m ON p.mission_id = m.id
       WHERE ph.user_id = ?
       ORDER BY ph.created_at DESC
       LIMIT ?`,
      [userId, limit]
    );

    return result;
  } catch (err) {
    logger.error('Error fetching points history:', err);
    throw err;
  }
}

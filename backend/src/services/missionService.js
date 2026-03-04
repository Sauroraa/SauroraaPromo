import { query } from '../config/db.js';
import redis from '../config/redis.js';
import logger from '../utils/logger.js';

export async function createMission(data) {
  try {
    const result = await query(
      `INSERT INTO missions (title, description, action_type, points_per_proof, max_per_user, deadline, active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`,
      [
        data.title,
        data.description,
        data.action_type,
        data.points_per_proof,
        data.max_per_user,
        data.deadline
      ]
    );

    logger.info(`Mission created: ${result.insertId}`);

    // Cache invalidation
    await redis.del('missions:active');

    return result.insertId;
  } catch (err) {
    logger.error('Error creating mission:', err);
    throw err;
  }
}

export async function getActiveMissions() {
  try {
    // Try cache first
    const cached = await redis.get('missions:active');
    if (cached) return JSON.parse(cached);

    const result = await query(
      `SELECT * FROM missions 
       WHERE active = 1 AND (deadline IS NULL OR deadline > NOW())
       ORDER BY created_at DESC`
    );

    // Cache for 30 minutes
    await redis.setex('missions:active', 1800, JSON.stringify(result));

    return result;
  } catch (err) {
    logger.error('Error fetching active missions:', err);
    throw err;
  }
}

export async function getMissionById(missionId) {
  try {
    const result = await query(
      `SELECT * FROM missions WHERE id = ?`,
      [missionId]
    );
    return result[0] || null;
  } catch (err) {
    logger.error('Error fetching mission:', err);
    throw err;
  }
}

export async function getAllMissions(limit = 50, offset = 0) {
  try {
    const result = await query(
      `SELECT * FROM missions 
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return result;
  } catch (err) {
    logger.error('Error fetching missions:', err);
    throw err;
  }
}

export async function updateMission(missionId, data) {
  try {
    const fields = [];
    const values = [];

    Object.entries(data).forEach(([key, value]) => {
      if (['title', 'description', 'action_type', 'points_per_proof', 'max_per_user', 'deadline', 'active'].includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return null;

    values.push(missionId);

    await query(
      `UPDATE missions SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    logger.info(`Mission ${missionId} updated`);

    // Cache invalidation
    await redis.del('missions:active');

    return true;
  } catch (err) {
    logger.error('Error updating mission:', err);
    throw err;
  }
}

export async function deleteMission(missionId) {
  try {
    await query(
      `DELETE FROM missions WHERE id = ?`,
      [missionId]
    );

    logger.info(`Mission ${missionId} deleted`);

    // Cache invalidation
    await redis.del('missions:active');

    return true;
  } catch (err) {
    logger.error('Error deleting mission:', err);
    throw err;
  }
}

import { query } from '../config/db.js';
import logger from '../utils/logger.js';
import { getActiveMissions, createMission, updateMission, deleteMission, getAllMissions } from '../services/missionService.js';

export async function getMissions(req, res) {
  try {
    const missions = await getActiveMissions();
    res.json(missions);
  } catch (err) {
    logger.error('Error fetching missions:', err);
    res.status(500).json({ error: 'Failed to fetch missions' });
  }
}

export async function getMissionById(req, res) {
  try {
    const missionId = req.params.missionId;

    const result = await query(
      `SELECT * FROM missions WHERE id = ?`,
      [missionId]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    res.json(result[0]);
  } catch (err) {
    logger.error('Error fetching mission:', err);
    res.status(500).json({ error: 'Failed to fetch mission' });
  }
}

export async function getMissionProofStats(req, res) {
  try {
    const missionId = req.params.missionId;

    const stats = await query(
      `SELECT 
        COUNT(*) as total_submissions,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(images_count) as total_images
       FROM proofs WHERE mission_id = ?`,
      [missionId]
    );

    res.json(stats[0]);
  } catch (err) {
    logger.error('Error fetching mission stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

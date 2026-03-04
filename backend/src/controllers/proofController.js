import { query } from '../config/db.js';
import logger from '../utils/logger.js';
import { submitProof, getUserProofs, getProofById } from '../services/proofService.js';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function uploadProofs(req, res) {
  try {
    const userId = req.user.userId;
    const { missionId } = req.body;

    if (!missionId) {
      return res.status(400).json({ error: 'Mission ID required' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    if (req.files.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 images per submission' });
    }

    // Get mission
    const mission = await query(
      `SELECT * FROM missions WHERE id = ?`,
      [missionId]
    );

    if (mission.length === 0) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    // Check user proof count for this mission
    const userProofCount = await query(
      `SELECT COUNT(*) as count FROM proofs 
       WHERE user_id = ? AND mission_id = ? AND status IN ('pending', 'approved')`,
      [userId, missionId]
    );

    if (userProofCount[0].count > 0) {
      // Already has pending/approved proofs for this mission
      return res.status(403).json({ error: 'You already have pending or approved proofs for this mission' });
    }

    // Process images
    const processedImages = [];
    const userUploadDir = path.join(__dirname, '../../uploads/proofs', userId.toString());

    // Create directory if not exists
    await fs.mkdir(userUploadDir, { recursive: true });

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const filename = `${missionId}_${Date.now()}_${i}.webp`;
      const filepath = path.join(userUploadDir, filename);

      try {
        // Compress and convert to webp
        await sharp(file.path)
          .resize(1080, 1080, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(filepath);

        // Delete original
        await fs.unlink(file.path);

        // Calculate hash for duplicate detection
        const fileBuffer = await fs.readFile(filepath);
        const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        processedImages.push({ filename, hash });
      } catch (err) {
        logger.error(`Error processing image ${i}:`, err);
        throw err;
      }
    }

    // Check for duplicate images (by hash)
    const imageHashes = processedImages.map(img => img.hash);
    const duplicateCheck = await query(
      `SELECT image_hash FROM proof_images WHERE image_hash IN (?)`,
      [imageHashes]
    );

    if (duplicateCheck.length > 0) {
      return res.status(400).json({ error: 'Duplicate images detected' });
    }

    // Create proof record
    const proofId = await submitProof(userId, missionId, processedImages.length);

    // Create proof image records
    for (const img of processedImages) {
      await query(
        `INSERT INTO proof_images (proof_id, image_path, image_hash, created_at)
         VALUES (?, ?, ?, NOW())`,
        [proofId, img.filename, img.hash]
      );
    }

    logger.info(`Proof ${proofId} uploaded by user ${userId} with ${processedImages.length} images`);

    res.json({
      success: true,
      proofId,
      imagesCount: processedImages.length
    });
  } catch (err) {
    logger.error('Error uploading proofs:', err);
    res.status(500).json({ error: 'Failed to upload proofs' });
  }
}

export async function getUserSubmittedProofs(req, res) {
  try {
    const userId = req.user.userId;
    const proofs = await getUserProofs(userId);

    res.json(proofs);
  } catch (err) {
    logger.error('Error fetching user proofs:', err);
    res.status(500).json({ error: 'Failed to fetch proofs' });
  }
}

export async function getProofDetails(req, res) {
  try {
    const proofId = req.params.proofId;
    const userId = req.user.userId;

    const proof = await getProofById(proofId);

    if (!proof) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    // Check authorization
    if (proof.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get images
    const images = await query(
      `SELECT id, image_path, created_at FROM proof_images WHERE proof_id = ?`,
      [proofId]
    );

    res.json({
      ...proof,
      images
    });
  } catch (err) {
    logger.error('Error fetching proof details:', err);
    res.status(500).json({ error: 'Failed to fetch proof' });
  }
}

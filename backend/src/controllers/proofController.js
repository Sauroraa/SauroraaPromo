import { query } from '../config/db.js';
import logger from '../utils/logger.js';
import { submitProof, getUserProofs, getProofById } from '../services/proofService.js';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_BASE = path.join(__dirname, '../../uploads/proofs');

export async function uploadProofs(req, res) {
  try {
    const userId = req.user.userId;
    const { missionId } = req.body;

    if (!missionId) {
      return res.status(400).json({ error: 'Mission ID requis' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier uploadé' });
    }

    // Check mission exists and is active
    const missionRows = await query(
      `SELECT * FROM missions WHERE id = ? AND active = 1`,
      [missionId]
    );

    if (missionRows.length === 0) {
      return res.status(404).json({ error: 'Mission introuvable ou inactive' });
    }

    const mission = missionRows[0];

    // Check user doesn't already have pending/approved proof for this mission
    const existing = await query(
      `SELECT COUNT(*) as count FROM proofs
       WHERE user_id = ? AND mission_id = ? AND status IN ('pending', 'approved')`,
      [userId, missionId]
    );

    if (Number(existing[0].count) > 0) {
      return res.status(403).json({ error: 'Tu as déjà une preuve en attente ou approuvée pour cette mission' });
    }

    // Ensure upload directory exists before processing
    const userUploadDir = path.join(UPLOADS_BASE, userId.toString());
    await fs.mkdir(userUploadDir, { recursive: true });

    // Process images (from memory buffer — multer memoryStorage)
    const processedImages = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const filename = `${missionId}_${Date.now()}_${i}.webp`;
      const filepath = path.join(userUploadDir, filename);

      // Compress + convert to webp from buffer
      const webpBuffer = await sharp(file.buffer)
        .resize(1080, 1080, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      // Hash before writing (duplicate detection)
      const hash = crypto.createHash('sha256').update(webpBuffer).digest('hex');

      processedImages.push({ filename, filepath, buffer: webpBuffer, hash });
    }

    // Check for duplicate images across the whole DB
    const hashes = processedImages.map(img => img.hash);
    const duplicates = await query(
      `SELECT image_hash FROM proof_images WHERE image_hash IN (?)`,
      [hashes]
    );

    if (duplicates.length > 0) {
      return res.status(400).json({ error: 'Images en double détectées — ces screenshots ont déjà été soumis' });
    }

    // Write files to disk only after all checks pass
    for (const img of processedImages) {
      await fs.writeFile(img.filepath, img.buffer);
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

    logger.info(`Proof ${proofId} uploaded by user ${userId} (${processedImages.length} images, mission ${missionId})`);

    res.json({
      success: true,
      proofId,
      imagesCount: processedImages.length
    });
  } catch (err) {
    logger.error('Error uploading proofs:', err);
    res.status(500).json({ error: 'Erreur lors de l\'upload' });
  }
}

export async function getUserSubmittedProofs(req, res) {
  try {
    const userId = req.user.userId;
    const proofs = await getUserProofs(userId);
    res.json(proofs);
  } catch (err) {
    logger.error('Error fetching user proofs:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des preuves' });
  }
}

export async function getProofDetails(req, res) {
  try {
    const proofId = req.params.proofId;
    const userId = req.user.userId;

    const proof = await getProofById(proofId);

    if (!proof) {
      return res.status(404).json({ error: 'Preuve introuvable' });
    }

    // Only owner or admin can view
    if (Number(proof.user_id) !== Number(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const images = await query(
      `SELECT id, image_path, created_at FROM proof_images WHERE proof_id = ? ORDER BY created_at ASC`,
      [proofId]
    );

    res.json({ ...proof, images });
  } catch (err) {
    logger.error('Error fetching proof details:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération de la preuve' });
  }
}

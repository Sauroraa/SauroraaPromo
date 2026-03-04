import { query } from '../config/db.js';
import logger from '../utils/logger.js';

export async function errorHandler(err, req, res, next) {
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    user: req.user?.userId
  });

  // Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_PART_COUNT') {
      return res.status(400).json({ error: 'Too many parts' });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large (max 5MB)' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files (max 10)' });
    }
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
}

export async function notFound(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

export async function logRequest(req, res, next) {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    user: req.user?.userId
  });
  next();
}

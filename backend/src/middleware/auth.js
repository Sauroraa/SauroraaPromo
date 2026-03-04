import { verifyToken } from '../utils/jwt.js';
import logger from '../utils/logger.js';

export function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = decoded;
    logger.info(`User ${decoded.userId} authenticated`);
    next();
  } catch (err) {
    logger.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

export function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'admin') {
    logger.warn(`Unauthorized admin access attempt by user ${req.user?.userId}`);
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user?.role)) {
      logger.warn(`Unauthorized role access by user ${req.user?.userId} (${req.user?.role})`);
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
}

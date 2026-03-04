import { query } from '../config/db.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { generateToken, generateRefreshToken, verifyToken } from '../utils/jwt.js';
import logger from '../utils/logger.js';
import redis from '../config/redis.js';
import { sendWelcomeEmail } from '../services/emailService.js';

export async function register(req, res) {
  try {
    const { firstName, lastName, instaUsername, email, password, inviteCode } = req.body;

    if (!firstName || !lastName || !instaUsername || !email || !password) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }

    // Invite code always required — admins are created via seed script only
    const invite = await query(
      `SELECT * FROM invites WHERE code = ? AND used_by IS NULL AND expires_at > NOW()`,
      [inviteCode]
    );

    if (invite.length === 0) {
      return res.status(403).json({ error: 'Code d\'invitation invalide ou expiré' });
    }

    // Check if user exists
    const existingUser = await query(
      `SELECT id FROM users WHERE email = ? OR insta_username = ?`,
      [email, instaUsername]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'Email ou pseudo Instagram déjà utilisé' });
    }

    const passwordHash = await hashPassword(password);

    const result = await query(
      `INSERT INTO users (first_name, last_name, insta_username, email, password_hash, role, points_total, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'promoter', 0, 'active', NOW())`,
      [firstName, lastName, instaUsername, email, passwordHash]
    );

    const userId = result.insertId;

    // Mark invite as used
    await query(
      `UPDATE invites SET used_by = ? WHERE code = ?`,
      [userId, inviteCode]
    );

    logger.info(`New user registered: ${userId} (${email})`);

    // Send welcome email (non-blocking)
    sendWelcomeEmail({ email, firstName }).catch(err =>
      logger.warn('Welcome email failed:', err.message)
    );

    const accessToken = generateToken(userId, 'promoter');
    const refreshTokenStr = generateRefreshToken(userId);

    await redis.setEx(`refresh_token:${userId}`, 7 * 24 * 60 * 60, refreshTokenStr);

    res.status(201).json({
      success: true,
      user: { id: userId, email, instaUsername, firstName, lastName, role: 'promoter' },
      accessToken,
      refreshToken: refreshTokenStr
    });
  } catch (err) {
    logger.error('Registration error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const result = await query(
      `SELECT * FROM users WHERE email = ? AND status = 'active'`,
      [email]
    );

    if (result.length === 0) {
      logger.warn(`Login attempt for non-existent/suspended user: ${email}`);
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const user = result[0];

    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      logger.warn(`Failed login for user: ${email}`);
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    await query(`UPDATE users SET last_login = NOW() WHERE id = ?`, [user.id]);

    logger.info(`User logged in: ${user.id} (${email})`);

    const accessToken = generateToken(user.id, user.role);
    const refreshTokenStr = generateRefreshToken(user.id);

    await redis.setEx(`refresh_token:${user.id}`, 7 * 24 * 60 * 60, refreshTokenStr);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        instaUsername: user.insta_username,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        pointsTotal: user.points_total
      },
      accessToken,
      refreshToken: refreshTokenStr
    });
  } catch (err) {
    logger.error('Login error:', err);
    res.status(500).json({ error: 'Erreur de connexion' });
  }
}

export async function logout(req, res) {
  try {
    const userId = req.user.userId;
    await redis.del(`refresh_token:${userId}`);
    logger.info(`User logged out: ${userId}`);
    res.json({ success: true });
  } catch (err) {
    logger.error('Logout error:', err);
    res.status(500).json({ error: 'Erreur de déconnexion' });
  }
}

export async function getCurrentUser(req, res) {
  try {
    const result = await query(
      `SELECT id, email, insta_username, first_name, last_name, role, points_total, status, created_at, last_login
       FROM users WHERE id = ?`,
      [req.user.userId]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    const user = result[0];
    res.json({
      id: user.id,
      email: user.email,
      instaUsername: user.insta_username,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      pointsTotal: user.points_total,
      status: user.status,
      createdAt: user.created_at,
      lastLogin: user.last_login
    });
  } catch (err) {
    logger.error('Get current user error:', err);
    res.status(500).json({ error: 'Erreur de récupération du profil' });
  }
}

export async function refreshToken(req, res) {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Refresh token requis' });
    }

    // Decode the refresh token to get userId
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Refresh token invalide' });
    }

    const userId = decoded.userId;
    const storedToken = await redis.get(`refresh_token:${userId}`);

    if (!storedToken || storedToken !== token) {
      logger.warn(`Invalid refresh token attempt for user ${userId}`);
      return res.status(401).json({ error: 'Refresh token invalide ou expiré' });
    }

    const userRows = await query(`SELECT id, role FROM users WHERE id = ? AND status = 'active'`, [userId]);
    if (userRows.length === 0) {
      return res.status(401).json({ error: 'Utilisateur introuvable ou suspendu' });
    }

    const newAccessToken = generateToken(userId, userRows[0].role);
    const newRefreshToken = generateRefreshToken(userId);

    await redis.setEx(`refresh_token:${userId}`, 7 * 24 * 60 * 60, newRefreshToken);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    logger.error('Refresh token error:', err);
    res.status(500).json({ error: 'Erreur de renouvellement du token' });
  }
}

import { query } from '../config/db.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { generateToken, generateRefreshToken, verifyToken } from '../utils/jwt.js';
import logger from '../utils/logger.js';
import redis from '../config/redis.js';
import { sendWelcomeEmail } from '../services/emailService.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import { randomBytes } from 'crypto';

async function cacheSetEx(key, ttl, value) {
  try {
    await redis.setEx(key, ttl, value);
  } catch (err) {
    logger.warn(`Redis setEx failed for ${key}: ${err.message}`);
  }
}

async function cacheGet(key) {
  try {
    return await redis.get(key);
  } catch (err) {
    logger.warn(`Redis get failed for ${key}: ${err.message}`);
    return null;
  }
}

async function cacheDel(key) {
  try {
    await redis.del(key);
  } catch (err) {
    logger.warn(`Redis del failed for ${key}: ${err.message}`);
  }
}

async function getValidInvite(tokenOrCode) {
  const inviteRows = await query(
    `SELECT *
     FROM invites
     WHERE (token = ? OR code = ?)
       AND used_by IS NULL
       AND expires_at > NOW()
     LIMIT 1`,
    [tokenOrCode, tokenOrCode]
  );

  return inviteRows[0] || null;
}

async function insertUserWithOptionalPhone({ firstName, lastName, phone, instaUsername, email, passwordHash, role }) {
  try {
    return await query(
      `INSERT INTO users (first_name, last_name, phone, insta_username, email, password_hash, role, points_total, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'active', NOW())`,
      [firstName, lastName, phone || null, instaUsername, email, passwordHash, role]
    );
  } catch (err) {
    if (String(err?.message || '').includes("Unknown column 'phone'")) {
      return query(
        `INSERT INTO users (first_name, last_name, insta_username, email, password_hash, role, points_total, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, 'active', NOW())`,
        [firstName, lastName, instaUsername, email, passwordHash, role]
      );
    }
    throw err;
  }
}

async function markInviteAsUsed(inviteId, userId) {
  try {
    await query(
      `UPDATE invites SET used_by = ?, used_at = NOW() WHERE id = ?`,
      [userId, inviteId]
    );
  } catch (err) {
    if (String(err?.message || '').includes("Unknown column 'used_at'")) {
      await query(
        `UPDATE invites SET used_by = ? WHERE id = ?`,
        [userId, inviteId]
      );
      return;
    }
    throw err;
  }
}

export async function register(req, res) {
  try {
    const inviteToken = req.body.inviteToken || req.body.token || req.body.inviteCode || req.body.code;
    const invite = await getValidInvite(inviteToken);
    if (!invite) {
      return res.status(403).json({ error: 'Code d\'invitation invalide ou expiré' });
    }

    const firstName = req.body.firstName || invite.first_name;
    const lastName = req.body.lastName || invite.last_name;
    const phone = req.body.phone || invite.phone || null;
    const instaUsername = req.body.instaUsername || req.body.instagramUsername;
    const email = req.body.email || invite.email;
    const password = req.body.password;
    const role = invite.role || 'promoter';

    if (!firstName || !lastName || !instaUsername || !email || !password) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }

    if (invite.email && email.toLowerCase() !== invite.email.toLowerCase()) {
      return res.status(400).json({ error: 'L\'email ne correspond pas à l\'invitation' });
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

    const result = await insertUserWithOptionalPhone({
      firstName,
      lastName,
      phone,
      instaUsername,
      email,
      passwordHash,
      role
    });

    const userId = result.insertId;

    // Mark invite as used
    await markInviteAsUsed(invite.id, userId);

    logger.info(`New user registered: ${userId} (${email})`);

    // Send welcome email (non-blocking)
    sendWelcomeEmail({ email, firstName }).catch(err =>
      logger.warn('Welcome email failed:', err.message)
    );

    const accessToken = generateToken(userId, 'promoter');
    const refreshTokenStr = generateRefreshToken(userId);

    await cacheSetEx(`refresh_token:${userId}`, 7 * 24 * 60 * 60, refreshTokenStr);

    res.status(201).json({
      success: true,
      user: { id: userId, email, instaUsername, firstName, lastName, phone, role },
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

    await cacheSetEx(`refresh_token:${user.id}`, 7 * 24 * 60 * 60, refreshTokenStr);

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
    await cacheDel(`refresh_token:${userId}`);
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
      `SELECT id, email, insta_username, first_name, last_name, phone, role, points_total, status, created_at, last_login
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
      phone: user.phone || null,
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
    const storedToken = await cacheGet(`refresh_token:${userId}`);

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

    await cacheSetEx(`refresh_token:${userId}`, 7 * 24 * 60 * 60, newRefreshToken);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    logger.error('Refresh token error:', err);
    res.status(500).json({ error: 'Erreur de renouvellement du token' });
  }
}

export async function getInviteByToken(req, res) {
  try {
    const token = req.params.token;
    const invite = await getValidInvite(token);
    if (!invite) {
      return res.status(404).json({ error: 'Invitation invalide ou expirée' });
    }

    res.json({
      email: invite.email,
      firstName: invite.first_name,
      lastName: invite.last_name,
      phone: invite.phone || null,
      role: invite.role || 'promoter',
      expiresAt: invite.expires_at
    });
  } catch (err) {
    logger.error('Get invite by token error:', err);
    res.status(500).json({ error: 'Erreur de récupération de l\'invitation' });
  }
}

export async function acceptInvite(req, res) {
  return register(req, res);
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    const users = await query(
      `SELECT id, first_name, email, status FROM users WHERE email = ? LIMIT 1`,
      [email]
    );

    // Always return success to avoid email enumeration.
    if (users.length === 0 || users[0].status !== 'active') {
      return res.json({ success: true, message: 'Si le compte existe, un email a ete envoye.' });
    }

    const user = users[0];
    const token = randomBytes(32).toString('hex');
    await cacheSetEx(`password_reset:${token}`, 60 * 60, String(user.id));

    sendPasswordResetEmail({
      to: user.email,
      firstName: user.first_name,
      resetToken: token
    }).catch((err) => logger.warn('Password reset email failed:', err.message));

    res.json({ success: true, message: 'Si le compte existe, un email a ete envoye.' });
  } catch (err) {
    logger.error('Forgot password error:', err);
    res.status(500).json({ error: 'Erreur mot de passe oublie' });
  }
}

export async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token et mot de passe requis' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caracteres' });
    }

    const userId = await cacheGet(`password_reset:${token}`);
    if (!userId) {
      return res.status(400).json({ error: 'Lien invalide ou expire' });
    }

    const passwordHash = await hashPassword(password);
    await query(`UPDATE users SET password_hash = ? WHERE id = ?`, [passwordHash, userId]);

    await cacheDel(`password_reset:${token}`);
    await cacheDel(`refresh_token:${userId}`);

    logger.info(`Password reset completed for user ${userId}`);
    res.json({ success: true });
  } catch (err) {
    logger.error('Reset password error:', err);
    res.status(500).json({ error: 'Erreur de reinitialisation du mot de passe' });
  }
}

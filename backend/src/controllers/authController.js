import { query } from '../config/db.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { generateToken, generateRefreshToken } from '../utils/jwt.js';
import logger from '../utils/logger.js';
import redis from '../config/redis.js';

export async function register(req, res) {
  try {
    const { firstName, lastName, instaUsername, email, password, inviteCode } = req.body;

    // Validation
    if (!firstName || !lastName || !instaUsername || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check invite code if not admin
    if (req.body.role !== 'admin') {
      const invite = await query(
        `SELECT * FROM invites WHERE code = ? AND used_by IS NULL AND expires_at > NOW()`,
        [inviteCode]
      );

      if (invite.length === 0) {
        return res.status(403).json({ error: 'Invalid or expired invite code' });
      }
    }

    // Check if user exists
    const existingUser = await query(
      `SELECT id FROM users WHERE email = ? OR insta_username = ?`,
      [email, instaUsername]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const result = await query(
      `INSERT INTO users (first_name, last_name, insta_username, email, password_hash, role, points_total, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'promoter', 0, 'active', NOW())`,
      [firstName, lastName, instaUsername, email, passwordHash]
    );

    const userId = result.insertId;

    // Mark invite as used
    if (inviteCode) {
      await query(
        `UPDATE invites SET used_by = ? WHERE code = ?`,
        [userId, inviteCode]
      );
    }

    logger.info(`New user registered: ${userId} (${email})`);

    // Generate tokens
    const accessToken = generateToken(userId, 'promoter');
    const refreshToken = generateRefreshToken(userId);

    // Store refresh token in Redis
    await redis.setex(`refresh_token:${userId}`, 7 * 24 * 60 * 60, refreshToken);

    res.status(201).json({
      success: true,
      user: { id: userId, email, instaUsername, firstName, lastName },
      accessToken,
      refreshToken
    });
  } catch (err) {
    logger.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const result = await query(
      `SELECT * FROM users WHERE email = ?`,
      [email]
    );

    if (result.length === 0) {
      logger.warn(`Login attempt for non-existent user: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result[0];

    // Compare password
    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      logger.warn(`Failed login for user: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await query(
      `UPDATE users SET last_login = NOW() WHERE id = ?`,
      [user.id]
    );

    logger.info(`User logged in: ${user.id} (${email})`);

    // Generate tokens
    const accessToken = generateToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in Redis
    await redis.setex(`refresh_token:${user.id}`, 7 * 24 * 60 * 60, refreshToken);

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
      refreshToken
    });
  } catch (err) {
    logger.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
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
    res.status(500).json({ error: 'Logout failed' });
  }
}

export async function getCurrentUser(req, res) {
  try {
    const result = await query(
      `SELECT id, email, insta_username, first_name, last_name, role, points_total, created_at, last_login
       FROM users WHERE id = ?`,
      [req.user.userId]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: 'User not found' });
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
      createdAt: user.created_at,
      lastLogin: user.last_login
    });
  } catch (err) {
    logger.error('Get current user error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

export async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const userId = req.user.userId;
    const storedToken = await redis.get(`refresh_token:${userId}`);

    if (storedToken !== refreshToken) {
      logger.warn(`Invalid refresh token for user ${userId}`);
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Get user to get role
    const user = await query(
      `SELECT role FROM users WHERE id = ?`,
      [userId]
    );

    const newAccessToken = generateToken(userId, user[0].role);
    const newRefreshToken = generateRefreshToken(userId);

    await redis.setex(`refresh_token:${userId}`, 7 * 24 * 60 * 60, newRefreshToken);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    logger.error('Refresh token error:', err);
    res.status(500).json({ error: 'Token refresh failed' });
  }
}

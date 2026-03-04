/**
 * Admin seed script
 * Usage: node scripts/seed-admin.js
 * Run once after first docker-compose up
 */
import bcrypt from 'bcryptjs';
import mariadb from 'mariadb';
import dotenv from 'dotenv';

dotenv.config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'promoteam',
  password: process.env.DB_PASSWORD || 'promoteam_pass',
  database: process.env.DB_NAME || 'promoteam',
  connectionLimit: 1
});

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function seed() {
  let conn;
  try {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required in environment');
    }

    conn = await pool.getConnection();

    // Check if admin already exists
    const existing = await conn.query(
      'SELECT id FROM users WHERE email = ?',
      [ADMIN_EMAIL]
    );

    if (existing.length > 0) {
      console.log(`Admin already exists: ${ADMIN_EMAIL}`);
      return;
    }

    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await conn.query(
      `INSERT INTO users (first_name, last_name, insta_username, email, password_hash, role, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'admin', 'active', NOW())`,
      ['Admin', 'Promoteam', 'promoteam_admin', ADMIN_EMAIL, hash]
    );

    console.log('Admin user created successfully:');
    console.log(`  Email:    ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log('');
    console.log('IMPORTANT: Change the password immediately after first login!');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    if (conn) conn.end();
    await pool.end();
  }
}

seed();

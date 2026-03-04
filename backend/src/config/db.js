import mariadb from 'mariadb';
import dotenv from 'dotenv';

dotenv.config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'mariadb',
  user: process.env.DB_USER || 'promoteam',
  password: process.env.DB_PASSWORD || 'promoteam_pass',
  database: process.env.DB_NAME || 'promoteam',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
});

export async function query(sql, values) {
  let conn;
  try {
    conn = await pool.getConnection();
    return await conn.query(sql, values);
  } catch (err) {
    console.error('Database error:', err);
    throw err;
  } finally {
    if (conn) return conn.end();
  }
}

export async function getConnection() {
  return pool.getConnection();
}

export default pool;

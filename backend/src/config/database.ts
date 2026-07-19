import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME || 'savebite',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const getConnection = async () => {
  return await pool.getConnection();
};

export const executeQuery = async (query: string, params: any[] = []) => {
  const connection = await getConnection();
  try {
    const [results] = await connection.execute(query, params);
    return results;
  } finally {
    connection.release();
  }
};

export default pool;

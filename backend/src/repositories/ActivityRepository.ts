import { getConnection } from '../config/database';

export class ActivityRepository {
  async create(userId: number, action: string, entityType: string, entityId?: number, details?: string | Record<string, unknown>) {
    const connection = await getConnection();
    try {
      const normalizedDetails =
        details === undefined || details === null
          ? null
          : typeof details === 'string'
            ? JSON.stringify({ text: details })
            : JSON.stringify(details);

      const [result] = await connection.execute(
        `INSERT INTO activity_logs (userId, action, entityType, entityId, details)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, action, entityType, entityId ?? null, normalizedDetails]
      );
      return result;
    } finally {
      connection.release();
    }
  }

  async findByUserId(userId: number, limit: number = 5) {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT id, action, entityType, entityId, details, createdAt
         FROM activity_logs WHERE userId = ? ORDER BY createdAt DESC LIMIT ?`,
        [userId, limit]
      );
      return rows as any[];
    } finally {
      connection.release();
    }
  }
}

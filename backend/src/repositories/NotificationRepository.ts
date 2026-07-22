import { BaseRepository } from './BaseRepository';
import { Notification } from '../types';
import { getConnection } from '../config/database';

export class NotificationRepository extends BaseRepository<Notification> {
  protected tableName = 'notifications';

  async findByUserId(userId: number, limit: number = 50, offset: number = 0): Promise<Notification[]> {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM ${this.tableName} WHERE userId = ? 
         ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );
      return rows as Notification[];
    } finally {
      connection.release();
    }
  }

  async countByUserId(userId: number): Promise<number> {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT COUNT(*) as count FROM ${this.tableName} WHERE userId = ?`,
        [userId]
      );
      return (rows as any[])[0].count;
    } finally {
      connection.release();
    }
  }

  async countUnreadByUserId(userId: number): Promise<number> {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT COUNT(*) as count FROM ${this.tableName} WHERE userId = ? AND isRead = FALSE`,
        [userId]
      );
      return (rows as any[])[0].count;
    } finally {
      connection.release();
    }
  }

  async markAsRead(notificationId: number): Promise<any> {
    const connection = await getConnection();
    try {
      const [result] = await connection.execute(
        `UPDATE ${this.tableName} SET isRead = TRUE WHERE id = ?`,
        [notificationId]
      );
      return result;
    } finally {
      connection.release();
    }
  }

  async markAllAsRead(userId: number): Promise<any> {
    const connection = await getConnection();
    try {
      const [result] = await connection.execute(
        `UPDATE ${this.tableName} SET isRead = TRUE WHERE userId = ? AND isRead = FALSE`,
        [userId]
      );
      return result;
    } finally {
      connection.release();
    }
  }

  async deleteOldNotifications(userId: number, daysOld: number = 30): Promise<any> {
    const connection = await getConnection();
    try {
      const [result] = await connection.execute(
        `DELETE FROM ${this.tableName} WHERE userId = ? AND createdAt < DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [userId, daysOld]
      );
      return result;
    } finally {
      connection.release();
    }
  }
}

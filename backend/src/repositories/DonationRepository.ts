import { BaseRepository } from './BaseRepository';
import { Donation } from '../types';
import { getConnection } from '../config/database';

export class DonationRepository extends BaseRepository<Donation> {
  protected tableName = 'donations';

  async findByDonorId(donorId: number, limit: number = 100, offset: number = 0): Promise<Donation[]> {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT d.*, fi.foodName, u.fullName as donorName
         FROM ${this.tableName} d
         JOIN food_inventory fi ON d.foodInventoryId = fi.id
         JOIN users u ON d.donorId = u.id
         WHERE d.donorId = ? 
         ORDER BY d.createdAt DESC LIMIT ? OFFSET ?`,
        [donorId, limit, offset]
      );
      return rows as Donation[];
    } finally {
      connection.release();
    }
  }

  async findAvailable(limit: number = 100, offset: number = 0): Promise<Donation[]> {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT d.*, fi.foodName, u.fullName as donorName
         FROM ${this.tableName} d
         JOIN food_inventory fi ON d.foodInventoryId = fi.id
         JOIN users u ON d.donorId = u.id
         WHERE d.status = 'available' AND d.availableUntil > NOW()
         ORDER BY d.createdAt DESC LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      return rows as Donation[];
    } finally {
      connection.release();
    }
  }

  async countAvailable(): Promise<number> {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT COUNT(*) as count FROM ${this.tableName} 
         WHERE status = 'available' AND availableUntil > NOW()`
      );
      return (rows as any[])[0].count;
    } finally {
      connection.release();
    }
  }

  async countByUserId(donorId: number): Promise<number> {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT COUNT(*) as count FROM ${this.tableName} WHERE donorId = ?`,
        [donorId]
      );
      return (rows as any[])[0].count;
    } finally {
      connection.release();
    }
  }

  async searchAvailable(query: string, categoryId?: number, limit: number = 50): Promise<Donation[]> {
    const connection = await getConnection();
    try {
      let sql = `SELECT d.*, fi.foodName, u.fullName as donorName
                 FROM ${this.tableName} d
                 JOIN food_inventory fi ON d.foodInventoryId = fi.id
                 JOIN users u ON d.donorId = u.id
                 WHERE d.status = 'available' AND d.availableUntil > NOW()
                 AND fi.foodName LIKE ?`;
      const params: any[] = [`%${query}%`];

      if (categoryId) {
        sql += ` AND fi.categoryId = ?`;
        params.push(categoryId);
      }

      sql += ` ORDER BY d.createdAt DESC LIMIT ?`;
      params.push(limit);

      const [rows] = await connection.execute(sql, params);
      return rows as Donation[];
    } finally {
      connection.release();
    }
  }

  async findByFoodInventoryId(foodInventoryId: number): Promise<Donation | null> {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM ${this.tableName} WHERE foodInventoryId = ?`,
        [foodInventoryId]
      );
      return (rows as Donation[])[0] || null;
    } finally {
      connection.release();
    }
  }

  async updateStatus(id: number, status: string): Promise<any> {
    const connection = await getConnection();
    try {
      const [result] = await connection.execute(
        `UPDATE ${this.tableName} SET status = ? WHERE id = ?`,
        [status, id]
      );
      return result;
    } finally {
      connection.release();
    }
  }
}

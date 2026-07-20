import { BaseRepository } from './BaseRepository';
import { FoodInventory } from '../types';
import { getConnection } from '../config/database';

export class FoodInventoryRepository extends BaseRepository<FoodInventory> {
  protected tableName = 'food_inventory';

  async findByUserId(userId: number, limit: number = 100, offset: number = 0): Promise<FoodInventory[]> {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT fi.*, c.name AS category, sl.name AS storageLocation
         FROM ${this.tableName} fi
         JOIN food_categories c ON c.id = fi.categoryId
         JOIN storage_locations sl ON sl.id = fi.storageLocationId
         WHERE fi.userId = ? AND fi.deletedAt IS NULL
         ORDER BY expiryDate ASC LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );
      return rows as FoodInventory[];
    } finally {
      connection.release();
    }
  }

  async countByUserId(userId: number): Promise<number> {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT COUNT(*) as count FROM ${this.tableName} WHERE userId = ? AND deletedAt IS NULL`,
        [userId]
      );
      return (rows as any[])[0].count;
    } finally {
      connection.release();
    }
  }

  async findExpiringByUserId(userId: number, daysAhead: number = 7): Promise<FoodInventory[]> {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT fi.*, c.name AS category, sl.name AS storageLocation
         FROM ${this.tableName} fi
         JOIN food_categories c ON c.id = fi.categoryId
         JOIN storage_locations sl ON sl.id = fi.storageLocationId
         WHERE fi.userId = ? AND fi.deletedAt IS NULL
         AND fi.expiryDate BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? DAY)
         ORDER BY fi.expiryDate ASC`,
        [userId, daysAhead]
      );
      return rows as FoodInventory[];
    } finally {
      connection.release();
    }
  }

  async findExpiredByUserId(userId: number): Promise<FoodInventory[]> {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT fi.*, c.name AS category, sl.name AS storageLocation
         FROM ${this.tableName} fi
         JOIN food_categories c ON c.id = fi.categoryId
         JOIN storage_locations sl ON sl.id = fi.storageLocationId
         WHERE fi.userId = ? AND fi.deletedAt IS NULL AND fi.expiryDate < NOW()`,
        [userId]
      );
      return rows as FoodInventory[];
    } finally {
      connection.release();
    }
  }

  async searchByUserId(userId: number, query: string, limit: number = 50): Promise<FoodInventory[]> {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT fi.*, c.name AS category, sl.name AS storageLocation
         FROM ${this.tableName} fi
         JOIN food_categories c ON c.id = fi.categoryId
         JOIN storage_locations sl ON sl.id = fi.storageLocationId
         WHERE fi.userId = ? AND fi.deletedAt IS NULL AND fi.foodName LIKE ?
         ORDER BY fi.expiryDate ASC LIMIT ?`,
        [userId, `%${query}%`, limit]
      );
      return rows as FoodInventory[];
    } finally {
      connection.release();
    }
  }

  async softDelete(id: number): Promise<any> {
    const connection = await getConnection();
    try {
      const [result] = await connection.execute(
        `UPDATE ${this.tableName} SET deletedAt = NOW() WHERE id = ?`,
        [id]
      );
      return result;
    } finally {
      connection.release();
    }
  }
}

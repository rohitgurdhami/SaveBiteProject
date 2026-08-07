import { BaseRepository } from './BaseRepository';
import { User } from '../types';
import { getConnection } from '../config/database';

export class UserRepository extends BaseRepository<User> {
  protected tableName = 'users';

  async findByEmail(email: string): Promise<User | null> {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM ${this.tableName} WHERE email = ?`,
        [email]
      );
      return (rows as User[])[0] || null;
    } finally {
      connection.release();
    }
  }

  async findVerifiedUsers(limit: number = 100, offset: number = 0): Promise<User[]> {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM ${this.tableName} WHERE emailVerified = TRUE LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      return rows as User[];
    } finally {
      connection.release();
    }
  }

  async countByEmail(email: string): Promise<number> {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT COUNT(*) as count FROM ${this.tableName} WHERE email = ?`,
        [email]
      );
      return (rows as any[])[0].count;
    } finally {
      connection.release();
    }
  }

  async updateEmailVerification(userId: number, verified: boolean): Promise<any> {
    const connection = await getConnection();
    try {
      const [result] = await connection.execute(
        `UPDATE ${this.tableName} SET emailVerified = ? WHERE id = ?`,
        [verified, userId]
      );
      return result;
    } finally {
      connection.release();
    }
  }

  async updatePassword(userId: number, hashedPassword: string): Promise<any> {
    const connection = await getConnection();
    try {
      const [result] = await connection.execute(
        `UPDATE ${this.tableName} SET password = ? WHERE id = ?`,
        [hashedPassword, userId]
      );
      return result;
    } finally {
      connection.release();
    }
  }

  async enableTwoFactor(userId: number, secret: string): Promise<any> {
    const connection = await getConnection();
    try {
      const [result] = await connection.execute(
        `UPDATE ${this.tableName} SET twoFactorEnabled = TRUE, twoFactorSecret = ? WHERE id = ?`,
        [secret, userId]
      );
      return result;
    } finally {
      connection.release();
    }
  }
}

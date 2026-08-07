import { getConnection } from '../config/database';

export abstract class BaseRepository<T> {
  protected tableName: string = '';

  async findById(id: number): Promise<T | null> {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [id]
      );
      return (rows as T[])[0] || null;
    } finally {
      connection.release();
    }
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<T[]> {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM ${this.tableName} LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      return rows as T[];
    } finally {
      connection.release();
    }
  }

  async count(): Promise<number> {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT COUNT(*) as count FROM ${this.tableName}`
      );
      return (rows as any[])[0].count;
    } finally {
      connection.release();
    }
  }

  async create(data: Partial<T>): Promise<any> {
    const connection = await getConnection();
    try {
      const columns = Object.keys(data);
      const values = Object.values(data) as any[];
      const placeholders = columns.map(() => '?').join(',');

      const [result] = await connection.execute(
        `INSERT INTO ${this.tableName} (${columns.join(',')}) VALUES (${placeholders})`,
        values
      );

      return result;
    } finally {
      connection.release();
    }
  }

  async update(id: number, data: Partial<T>): Promise<any> {
    const connection = await getConnection();
    try {
      const columns = Object.keys(data);
      const values = [...Object.values(data), id] as any[];
      const setClause = columns.map(col => `${col} = ?`).join(',');

      const [result] = await connection.execute(
        `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`,
        values
      );

      return result;
    } finally {
      connection.release();
    }
  }

  async delete(id: number): Promise<any> {
    const connection = await getConnection();
    try {
      const [result] = await connection.execute(
        `DELETE FROM ${this.tableName} WHERE id = ?`,
        [id]
      );

      return result;
    } finally {
      connection.release();
    }
  }
}

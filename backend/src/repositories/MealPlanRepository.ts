import { BaseRepository } from './BaseRepository';
import { MealPlan, MealItem } from '../types';
import { getConnection } from '../config/database';

export class MealPlanRepository extends BaseRepository<MealPlan> {
  protected tableName = 'meal_plans';

  private parseJsonValue(value: any, fallback: any) {
    if (!value) return fallback;
    if (typeof value !== 'string') return value;

    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  async findByUserIdAndWeek(userId: number, weekStartDate: string): Promise<MealPlan | null> {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM ${this.tableName} WHERE userId = ? AND weekStartDate = ?`,
        [userId, weekStartDate]
      );

      if ((rows as any[]).length === 0) return null;

      const row = (rows as any[])[0];
      const [mealRows] = await connection.execute(
        `SELECT * FROM meal_items WHERE mealPlanId = ?
         ORDER BY FIELD(mealType, 'breakfast', 'lunch', 'dinner', 'snack'), day`,
        [row.id]
      );

      return {
        ...row,
        meals: (mealRows as any[]).map((meal) => ({
          ...meal,
          ingredientItems: this.parseJsonValue(meal.ingredientItemsJson, []),
        })),
      } as MealPlan;
    } finally {
      connection.release();
    }
  }

  async findByUserId(userId: number, limit: number = 100, offset: number = 0): Promise<MealPlan[]> {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM ${this.tableName} WHERE userId = ? 
         ORDER BY weekStartDate DESC LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );
      return rows as MealPlan[];
    } finally {
      connection.release();
    }
  }

  async findMealItemsByPlanId(mealPlanId: number): Promise<MealItem[]> {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM meal_items WHERE mealPlanId = ? ORDER BY FIELD(mealType, 'breakfast', 'lunch', 'dinner', 'snack'), day`,
        [mealPlanId]
      );
      return rows as MealItem[];
    } finally {
      connection.release();
    }
  }

  async addMealItem(mealPlanId: number, mealItem: any): Promise<any> {
    const connection = await getConnection();
    try {
      const [result] = await connection.execute(
        `INSERT INTO meal_items (
           mealPlanId, day, mealType, scheduledAt, foodName, notes, status, completedAt, ingredientItemsJson
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          mealPlanId,
          mealItem.day,
          mealItem.mealType,
          mealItem.scheduledAt ?? null,
          mealItem.foodName,
          mealItem.notes ?? null,
          mealItem.status ?? 'planned',
          mealItem.completedAt ?? null,
          mealItem.ingredientItems ? JSON.stringify(mealItem.ingredientItems) : null,
        ]
      );
      return result;
    } finally {
      connection.release();
    }
  }

  async updateMealItem(mealItemId: number, mealItem: Partial<MealItem>): Promise<any> {
    const connection = await getConnection();
    try {
      const values = [
        mealItem.day ?? null,
        mealItem.mealType ?? null,
        mealItem.scheduledAt ?? null,
        mealItem.foodName ?? null,
        mealItem.notes ?? null,
        mealItem.status ?? null,
        mealItem.completedAt ?? null,
        mealItem.ingredientItems ? JSON.stringify(mealItem.ingredientItems) : null,
        mealItemId,
      ];
      const [result] = await connection.execute(
        `UPDATE meal_items
         SET day = COALESCE(?, day),
             mealType = COALESCE(?, mealType),
             scheduledAt = COALESCE(?, scheduledAt),
             foodName = COALESCE(?, foodName),
             notes = COALESCE(?, notes),
             status = COALESCE(?, status),
             completedAt = COALESCE(?, completedAt),
             ingredientItemsJson = COALESCE(?, ingredientItemsJson)
         WHERE id = ?`,
        values
      );
      return result;
    } finally {
      connection.release();
    }
  }

  async markMealItemCompleted(mealItemId: number): Promise<any> {
    const connection = await getConnection();
    try {
      const [result] = await connection.execute(
        `UPDATE meal_items SET status = 'completed', completedAt = NOW() WHERE id = ?`,
        [mealItemId]
      );
      return result;
    } finally {
      connection.release();
    }
  }

  async removeMealItem(mealItemId: number): Promise<any> {
    const connection = await getConnection();
    try {
      const [result] = await connection.execute(
        `DELETE FROM meal_items WHERE id = ?`,
        [mealItemId]
      );
      return result;
    } finally {
      connection.release();
    }
  }
}

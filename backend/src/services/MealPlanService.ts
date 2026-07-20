import { MealPlanRepository } from '../repositories/MealPlanRepository';
import { FoodInventoryRepository } from '../repositories/FoodInventoryRepository';
import { NotificationService } from './NotificationService';
import { ActivityRepository } from '../repositories/ActivityRepository';
import { getConnection } from '../config/database';

export class MealPlanService {
  private mealPlanRepository = new MealPlanRepository();
  private foodInventoryRepository = new FoodInventoryRepository();
  private notificationService = new NotificationService();
  private activityRepository = new ActivityRepository();

  async getMealPlanForWeek(userId: number, weekStartDate: string) {
    let mealPlan = await this.mealPlanRepository.findByUserIdAndWeek(userId, weekStartDate);
    
    if (!mealPlan) {
      // Create new meal plan if it doesn't exist
      const result = await this.mealPlanRepository.create({
        userId,
        weekStartDate: new Date(weekStartDate),
        title: `Week of ${weekStartDate}`,
      });

      mealPlan = await this.mealPlanRepository.findById(result.insertId);
    }

    return mealPlan;
  }

  async listMealPlans(userId: number, limit: number = 20) {
    return await this.mealPlanRepository.findByUserId(userId, limit, 0);
  }

  async createMealPlan(userId: number, weekStartDate: string, title?: string) {
    const result = await this.mealPlanRepository.create({
      userId,
      weekStartDate: new Date(weekStartDate),
      title: title || `Week of ${weekStartDate}`,
    });

    const plan = await this.mealPlanRepository.findById(result.insertId);
    await this.activityRepository.create(userId, 'Created meal plan', 'meal_plan', result.insertId, {
      weekStartDate,
      title: title || `Week of ${weekStartDate}`,
    });

    return plan;
  }

  async updateMealPlan(userId: number, mealPlanId: number, data: { title?: string; weekStartDate?: string }) {
    const mealPlan = await this.mealPlanRepository.findById(mealPlanId);
    if (!mealPlan || (mealPlan as any).userId !== userId) {
      throw new Error('Meal plan not found or unauthorized');
    }

    await this.mealPlanRepository.update(mealPlanId, {
      title: data.title,
      weekStartDate: data.weekStartDate ? new Date(data.weekStartDate) : undefined,
    } as any);

    return await this.mealPlanRepository.findById(mealPlanId);
  }

  async deleteMealPlan(userId: number, mealPlanId: number) {
    const mealPlan = await this.mealPlanRepository.findById(mealPlanId);
    if (!mealPlan || (mealPlan as any).userId !== userId) {
      throw new Error('Meal plan not found or unauthorized');
    }

    await this.mealPlanRepository.delete(mealPlanId);
  }

  async addMealItem(userId: number, weekStartDate: string, mealItem: any) {
    let mealPlan = await this.mealPlanRepository.findByUserIdAndWeek(userId, weekStartDate);
    
    if (!mealPlan) {
      const result = await this.mealPlanRepository.create({
        userId,
        weekStartDate: new Date(weekStartDate),
        title: `Week of ${weekStartDate}`,
      });
      mealPlan = await this.mealPlanRepository.findById(result.insertId);
    }

    await this.mealPlanRepository.addMealItem((mealPlan as any).id, mealItem);
    await this.activityRepository.create(userId, 'Added meal item', 'meal_plan', (mealPlan as any).id, {
      day: mealItem.day,
      mealType: mealItem.mealType,
      foodName: mealItem.foodName,
    });
    return await this.getMealPlanForWeek(userId, weekStartDate);
  }

  async updateMealItem(userId: number, mealItemId: number, mealItem: any) {
    const existing = await this.findMealItemById(mealItemId);
    if (!existing || (existing as any).userId !== userId) {
      throw new Error('Meal item not found or unauthorized');
    }

    await this.mealPlanRepository.updateMealItem(mealItemId, mealItem);
    return await this.findMealItemById(mealItemId);
  }

  async completeMealItem(userId: number, mealItemId: number) {
    const mealItem = await this.findMealItemById(mealItemId);
    if (!mealItem || (mealItem as any).userId !== userId) {
      throw new Error('Meal item not found or unauthorized');
    }

    const ingredients = this.parseIngredients((mealItem as any).ingredientItemsJson);
    const connection = await getConnection();
    try {
      for (const ingredient of ingredients) {
        const [rows] = await connection.execute(
          'SELECT id, quantity, foodName FROM food_inventory WHERE id = ? AND userId = ? AND deletedAt IS NULL',
          [ingredient.inventoryItemId, userId]
        );
        const item = (rows as any[])[0];
        if (!item) {
          continue;
        }

        const nextQuantity = Math.max(0, Number(item.quantity) - Number(ingredient.quantityUsed ?? 1));
        if (nextQuantity === 0) {
          await connection.execute('UPDATE food_inventory SET quantity = 0, status = ? WHERE id = ?', ['expired', ingredient.inventoryItemId]);
        } else {
          await connection.execute('UPDATE food_inventory SET quantity = ? WHERE id = ?', [nextQuantity, ingredient.inventoryItemId]);
        }
      }
    } finally {
      connection.release();
    }

    await this.mealPlanRepository.markMealItemCompleted(mealItemId);
    await this.notificationService.createNotification(
      userId,
      'meal_completed',
      'Meal completed',
      `${(mealItem as any).foodName} was marked as completed and inventory was updated.`,
      mealItemId
    );
    await this.activityRepository.create(userId, 'Completed meal', 'meal_plan', mealItemId, {
      foodName: (mealItem as any).foodName,
    });
    return await this.findMealItemById(mealItemId);
  }

  async removeMealItem(userId: number, mealItemId: number) {
    const mealItem = await this.findMealItemById(mealItemId);
    if (!mealItem || (mealItem as any).userId !== userId) {
      throw new Error('Meal item not found or unauthorized');
    }

    await this.mealPlanRepository.removeMealItem(mealItemId);
  }

  async getSuggestedMeals(userId: number) {
    const items = await this.foodInventoryRepository.findByUserId(userId, 100, 0);
    
    // Generate suggestions based on available items
    const suggestions = items
      .filter((item: any) => item.status !== 'expired')
      .map((item: any) => ({
        inventoryItemId: item.id,
        foodName: item.foodName,
        category: item.category,
        expiryDate: item.expiryDate,
        reason: item.status === 'expiring' ? 'Expiring soon' : 'In stock',
      }))
      .slice(0, 5);

    return suggestions;
  }

  async getMealHistory(userId: number, limit: number = 100) {
    const plans = await this.mealPlanRepository.findByUserId(userId, limit, 0);
    const history = [];
    for (const plan of plans) {
      const meals = await this.mealPlanRepository.findMealItemsByPlanId((plan as any).id);
      for (const meal of meals) {
        history.push({
          ...meal,
          weekStartDate: (plan as any).weekStartDate,
          mealPlanTitle: (plan as any).title,
        });
      }
    }
    return history.sort((left, right) => new Date((right as any).createdAt).getTime() - new Date((left as any).createdAt).getTime());
  }

  async getTodayAndUpcomingMeals(userId: number) {
    const today = new Date();
    const todayLabel = today.toLocaleDateString('en-US', { weekday: 'long' });
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    const plan = await this.getMealPlanForWeek(userId, weekStart.toISOString().split('T')[0]);
    const meals = await this.mealPlanRepository.findMealItemsByPlanId((plan as any).id);
    const upcomingMeals = meals
      .filter((meal) => new Date((meal as any).scheduledAt ?? today).getTime() >= today.setHours(0, 0, 0, 0))
      .sort((left, right) => new Date((left as any).scheduledAt ?? 0).getTime() - new Date((right as any).scheduledAt ?? 0).getTime());

    return {
      todayMeals: meals.filter((meal) => meal.day === todayLabel),
      upcomingMeals,
      weekStartDate: (plan as any).weekStartDate,
      title: (plan as any).title,
    };
  }

  async getInventorySuggestions(userId: number) {
    const expiring = await this.foodInventoryRepository.findExpiringByUserId(userId, 7);
    return expiring.map((item: any) => ({
      inventoryItemId: item.id,
      foodName: item.foodName,
      category: item.category,
      expiryDate: item.expiryDate,
      storageLocation: item.storageLocation,
      reason: 'Close to expiry',
    }));
  }

  private parseIngredients(rawValue: any) {
    if (!rawValue) return [];
    if (Array.isArray(rawValue)) return rawValue;
    if (typeof rawValue === 'string') {
      try {
        return JSON.parse(rawValue);
      } catch {
        return [];
      }
    }
    return [];
  }

  private async findMealItemById(mealItemId: number) {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT mi.*, mp.userId, mp.weekStartDate, mp.title
         FROM meal_items mi
         JOIN meal_plans mp ON mp.id = mi.mealPlanId
         WHERE mi.id = ?`,
        [mealItemId]
      );
      return (rows as any[])[0] ?? null;
    } finally {
      connection.release();
    }
  }
}

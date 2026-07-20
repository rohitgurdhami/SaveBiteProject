import { FoodInventoryRepository } from '../repositories/FoodInventoryRepository';
import { NotificationService } from './NotificationService';
import { ActivityRepository } from '../repositories/ActivityRepository';
import { FoodInventory } from '../types';
import { getConnection } from '../config/database';

export class FoodInventoryService {
  private foodInventoryRepository = new FoodInventoryRepository();
  private notificationService = new NotificationService();
  private activityRepository = new ActivityRepository();

  async getInventory(userId: number, page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.foodInventoryRepository.findByUserId(userId, pageSize, offset),
      this.foodInventoryRepository.countByUserId(userId),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getExpiringItems(userId: number, daysAhead: number = 7) {
    return await this.foodInventoryRepository.findExpiringByUserId(userId, daysAhead);
  }

  async getExpiredItems(userId: number) {
    return await this.foodInventoryRepository.findExpiredByUserId(userId);
  }

  async searchInventory(userId: number, query: string) {
    return await this.foodInventoryRepository.searchByUserId(userId, query);
  }

  async createFoodItem(userId: number, data: any) {
    const connection = await getConnection();
    let categoryId: number;
    let storageLocationId: number;

    try {
      const [categoryRows] = await connection.execute(
        'SELECT id FROM food_categories WHERE name = ? LIMIT 1',
        [data.category]
      );
      const [locationRows] = await connection.execute(
        'SELECT id FROM storage_locations WHERE name = ? LIMIT 1',
        [data.storageLocation]
      );

      categoryId = (categoryRows as Array<{ id: number }>)[0]?.id;
      storageLocationId = (locationRows as Array<{ id: number }>)[0]?.id;
    } finally {
      connection.release();
    }

    if (!categoryId || !storageLocationId) {
      throw new Error('Invalid category or storage location');
    }

    const item = await this.foodInventoryRepository.create({
      userId,
      foodName: data.foodName,
      categoryId,
      quantity: data.quantity,
      unit: data.unit,
      purchaseDate: data.purchaseDate,
      expiryDate: data.expiryDate,
      storageLocationId,
      notes: data.notes,
      status: 'fresh',
    });

    const itemId = item.insertId as number;
    await Promise.all([
      this.notificationService.createNotification(
        userId,
        'inventory_added',
        'Food item added',
        `${data.foodName} was added to your inventory.`,
        itemId
      ),
      this.activityRepository.create(userId, 'Added food item', 'inventory', itemId, {
        foodName: data.foodName,
        category: data.category,
        quantity: data.quantity,
        unit: data.unit,
      }),
    ]);

    const daysUntilExpiry = Math.ceil((new Date(data.expiryDate).getTime() - Date.now()) / 86_400_000);
    if (daysUntilExpiry <= 7) {
      await this.notificationService.createNotification(
        userId,
        daysUntilExpiry < 0 ? 'expiry_alert' : 'expiry_alert',
        daysUntilExpiry < 0 ? 'Food already expired' : 'Food expiring soon',
        `${data.foodName} ${daysUntilExpiry < 0 ? 'has already expired.' : `expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}.`}`,
        itemId
      );
    }

    return item;
  }

  async updateFoodItem(itemId: number, userId: number, data: any) {
    const item = await this.foodInventoryRepository.findById(itemId);
    if (!item || (item as any).userId !== userId) {
      throw new Error('Food item not found or unauthorized');
    }

    await this.foodInventoryRepository.update(itemId, data);
    return await this.foodInventoryRepository.findById(itemId);
  }

  async deleteFoodItem(itemId: number, userId: number) {
    const item = await this.foodInventoryRepository.findById(itemId);
    if (!item || (item as any).userId !== userId) {
      throw new Error('Food item not found or unauthorized');
    }

    await this.foodInventoryRepository.softDelete(itemId);
    await Promise.all([
      this.notificationService.createNotification(userId, 'inventory_removed', 'Food item removed', `${(item as any).foodName} was removed from your inventory.`, itemId),
      this.activityRepository.create(userId, 'Removed food item', 'inventory', itemId, {
        foodName: (item as any).foodName,
      }),
    ]);
  }

  async getSummary(userId: number) {
    const [all, expiring, expired] = await Promise.all([
      this.foodInventoryRepository.findByUserId(userId, 1000, 0),
      this.getExpiringItems(userId),
      this.getExpiredItems(userId),
    ]);

    const now = Date.now();
    const freshItems = all.filter((item: any) => {
      const expiryTime = new Date(item.expiryDate).getTime();
      return expiryTime > now && item.status !== 'expired';
    });

    return {
      totalItems: all.length,
      expiringCount: expiring.length,
      expiredCount: expired.length,
      freshCount: freshItems.length,
    };
  }
}

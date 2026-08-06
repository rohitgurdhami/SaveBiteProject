import { FoodInventoryService } from './FoodInventoryService';
import { NotificationService } from './NotificationService';
import { MealPlanService } from './MealPlanService';
import { ActivityRepository } from '../repositories/ActivityRepository';
import { FoodInventoryRepository } from '../repositories/FoodInventoryRepository';
import { DonationRepository } from '../repositories/DonationRepository';

export class DashboardService {
  private inventoryService = new FoodInventoryService();
  private notificationService = new NotificationService();
  private mealPlanService = new MealPlanService();
  private activityRepository = new ActivityRepository();
  private foodInventoryRepository = new FoodInventoryRepository();
  private donationRepository = new DonationRepository();

  private getSettledValue<T>(result: PromiseSettledResult<T>, fallback: T) {
    return result.status === 'fulfilled' ? result.value : fallback;
  }

  async getDashboard(userId: number) {
    const [summaryResult, notificationsResult, activitiesResult, inventoryResult, donationsResult, mealOverviewResult] = await Promise.allSettled([
      this.inventoryService.getSummary(userId),
      this.notificationService.getNotifications(userId, 1, 5),
      this.activityRepository.findByUserId(userId, 5),
      this.foodInventoryRepository.findByUserId(userId, 1000, 0),
      this.donationRepository.findByDonorId(userId, 1000, 0),
      this.mealPlanService.getTodayAndUpcomingMeals(userId),
    ]);

    const summary = this.getSettledValue(summaryResult, {
      totalItems: 0,
      expiringCount: 0,
      expiredCount: 0,
      freshCount: 0,
    });
    const notifications = this.getSettledValue(notificationsResult, {
      items: [],
      total: 0,
      page: 1,
      pageSize: 5,
      totalPages: 0,
    });
    const activities = this.getSettledValue(activitiesResult, []);
    const inventory = this.getSettledValue(inventoryResult, []);
    const donations = this.getSettledValue(donationsResult, []);
    const mealOverview = this.getSettledValue(mealOverviewResult, {
      todayMeals: [],
      upcomingMeals: [],
      weekStartDate: null,
      title: null,
    });

    const categoryMap = new Map<string, number>();
    const statusMap = new Map<string, number>();
    const weeklyAdds = new Map<string, number>();
    const weeklyDonated = new Map<string, number>();
    const weeklyExpired = new Map<string, number>();
    const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = Date.now();

    for (const item of inventory as any[]) {
      categoryMap.set(item.category, (categoryMap.get(item.category) ?? 0) + 1);
      statusMap.set(item.status, (statusMap.get(item.status) ?? 0) + 1);

      const createdDate = new Date(item.createdAt);
      const dayLabel = weekdayLabels[createdDate.getDay()];
      weeklyAdds.set(dayLabel, (weeklyAdds.get(dayLabel) ?? 0) + 1);

      const expiryDate = new Date(item.expiryDate);
      if (expiryDate.getTime() <= now) {
        const expiredDay = weekdayLabels[expiryDate.getDay()];
        weeklyExpired.set(expiredDay, (weeklyExpired.get(expiredDay) ?? 0) + 1);
      }
    }

    for (const donation of donations as any[]) {
      const donatedDay = weekdayLabels[new Date(donation.createdAt).getDay()];
      weeklyDonated.set(donatedDay, (weeklyDonated.get(donatedDay) ?? 0) + 1);
    }

    const categoryDistribution = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
    const statusDistribution = Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }));
    const weeklyActivity = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
      name: day,
      added: weeklyAdds.get(day) ?? 0,
      donated: weeklyDonated.get(day) ?? 0,
      expired: weeklyExpired.get(day) ?? 0,
    }));

    return {
      summary,
      notifications: notifications.items,
      activities,
      mealOverview,
      analytics: { categoryDistribution, statusDistribution, weeklyActivity },
    };
  }
}

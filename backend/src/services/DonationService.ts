import { DonationRepository } from '../repositories/DonationRepository';
import { FoodInventoryRepository } from '../repositories/FoodInventoryRepository';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { NotificationService } from './NotificationService';
import { ActivityRepository } from '../repositories/ActivityRepository';

export class DonationService {
  private donationRepository = new DonationRepository();
  private foodInventoryRepository = new FoodInventoryRepository();
  private notificationRepository = new NotificationRepository();
  private notificationService = new NotificationService();
  private activityRepository = new ActivityRepository();

  async createDonation(userId: number, data: any) {
    const foodItem = await this.foodInventoryRepository.findById(data.foodInventoryId);
    if (!foodItem || (foodItem as any).userId !== userId) {
      throw new Error('Food item not found or unauthorized');
    }

    if ((foodItem as any).status === 'expired' || new Date((foodItem as any).expiryDate).getTime() <= Date.now()) {
      throw new Error('This food item is already expired and cannot be donated');
    }

    const donation = await this.donationRepository.create({
      ...data,
      donorId: userId,
      status: 'available',
    });

    await Promise.all([
      this.notificationService.createNotification(userId, 'donation_created', 'Food listed for donation', `${(foodItem as any).foodName} is now available for donation.`, donation.insertId),
      this.activityRepository.create(userId, 'Created donation', 'donation', donation.insertId, (foodItem as any).foodName),
    ]);

    return donation;
  }

  async getDonationsByDonor(userId: number, page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;
    const donations = await this.donationRepository.findByDonorId(userId, pageSize, offset);
    const total = await this.donationRepository.countByUserId(userId);

    return {
      items: donations,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getAvailableDonations(
    page: number = 1,
    pageSize: number = 20,
    filters: { query?: string; category?: string; location?: string; status?: string } = {}
  ) {
    const offset = (page - 1) * pageSize;
    const donations = await this.donationRepository.searchAvailable(filters.query || '', filters, pageSize, offset);
    const total = await this.donationRepository.countAvailable(filters.query || '', filters);

    return {
      items: donations,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getPublicRecentDonations(limit: number = 6) {
    return await this.donationRepository.findPublicRecent(limit);
  }

  async searchDonations(query: string, categoryId?: number, page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;
    const donations = await this.donationRepository.searchAvailable(query, {}, pageSize, offset);
    
    return {
      items: donations,
      total: donations.length,
      page,
      pageSize,
      totalPages: Math.ceil(donations.length / pageSize),
    };
  }

  async getDonation(donationId: number) {
    return await this.donationRepository.findDetailedById(donationId);
  }

  async updateDonationStatus(donationId: number, status: string, userId?: number) {
    const donation = await this.donationRepository.findById(donationId);
    if (!donation) {
      throw new Error('Donation not found');
    }

    if (userId && (donation as any).donorId !== userId) {
      throw new Error('Unauthorized');
    }

    await this.donationRepository.updateStatus(donationId, status);
    return await this.donationRepository.findById(donationId);
  }

  async completeDonation(donationId: number) {
    return await this.updateDonationStatus(donationId, 'completed');
  }

  async updateDonation(donationId: number, userId: number, data: any) {
    const donation = await this.donationRepository.findById(donationId);
    if (!donation) {
      throw new Error('Donation not found');
    }

    if ((donation as any).donorId !== userId) {
      throw new Error('Unauthorized');
    }

    await this.donationRepository.updateDonation(donationId, data);
    return await this.donationRepository.findDetailedById(donationId);
  }

  async deleteDonation(donationId: number, userId: number) {
    const donation = await this.donationRepository.findById(donationId);
    if (!donation) {
      throw new Error('Donation not found');
    }

    if ((donation as any).donorId !== userId) {
      throw new Error('Unauthorized');
    }

    await this.donationRepository.deleteDonation(donationId);
    await this.activityRepository.create(userId, 'Deleted donation', 'donation', donationId, (donation as any).description || '');
  }
}

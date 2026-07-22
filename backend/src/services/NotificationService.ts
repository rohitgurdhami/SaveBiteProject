import { NotificationRepository } from '../repositories/NotificationRepository';

export class NotificationService {
  private notificationRepository = new NotificationRepository();

  async getNotifications(userId: number, page: number = 1, pageSize: number = 50) {
    const offset = (page - 1) * pageSize;
    const [notifications, total] = await Promise.all([
      this.notificationRepository.findByUserId(userId, pageSize, offset),
      this.notificationRepository.countByUserId(userId),
    ]);
    return {
      items: notifications,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
  async getUnreadCount(userId: number) {
    return await this.notificationRepository.countUnreadByUserId(userId);
  }

  async createNotification(userId: number, type: string, title: string, message: string, relatedId?: number) {
    return await this.notificationRepository.create({
      userId,
      type,
      title,
      message,
      relatedId,
      isRead: false,
    });
  }

  async markAsRead(notificationId: number) {
    return await this.notificationRepository.markAsRead(notificationId);
  }

  async markAllAsRead(userId: number) {
    return await this.notificationRepository.markAllAsRead(userId);
  }

  async deleteNotification(notificationId: number) {
    return await this.notificationRepository.delete(notificationId);
  }

  async sendExpiryAlert(userId: number, foodName: string, expiryDate: string) {
    return await this.createNotification(
      userId,
      'expiry_alert',
      'Food Expiring Soon',
      `${foodName} will expire on ${expiryDate}`
    );
  }

  async sendDonationRequest(userId: number, donorName: string, foodName: string, donationId: number) {
    return await this.createNotification(
      userId,
      'donation_request',
      'New Donation Request',
      `${donorName} requested your ${foodName}`,
      donationId
    );
  }

  async sendDonationAccepted(userId: number, recipientName: string, foodName: string) {
    return await this.createNotification(
      userId,
      'donation_accepted',
      'Donation Accepted',
      `${recipientName} accepted your ${foodName}`
    );
  }
}
 
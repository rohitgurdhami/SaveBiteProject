import { DonationRequestRepository } from '../repositories/DonationRequestRepository';
import { DonationRepository } from '../repositories/DonationRepository';
import { NotificationService } from './NotificationService';

export class DonationRequestService {
  private donationRequestRepository = new DonationRequestRepository();
  private donationRepository = new DonationRepository();
  private notificationService = new NotificationService();

  async createRequest(donationId: number, recipientId: number, message?: string) {
    // Check if donation exists
    const donation = await this.donationRepository.findById(donationId);
    if (!donation) {
      throw new Error('Donation not found');
    }

    // Check for duplicate request
    const isDuplicate = await this.donationRequestRepository.checkDuplicateRequest(
      donationId,
      recipientId
    );
    if (isDuplicate) {
      throw new Error('You have already requested this donation');
    }

    // Create request
    const request = await this.donationRequestRepository.create({
      donationId,
      recipientId,
      message,
      status: 'pending',
    });

    // Send notification to donor
    await this.notificationService.createNotification(
      (donation as any).donorId,
      'donation_request',
      'New Donation Request',
      `Someone requested your donation`,
      donationId
    );

    return request;
  }

  async getRequestsByRecipient(recipientId: number, page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;
    const requests = await this.donationRequestRepository.findByRecipientId(recipientId, pageSize, offset);
    
    return {
      items: requests,
      page,
      pageSize,
    };
  }

  async getPendingRequestsByDonor(donorId: number) {
    return await this.donationRequestRepository.findPendingByDonorId(donorId);
  }

  async acceptRequest(requestId: number, donorId: number) {
    const request = await this.donationRequestRepository.findById(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    // Verify donor ownership
    const donation = await this.donationRepository.findById((request as any).donationId);
    if ((donation as any).donorId !== donorId) {
      throw new Error('Unauthorized');
    }

    // Update request status
    await this.donationRequestRepository.updateStatus(requestId, 'accepted');

    // Update donation status
    await this.donationRepository.updateStatus((request as any).donationId, 'requested');

    // Send notification to recipient
    await this.notificationService.createNotification(
      (request as any).recipientId,
      'donation_accepted',
      'Donation Accepted',
      'Your donation request has been accepted!'
    );

    return await this.donationRequestRepository.findById(requestId);
  }

  async rejectRequest(requestId: number, donorId: number) {
    const request = await this.donationRequestRepository.findById(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    // Verify donor ownership
    const donation = await this.donationRepository.findById((request as any).donationId);
    if ((donation as any).donorId !== donorId) {
      throw new Error('Unauthorized');
    }

    // Update request status
    await this.donationRequestRepository.updateStatus(requestId, 'rejected');

    // Send notification to recipient
    await this.notificationService.createNotification(
      (request as any).recipientId,
      'donation_rejected',
      'Donation Rejected',
      'Your donation request has been declined'
    );

    return await this.donationRequestRepository.findById(requestId);
  }

  async completeRequest(requestId: number) {
    await this.donationRequestRepository.updateStatus(requestId, 'completed');
    return await this.donationRequestRepository.findById(requestId);
  }
}

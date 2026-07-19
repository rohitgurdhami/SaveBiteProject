import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DonationRequestService } from '../services/DonationRequestService';
import { sendSuccess, sendError } from '../utils/response';

const donationRequestService = new DonationRequestService();

export const createRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { donationId, message } = req.body;
    const recipientId = req.user!.id;

    if (!donationId) {
      return sendError(res, 'Donation ID is required', 400);
    }

    const request = await donationRequestService.createRequest(donationId, recipientId, message);
    sendSuccess(res, request, 'Donation request created', 201);
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
};

export const getMyRequests = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const recipientId = req.user!.id;

    const result = await donationRequestService.getRequestsByRecipient(recipientId, page, pageSize);
    sendSuccess(res, result.items, 'Donation requests retrieved');
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getPendingRequests = async (req: AuthRequest, res: Response) => {
  try {
    const donorId = req.user!.id;
    const requests = await donationRequestService.getPendingRequestsByDonor(donorId);
    sendSuccess(res, requests, 'Pending requests retrieved');
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const acceptRequest = async (req: AuthRequest, res: Response) => {
  try {
    const requestId = parseInt(req.params.id);
    const donorId = req.user!.id;

    const request = await donationRequestService.acceptRequest(requestId, donorId);
    sendSuccess(res, request, 'Donation request accepted');
  } catch (error: any) {
    sendError(res, error.message, error.message.includes('Unauthorized') ? 403 : 400);
  }
};

export const rejectRequest = async (req: AuthRequest, res: Response) => {
  try {
    const requestId = parseInt(req.params.id);
    const donorId = req.user!.id;

    const request = await donationRequestService.rejectRequest(requestId, donorId);
    sendSuccess(res, request, 'Donation request rejected');
  } catch (error: any) {
    sendError(res, error.message, error.message.includes('Unauthorized') ? 403 : 400);
  }
};

export const completeRequest = async (req: AuthRequest, res: Response) => {
  try {
    const requestId = parseInt(req.params.id);
    const request = await donationRequestService.completeRequest(requestId);
    sendSuccess(res, request, 'Donation request completed');
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
};

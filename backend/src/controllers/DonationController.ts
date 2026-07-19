import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DonationService } from '../services/DonationService';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { donationSchema } from '../validations';

const donationService = new DonationService();

export const getAvailableDonations = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const query = req.query.search as string;

    let result;
    if (query) {
      result = await donationService.searchDonations(query, undefined, page, pageSize);
    } else {
      result = await donationService.getAvailableDonations(page, pageSize);
    }

    sendPaginated(res, result.items, result.total, result.page, result.pageSize);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getMyDonations = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const userId = req.user!.id;

    const result = await donationService.getDonationsByDonor(userId, page, pageSize);
    sendPaginated(res, result.items, result.total, result.page, result.pageSize);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const createDonation = async (req: AuthRequest, res: Response) => {
  try {
    const validated = donationSchema.parse(req.body);
    const userId = req.user!.id;

    const donation = await donationService.createDonation(userId, validated);
    sendSuccess(res, donation, 'Donation created successfully', 201);
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
};

export const getDonation = async (req: Request, res: Response) => {
  try {
    const donation = await donationService.getDonation(parseInt(req.params.id));
    if (!donation) {
      return sendError(res, 'Donation not found', 404);
    }
    sendSuccess(res, donation);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const updateDonationStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const userId = req.user!.id;
    const donationId = parseInt(req.params.id);

    const donation = await donationService.updateDonationStatus(donationId, status, userId);
    sendSuccess(res, donation, 'Donation status updated');
  } catch (error: any) {
    sendError(res, error.message, error.message.includes('Unauthorized') ? 403 : 400);
  }
};

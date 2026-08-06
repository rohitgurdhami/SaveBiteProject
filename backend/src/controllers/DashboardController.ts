import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DashboardService } from '../services/DashboardService';
import { sendError, sendSuccess } from '../utils/response';

const dashboardService = new DashboardService();

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const dashboard = await dashboardService.getDashboard(req.user!.id);
    sendSuccess(res, dashboard);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

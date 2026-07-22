import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/NotificationService';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';

const notificationService = new NotificationService();

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;
    const userId = req.user!.id;

    const result = await notificationService.getNotifications(userId, page, pageSize);
    sendPaginated(res, result.items, result.total, result.page, result.pageSize);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const unreadCount = await notificationService.getUnreadCount(userId);
    sendSuccess(res, { unreadCount });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = parseInt(req.params.id);
    await notificationService.markAsRead(notificationId);
    sendSuccess(res, null, 'Notification marked as read');
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await notificationService.markAllAsRead(userId);
    sendSuccess(res, null, 'All notifications marked as read');
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = parseInt(req.params.id);
    await notificationService.deleteNotification(notificationId);
    sendSuccess(res, null, 'Notification deleted');
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

import express, { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as NotificationController from '../controllers/NotificationController';

const router: Router = express.Router();

router.get('/', authenticateToken, NotificationController.getNotifications);
router.get('/unread/count', authenticateToken, NotificationController.getUnreadCount);
router.patch('/:id/read', authenticateToken, NotificationController.markAsRead);
router.patch('/all/read', authenticateToken, NotificationController.markAllAsRead);
router.delete('/:id', authenticateToken, NotificationController.deleteNotification);

export default router;

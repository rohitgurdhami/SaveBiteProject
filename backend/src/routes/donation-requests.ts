import express, { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as DonationRequestController from '../controllers/DonationRequestController';

const router: Router = express.Router();

router.post('/', authenticateToken, DonationRequestController.createRequest);
router.get('/my-requests', authenticateToken, DonationRequestController.getMyRequests);
router.get('/pending', authenticateToken, DonationRequestController.getPendingRequests);
router.patch('/:id/accept', authenticateToken, DonationRequestController.acceptRequest);
router.patch('/:id/reject', authenticateToken, DonationRequestController.rejectRequest);
router.patch('/:id/complete', authenticateToken, DonationRequestController.completeRequest);

export default router;

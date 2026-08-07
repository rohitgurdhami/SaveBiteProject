import express, { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as DonationController from '../controllers/DonationController';

const router: Router = express.Router();

router.get('/available', DonationController.getAvailableDonations);
router.get('/public-recent', DonationController.getPublicRecentDonations);
router.get('/my-donations', authenticateToken, DonationController.getMyDonations);
router.post('/', authenticateToken, DonationController.createDonation);
router.get('/:id', DonationController.getDonation);
router.put('/:id', authenticateToken, DonationController.updateDonation);
router.patch('/:id/status', authenticateToken, DonationController.updateDonationStatus);
router.delete('/:id', authenticateToken, DonationController.deleteDonation);

export default router;

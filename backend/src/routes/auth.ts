import express, { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as AuthController from '../controllers/AuthController';

const router: Router = express.Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/verify-otp', AuthController.verifyOtp);
router.post('/resend-otp', AuthController.resendOtp);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.post('/change-password', authenticateToken, AuthController.changePassword);
router.get('/me', authenticateToken, AuthController.getMe);
router.get('/profile', authenticateToken, AuthController.getProfile);
router.put('/profile', authenticateToken, AuthController.updateProfile);
router.get('/settings', authenticateToken, AuthController.getSettings);
router.put('/settings', authenticateToken, AuthController.updateSettings);

export default router;

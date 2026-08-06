import express, { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getDashboard } from '../controllers/DashboardController';

const router: Router = express.Router();
router.get('/', authenticateToken, getDashboard);

export default router;

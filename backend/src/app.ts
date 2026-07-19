import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import inventoryRoutes from './routes/inventory';
import donationRoutes from './routes/donations';
import donationRequestsRoutes from './routes/donation-requests';
import notificationRoutes from './routes/notifications';
import dashboardRoutes from './routes/dashboard';
import mealPlanRoutes from './routes/meal-plans';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'Backend is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/donation-requests', donationRequestsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/meal-plans', mealPlanRoutes);

export default app;

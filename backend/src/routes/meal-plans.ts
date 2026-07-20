import express, { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as MealPlanController from '../controllers/MealPlanController';

const router: Router = express.Router();

router.get('/', authenticateToken, MealPlanController.getMealPlans);
router.get('/suggestions', authenticateToken, MealPlanController.getMealSuggestions);
router.get('/history', authenticateToken, MealPlanController.getMealHistory);
router.post('/', authenticateToken, MealPlanController.createMealPlan);
router.post('/add-meal', authenticateToken, MealPlanController.addMealItem);
router.put('/meal-items/:id', authenticateToken, MealPlanController.updateMealItem);
router.post('/meal-items/:id/complete', authenticateToken, MealPlanController.completeMealItem);
router.delete('/meal-items/:id', authenticateToken, MealPlanController.deleteMealItem);
router.put('/:id', authenticateToken, MealPlanController.updateMealPlan);
router.delete('/:id', authenticateToken, MealPlanController.deleteMealPlan);

export default router;

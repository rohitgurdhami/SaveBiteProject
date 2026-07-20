import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { MealPlanService } from '../services/MealPlanService';
import { sendSuccess, sendError } from '../utils/response';

const mealPlanService = new MealPlanService();

export const getMealPlans = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const weekStartDate = req.query.weekStartDate as string | undefined;

    if (weekStartDate) {
      const mealPlan = await mealPlanService.getMealPlanForWeek(userId, weekStartDate);
      const todayAndUpcoming = await mealPlanService.getTodayAndUpcomingMeals(userId);
      sendSuccess(res, { ...mealPlan, todayMeals: todayAndUpcoming.todayMeals, upcomingMeals: todayAndUpcoming.upcomingMeals });
      return;
    }

    const plans = await mealPlanService.listMealPlans(userId);
    sendSuccess(res, plans);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const createMealPlan = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const mealPlan = await mealPlanService.createMealPlan(userId, req.body.weekStartDate, req.body.title);
    sendSuccess(res, mealPlan, 'Meal plan created successfully', 201);
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
};

export const updateMealPlan = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const mealPlan = await mealPlanService.updateMealPlan(userId, parseInt(req.params.id), req.body);
    sendSuccess(res, mealPlan, 'Meal plan updated successfully');
  } catch (error: any) {
    sendError(res, error.message, error.message.includes('unauthorized') ? 403 : 400);
  }
};

export const deleteMealPlan = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await mealPlanService.deleteMealPlan(userId, parseInt(req.params.id));
    sendSuccess(res, null, 'Meal plan deleted successfully');
  } catch (error: any) {
    sendError(res, error.message, error.message.includes('unauthorized') ? 403 : 400);
  }
};

export const addMealItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const result = await mealPlanService.addMealItem(userId, req.body.weekStartDate, req.body);
    sendSuccess(res, result, 'Meal added successfully', 201);
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
};

export const updateMealItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const mealItem = await mealPlanService.updateMealItem(userId, parseInt(req.params.id), req.body);
    sendSuccess(res, mealItem, 'Meal item updated successfully');
  } catch (error: any) {
    sendError(res, error.message, error.message.includes('unauthorized') ? 403 : 400);
  }
};

export const completeMealItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const mealItem = await mealPlanService.completeMealItem(userId, parseInt(req.params.id));
    sendSuccess(res, mealItem, 'Meal marked as completed');
  } catch (error: any) {
    sendError(res, error.message, error.message.includes('unauthorized') ? 403 : 400);
  }
};

export const deleteMealItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await mealPlanService.removeMealItem(userId, parseInt(req.params.id));
    sendSuccess(res, null, 'Meal item deleted successfully');
  } catch (error: any) {
    sendError(res, error.message, error.message.includes('unauthorized') ? 403 : 400);
  }
};

export const getMealSuggestions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const suggestions = await mealPlanService.getInventorySuggestions(userId);
    sendSuccess(res, suggestions);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getMealHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const history = await mealPlanService.getMealHistory(userId);
    sendSuccess(res, history);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

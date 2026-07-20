import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { FoodInventoryService } from '../services/FoodInventoryService';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { foodInventorySchema } from '../validations';

const foodInventoryService = new FoodInventoryService();

export const getInventory = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const query = req.query.search as string;

    const userId = req.user!.id;

    let result;
    if (query) {
      const items = await foodInventoryService.searchInventory(userId, query);
      result = {
        items,
        total: items.length,
        page: 1,
        pageSize: items.length,
      };
    } else {
      result = await foodInventoryService.getInventory(userId, page, pageSize);
    }

    sendPaginated(res, result.items, result.total, result.page, result.pageSize);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getSummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const summary = await foodInventoryService.getSummary(userId);
    sendSuccess(res, summary);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getExpiringItems = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const items = await foodInventoryService.getExpiringItems(userId, 7);
    sendSuccess(res, items);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const createFoodItem = async (req: AuthRequest, res: Response) => {
  try {
    const validated = foodInventorySchema.parse(req.body);
    const userId = req.user!.id;

    const item = await foodInventoryService.createFoodItem(userId, validated);
    sendSuccess(res, item, 'Food item created successfully', 201);
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return sendError(res, 'Invalid food item data', 400, error.errors);
    }

    sendError(res, error.message, 400);
  }
};

export const getFoodItem = async (req: AuthRequest, res: Response) => {
  try {
    const item = await foodInventoryService['foodInventoryRepository'].findById(parseInt(req.params.id));
    if (!item || (item as any).userId !== req.user!.id) {
      return sendError(res, 'Food item not found', 404);
    }
    sendSuccess(res, item);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const updateFoodItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const itemId = parseInt(req.params.id);

    const item = await foodInventoryService.updateFoodItem(itemId, userId, req.body);
    sendSuccess(res, item, 'Food item updated successfully');
  } catch (error: any) {
    sendError(res, error.message, error.message.includes('unauthorized') ? 403 : 400);
  }
};

export const deleteFoodItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const itemId = parseInt(req.params.id);

    await foodInventoryService.deleteFoodItem(itemId, userId);
    sendSuccess(res, null, 'Food item deleted successfully');
  } catch (error: any) {
    sendError(res, error.message, error.message.includes('unauthorized') ? 403 : 400);
  }
};

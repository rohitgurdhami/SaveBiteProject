import express, { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as InventoryController from '../controllers/InventoryController';

const router: Router = express.Router();

router.get('/', authenticateToken, InventoryController.getInventory);
router.get('/summary', authenticateToken, InventoryController.getSummary);
router.get('/expiring', authenticateToken, InventoryController.getExpiringItems);
router.post('/', authenticateToken, InventoryController.createFoodItem);
router.get('/:id', authenticateToken, InventoryController.getFoodItem);
router.put('/:id', authenticateToken, InventoryController.updateFoodItem);
router.delete('/:id', authenticateToken, InventoryController.deleteFoodItem);

export default router;

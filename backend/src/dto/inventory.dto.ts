import { FoodInventoryInput } from '../validations';

export type CreateFoodItemDto = FoodInventoryInput;
export type UpdateFoodItemDto = Partial<FoodInventoryInput>;

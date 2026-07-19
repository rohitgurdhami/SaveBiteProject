export interface User {
  id: number;
  email: string;
  fullName: string;
  password: string;
  householdSize: number;
  profileImage?: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface JwtPayload {
  id: number;
  email: string;
  iat?: number;
  exp?: number;
}

export interface RequestWithUser extends Request {
  user?: JwtPayload;
}

export interface FoodInventory {
  id: number;
  userId: number;
  foodName: string;
  category: string;
  categoryId: number;
  quantity: number;
  unit: string;
  purchaseDate: Date;
  expiryDate: Date;
  storageLocation: string;
  storageLocationId: number;
  image?: string;
  notes?: string;
  status: 'fresh' | 'expiring' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

export interface Donation {
  id: number;
  foodInventoryId: number;
  donorId: number;
  pickupLocation: string;
  availableUntil: Date;
  description?: string;
  status: 'available' | 'requested' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface DonationRequest {
  id: number;
  donationId: number;
  recipientId: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface MealPlan {
  id: number;
  userId: number;
  weekStartDate: Date;
  title?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MealItem {
  id: number;
  mealPlanId: number;
  day: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  scheduledAt?: Date;
  foodName: string;
  notes?: string;
  status?: 'planned' | 'completed';
  completedAt?: Date;
  ingredientItems?: Array<{
    inventoryItemId: number;
    foodName: string;
    quantityUsed: number;
    unit: string;
  }>;
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  relatedId?: number;
  isRead: boolean;
  createdAt: Date;
}

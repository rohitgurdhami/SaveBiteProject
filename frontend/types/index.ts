export interface User {
  id: number;
  email: string;
  fullName: string;
  householdSize: number;
  profileImage?: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FoodInventoryItem {
  id: number;
  foodName: string;
  category: string;
  quantity: number;
  unit: string;
  purchaseDate: string;
  expiryDate: string;
  storageLocation: string;
  image?: string;
  notes?: string;
  status: 'fresh' | 'expiring' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export interface Donation {
  id: number;
  foodInventoryId: number;
  foodName: string;
  donorId: number;
  donorName: string;
  pickupLocation: string;
  availableUntil: string;
  description?: string;
  image?: string;
  status: 'available' | 'requested' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface DonationRequest {
  id: number;
  donationId: number;
  recipientId: number;
  recipientName: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface MealPlan {
  id: number;
  userId: number;
  weekStartDate: string;
  meals: MealItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MealItem {
  id: number;
  mealPlanId: number;
  day: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodName: string;
  notes?: string;
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  relatedId?: number;
  isRead: boolean;
  createdAt: string;
}

export interface Analytics {
  totalFoodSaved: number;
  totalFoodDonated: number;
  totalFoodUsed: number;
  totalFoodExpired: number;
  wasteReductionPercentage: number;
  weeklyData: DailyAnalytics[];
  categoryWaste: CategoryWaste[];
}

export interface DailyAnalytics {
  date: string;
  foodUsed: number;
  foodDonated: number;
  foodExpired: number;
}

export interface CategoryWaste {
  category: string;
  wastePercentage: number;
  quantity: number;
}

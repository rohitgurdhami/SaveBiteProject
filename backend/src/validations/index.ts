import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  householdSize: z.number().int().min(1, 'Household size must be at least 1'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const foodInventorySchema = z.object({
  foodName: z.string().min(1, 'Food name is required'),
  category: z.string().min(1, 'Category is required'),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  purchaseDate: z
    .string()
    .min(1, 'Purchase date is required')
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: 'Invalid purchase date',
    }),
  expiryDate: z
    .string()
    .min(1, 'Expiry date is required')
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: 'Invalid expiry date',
    }),
  storageLocation: z.string().min(1, 'Storage location is required'),
  notes: z.string().optional(),
});

export const donationSchema = z.object({
  foodInventoryId: z.coerce.number().positive(),
  pickupLocation: z.string().min(1, 'Pickup location is required'),
  availableUntil: z
    .string()
    .min(1, 'Available until date is required')
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: 'Invalid date',
    }),
  description: z.string().optional(),
});

export const mealPlanSchema = z.object({
  weekStartDate: z
    .string()
    .min(1, 'Week start date is required')
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: 'Invalid date',
    }),
  meals: z.array(z.object({
    day: z.string(),
    mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
    foodName: z.string().min(1),
    notes: z.string().optional(),
  })),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type FoodInventoryInput = z.infer<typeof foodInventorySchema>;
export type DonationInput = z.infer<typeof donationSchema>;
export type MealPlanInput = z.infer<typeof mealPlanSchema>;

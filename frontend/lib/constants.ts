// Food Categories
export const FOOD_CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Dairy',
  'Meat',
  'Grains',
  'Beverages',
  'Bakery',
  'Condiments',
  'Other',
];

// Storage Locations
export const STORAGE_LOCATIONS = [
  'Refrigerator',
  'Freezer',
  'Pantry',
  'Countertop',
  'Basement',
];

// Units
export const UNITS = [
  'kg',
  'g',
  'l',
  'ml',
  'pieces',
  'cups',
  'tablespoons',
  'teaspoons',
];

// Meal Types
export const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

// Days of Week
export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

// Notification Types
export const NOTIFICATION_TYPES = {
  EXPIRY_ALERT: 'expiry_alert',
  DONATION_REQUEST: 'donation_request',
  DONATION_ACCEPTED: 'donation_accepted',
  DONATION_REJECTED: 'donation_rejected',
  MEAL_REMINDER: 'meal_reminder',
  PASSWORD_CHANGED: 'password_changed',
  PROFILE_UPDATED: 'profile_updated',
  NEW_DONATION: 'new_donation',
};

// Status Colors
export const STATUS_COLORS = {
  fresh: 'bg-green-100 text-green-800',
  expiring: 'bg-yellow-100 text-yellow-800',
  expired: 'bg-red-100 text-red-800',
};

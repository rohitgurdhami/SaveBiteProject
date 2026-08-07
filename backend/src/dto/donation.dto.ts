import { DonationInput, MealPlanInput } from '../validations';

export type CreateDonationDto = DonationInput;
export type CreateMealPlanDto = MealPlanInput;

export interface CreateDonationRequestDto {
  donationId: number;
  message?: string;
}

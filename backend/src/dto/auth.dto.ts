import { RegisterInput, LoginInput } from '../validations';

export type RegisterDto = RegisterInput;
export type LoginDto = LoginInput;

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    fullName: string;
  };
}

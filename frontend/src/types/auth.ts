export type SexType = 'male' | 'female' | 'other';

export interface UserRegistration {
  fullName: string;
  mobile: string;
  sex: SexType;
  age: number;
}

export interface UserProfile {
  id?: string;
  fullName: string;
  mobile: string;
  sex: SexType;
  age: number;
  isRegistered: boolean;
}

export interface LoginRequest {
  mobile: string;
}

export type OtpFlowType = 'register' | 'login';

export interface OtpVerificationRequest {
  mobile: string;
  otp: string;
  flow: OtpFlowType;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: UserProfile;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  expiresInSeconds?: number;
  devMockOtp?: string;
}

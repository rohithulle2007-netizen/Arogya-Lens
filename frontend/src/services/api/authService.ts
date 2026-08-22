import { UserRegistration, AuthResponse, SendOtpResponse, OtpFlowType, UserProfile } from '../../types/auth';
import { apiRequest, USE_MOCK } from './apiClient';
import { mockAuthService } from '../mocks/mockAuthService';

export interface IAuthService {
  checkUserExists(mobile: string): Promise<boolean>;
  getUser(mobile: string): Promise<UserProfile | null>;
  registerUser(data: UserRegistration): Promise<SendOtpResponse>;
  sendLoginOtp(mobile: string): Promise<SendOtpResponse>;
  verifyOtp(mobile: string, otp: string, flow: OtpFlowType): Promise<AuthResponse>;
  resendOtp(mobile: string): Promise<SendOtpResponse>;
}

// Live FastAPI Backend Implementation
const liveAuthService: IAuthService = {
  async checkUserExists(mobile: string): Promise<boolean> {
    try {
      const res = await apiRequest<any>(`/api/auth/me`);
      return !!res.data;
    } catch {
      return false;
    }
  },

  async getUser(mobile: string): Promise<UserProfile | null> {
    const res = await apiRequest<any>('/api/auth/me');
    if (!res.data) return null;

    return {
      id: String(res.data.id),
      fullName: res.data.profile?.name || res.data.mobile_number || 'User',
      mobile: res.data.mobile_number || mobile,
      sex: res.data.profile?.sex || 'prefer_not_to_say',
      age: res.data.profile?.age || 25,
      isRegistered: true,
    };
  },

  async registerUser(data: UserRegistration): Promise<SendOtpResponse> {
    const payload = {
      name: data.fullName || (data as any).name || 'Patient',
      mobile_number: data.mobile || (data as any).mobile_number,
      sex: (data.sex || 'prefer_not_to_say').toLowerCase(),
      age: Number(data.age) || 25,
    };

    const res = await apiRequest<any>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.error) {
      return { success: false, message: res.error };
    }
    return { success: true, message: res.data?.message || 'Registration successful. OTP sent.' };
  },

  async sendLoginOtp(mobile: string): Promise<SendOtpResponse> {
    const payload = {
      mobile_number: mobile,
    };

    const res = await apiRequest<any>('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.error) {
      return { success: false, message: res.error };
    }
    return { success: true, message: res.data?.message || 'OTP sent successfully' };
  },

  async verifyOtp(mobile: string, otp: string, flow: OtpFlowType): Promise<AuthResponse> {
    const payload = {
      mobile_number: mobile,
      otp: otp,
    };

    const res = await apiRequest<any>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.error || !res.data) {
      return { success: false, message: res.error || 'Failed to verify OTP' };
    }

    const token = res.data.access_token || res.data.token;
    if (token) {
      sessionStorage.setItem('arogya_auth_token', token);
    }

    const userProfile: UserProfile = {
      id: String(res.data.user?.id || 'usr_1'),
      fullName: res.data.profile?.name || res.data.user?.mobile_number || 'User',
      mobile: res.data.user?.mobile_number || mobile,
      sex: res.data.profile?.sex || 'prefer_not_to_say',
      age: res.data.profile?.age || 25,
      isRegistered: true,
    };

    return {
      success: true,
      message: 'Authenticated successfully',
      token: token,
      user: userProfile,
    };
  },

  async resendOtp(mobile: string): Promise<SendOtpResponse> {
    return this.sendLoginOtp(mobile);
  }
};

// Export active implementation based on environment flag
export const authService: IAuthService = USE_MOCK ? mockAuthService : liveAuthService;

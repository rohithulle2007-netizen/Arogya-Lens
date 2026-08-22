import { UserRegistration, UserProfile, AuthResponse, SendOtpResponse, OtpFlowType } from '../../types/auth';

// Transient memory database for mock development
const mockRegisteredUsers = new Map<string, UserProfile>([
  ['9876543210', {
    id: 'user_mock_001',
    fullName: 'Priya Sharma',
    mobile: '9876543210',
    sex: 'female',
    age: 28,
    isRegistered: true,
  }]
]);

// Temporary storage for pending registrations during OTP step
const pendingRegistrations = new Map<string, UserRegistration>();

export const MOCK_OTP_CODE = '123456';

export const mockAuthService = {
  // Check if mobile exists for returning user
  async checkUserExists(mobile: string): Promise<boolean> {
    await new Promise((res) => setTimeout(res, 350));
    return mockRegisteredUsers.has(mobile.trim());
  },

  // Get user profile if exists
  async getUser(mobile: string): Promise<UserProfile | null> {
    await new Promise((res) => setTimeout(res, 200));
    return mockRegisteredUsers.get(mobile.trim()) || null;
  },

  // Step 1 of registration: Save pending registration & send OTP
  async registerUser(data: UserRegistration): Promise<SendOtpResponse> {
    await new Promise((res) => setTimeout(res, 600));
    
    // Store in pending state
    pendingRegistrations.set(data.mobile.trim(), { ...data });

    return {
      success: true,
      message: `OTP sent successfully to +91 ${data.mobile}`,
      expiresInSeconds: 300,
      devMockOtp: MOCK_OTP_CODE,
    };
  },

  // Send OTP for login
  async sendLoginOtp(mobile: string): Promise<SendOtpResponse> {
    await new Promise((res) => setTimeout(res, 500));
    const trimmedMobile = mobile.trim();

    return {
      success: true,
      message: `OTP sent to +91 ${trimmedMobile}`,
      expiresInSeconds: 300,
      devMockOtp: MOCK_OTP_CODE,
    };
  },

  // Verify OTP for either registration or login
  async verifyOtp(mobile: string, otp: string, flow: OtpFlowType): Promise<AuthResponse> {
    await new Promise((res) => setTimeout(res, 750));
    const trimmedMobile = mobile.trim();

    if (otp !== MOCK_OTP_CODE) {
      return {
        success: false,
        message: 'Invalid OTP entered. For testing, use OTP: 123456',
      };
    }

    if (flow === 'register') {
      const pending = pendingRegistrations.get(trimmedMobile);
      const user: UserProfile = {
        id: `user_${Date.now()}`,
        fullName: pending?.fullName || 'Registered User',
        mobile: trimmedMobile,
        sex: pending?.sex || 'other',
        age: pending?.age || 25,
        isRegistered: true,
      };

      mockRegisteredUsers.set(trimmedMobile, user);
      pendingRegistrations.delete(trimmedMobile);

      return {
        success: true,
        message: 'Registration verified successfully!',
        token: `mock_jwt_token_${Date.now()}`,
        user,
      };
    } else {
      // Login flow
      let user = mockRegisteredUsers.get(trimmedMobile);
      if (!user) {
        // Create basic profile if user logged in without explicit prior registration in mock
        user = {
          id: `user_${Date.now()}`,
          fullName: 'Returning Patient',
          mobile: trimmedMobile,
          sex: 'other',
          age: 30,
          isRegistered: true,
        };
        mockRegisteredUsers.set(trimmedMobile, user);
      }

      return {
        success: true,
        message: 'Login successful!',
        token: `mock_jwt_token_${Date.now()}`,
        user,
      };
    }
  },

  // Resend OTP
  async resendOtp(mobile: string): Promise<SendOtpResponse> {
    await new Promise((res) => setTimeout(res, 400));
    return {
      success: true,
      message: `New OTP dispatched to +91 ${mobile}`,
      expiresInSeconds: 300,
      devMockOtp: MOCK_OTP_CODE,
    };
  }
};

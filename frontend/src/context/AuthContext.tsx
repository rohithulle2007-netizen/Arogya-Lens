import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRegistration, OtpFlowType } from '../types/auth';
import { authService } from '../services/api/authService';

interface AuthContextType {
  user: UserProfile | null;
  pendingMobile: string | null;
  otpFlow: OtpFlowType;
  isLoading: boolean;
  error: string | null;
  devHintOtp: string | null;
  initiateRegistration: (data: UserRegistration) => Promise<{ success: boolean; message?: string }>;
  initiateLogin: (mobile: string) => Promise<{ success: boolean; message?: string }>;
  verifyOtpCode: (otp: string) => Promise<{ success: boolean; message?: string }>;
  resendOtpCode: () => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    // Only session storage for token/user (transient session), no sensitive unencrypted data
    const saved = sessionStorage.getItem('arogya_user_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [pendingMobile, setPendingMobile] = useState<string | null>(() => {
    return sessionStorage.getItem('arogya_pending_mobile') || null;
  });
  const [otpFlow, setOtpFlow] = useState<OtpFlowType>(() => {
    return (sessionStorage.getItem('arogya_otp_flow') as OtpFlowType) || 'register';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devHintOtp, setDevHintOtp] = useState<string | null>('123456');

  useEffect(() => {
    if (user) {
      sessionStorage.setItem('arogya_user_profile', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('arogya_user_profile');
      sessionStorage.removeItem('arogya_auth_token');
    }
  }, [user]);

  const initiateRegistration = async (data: UserRegistration) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.registerUser(data);
      if (res.success) {
        setPendingMobile(data.mobile);
        setOtpFlow('register');
        sessionStorage.setItem('arogya_pending_mobile', data.mobile);
        sessionStorage.setItem('arogya_otp_flow', 'register');
        if (res.devMockOtp) setDevHintOtp(res.devMockOtp);
        return { success: true, message: res.message };
      } else {
        setError(res.message);
        return { success: false, message: res.message };
      }
    } catch (err: any) {
      const msg = err.message || 'Registration failed';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const initiateLogin = async (mobile: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.sendLoginOtp(mobile);
      if (res.success) {
        setPendingMobile(mobile);
        setOtpFlow('login');
        sessionStorage.setItem('arogya_pending_mobile', mobile);
        sessionStorage.setItem('arogya_otp_flow', 'login');
        if (res.devMockOtp) setDevHintOtp(res.devMockOtp);
        return { success: true, message: res.message };
      } else {
        setError(res.message);
        return { success: false, message: res.message };
      }
    } catch (err: any) {
      const msg = err.message || 'Login request failed';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtpCode = async (otp: string) => {
    if (!pendingMobile) {
      setError('Session expired. Please enter your mobile number again.');
      return { success: false, message: 'Missing mobile number' };
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.verifyOtp(pendingMobile, otp, otpFlow);
      if (res.success && res.user) {
        setUser(res.user);
        if (res.token) {
          sessionStorage.setItem('arogya_auth_token', res.token);
        }
        return { success: true, message: res.message };
      } else {
        setError(res.message || 'Invalid OTP code');
        return { success: false, message: res.message };
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to verify OTP';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtpCode = async () => {
    if (!pendingMobile) return { success: false, message: 'Missing mobile number' };
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.resendOtp(pendingMobile);
      if (res.devMockOtp) setDevHintOtp(res.devMockOtp);
      return { success: res.success, message: res.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to resend OTP' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setPendingMobile(null);
    sessionStorage.clear();
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        pendingMobile,
        otpFlow,
        isLoading,
        error,
        devHintOtp,
        initiateRegistration,
        initiateLogin,
        verifyOtpCode,
        resendOtpCode,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { OtpVerificationPage } from '../pages/auth/OtpVerificationPage';
import { WelcomePage } from '../pages/screening/WelcomePage';
import { ScannerPage } from '../pages/screening/ScannerPage';
import { QualityCheckPage } from '../pages/screening/QualityCheckPage';
import { ResultPage } from '../pages/screening/ResultPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { HistoryPage } from '../pages/history/HistoryPage';
import { ScreeningDetailPage } from '../pages/history/ScreeningDetailPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { TrendsPage } from '../pages/trends/TrendsPage';
import { useAuth } from '../context/AuthContext';

export const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Root redirect */}
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
      />

      {/* Authentication & Onboarding Routes */}
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register/verify-otp" element={<OtpVerificationPage />} />
      <Route path="/verify-otp" element={<OtpVerificationPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/verify-otp" element={<OtpVerificationPage />} />

      {/* Core Screening User Journey Routes (Frontend Member 1 Scope) */}
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/scanner" element={<ScannerPage />} />
      <Route path="/scanner/quality" element={<QualityCheckPage />} />
      <Route path="/screening/result" element={<ResultPage />} />

      {/* Post-Screening & User Data Routes (Frontend Member 2 Scope) */}
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/history/:screeningId" element={<ScreeningDetailPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/trends" element={<TrendsPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};


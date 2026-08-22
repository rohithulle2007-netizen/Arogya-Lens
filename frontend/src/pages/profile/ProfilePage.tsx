import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  LogOut,
  RefreshCw,
  FileCheck,
  Lock,
  ExternalLink,
  Info,
} from 'lucide-react';
import { ProfileData, ProfileUpdateRequest } from '../../types/health';
import { profileService } from '../../services/api/profileService';
import { useAuth } from '../../context/AuthContext';
import { AppLayout } from '../../components/navigation/AppLayout';
import { ProfileCard } from '../../components/profile/ProfileCard';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await profileService.getProfile();
      // If auth user has customized name/mobile, combine gracefully
      if (user?.fullName && user.fullName !== 'Returning Patient') {
        data.name = user.fullName;
      }
      if (user?.mobile) {
        data.mobile = user.mobile.startsWith('+') ? user.mobile : `+91 ${user.mobile}`;
      }
      setProfile(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const handleUpdateProfile = async (updated: ProfileUpdateRequest) => {
    try {
      const result = await profileService.updateProfile(updated);
      setProfile(result);
      setSuccessToast('Profile updated successfully!');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update profile');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppLayout subtitle="User Account & Medical Profile">
      <div className="space-y-5 text-left">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <User className="w-6 h-6 text-teal-600" />
              Patient Profile
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Personal demographics and screening records
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            leftIcon={<LogOut className="w-4 h-4 text-rose-500" />}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-bold"
          >
            Sign Out
          </Button>
        </div>

        {/* Success Toast Banner */}
        {successToast && (
          <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
            <span>{successToast}</span>
            <button
              onClick={() => setSuccessToast(null)}
              className="text-emerald-700 hover:text-emerald-900 text-sm font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-6 h-6 text-teal-600 animate-spin" />
            <p className="text-xs font-semibold text-slate-600 mt-2">Loading profile details...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={loadProfile}>
              Retry
            </Button>
          </div>
        )}

        {/* Profile Card */}
        {!isLoading && profile && (
          <ProfileCard profile={profile} onUpdateProfile={handleUpdateProfile} />
        )}

        {/* Privacy & Health Data Standards Card */}
        <Card className="space-y-3 bg-slate-50/70 border-slate-200/80 text-xs">
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <Lock className="w-4 h-4 text-teal-600" />
            <span>Data Security & Clinical Privacy</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Your optical image data and non-invasive estimation metrics are securely processed on-device and stored with clinical end-to-end privacy standards. Images are analyzed for palpebral vascularity estimation and not shared with unapproved third parties.
          </p>
          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>Arogya Lens v1.0 • Member 2 Component</span>
            <span className="text-teal-700 font-semibold">HIPAA / ABDM Ready</span>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

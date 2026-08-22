import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Activity, ArrowLeft, ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
  hideUser?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  showBack,
  onBack,
  title,
  subtitle,
  hideUser = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const isAuthPage = ['/login', '/register', '/login/verify-otp', '/verify-otp'].includes(location.pathname);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 safe-top">
      <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={handleBack}
              aria-label="Go back"
              className="p-1.5 -ml-1.5 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div
            onClick={() => navigate(user ? '/dashboard' : '/welcome')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-600 group-hover:bg-teal-700 flex items-center justify-center text-white shadow-sm shadow-teal-500/20 transition">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 group-hover:text-teal-900 tracking-tight text-base transition">
                  Arogya Lens
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200/60">
                  Screening
                </span>
              </div>
              {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
            </div>
          </div>
        </div>

        {/* Right action / User profile info */}
        <div className="flex items-center gap-2">
          {!hideUser && user && !isAuthPage ? (
            <div className="flex items-center gap-2">
              <div
                onClick={() => navigate('/profile')}
                className="cursor-pointer hover:bg-slate-50 px-2 py-1 rounded-lg transition flex items-center gap-2"
                title="View Profile"
              >
                <div className="hidden sm:flex flex-col items-end text-right">
                  <span className="text-xs font-semibold text-slate-800 leading-tight hover:text-teal-700">
                    {user.fullName}
                  </span>
                  <span className="text-[10px] text-slate-500">{user.mobile}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                title="Sign out"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">Secure</span>
            </div>
          )}
        </div>
      </div>
      {title && (
        <div className="bg-slate-50/70 border-t border-slate-100 px-4 py-2 text-center text-xs font-medium text-slate-600">
          {title}
        </div>
      )}
    </header>
  );
};

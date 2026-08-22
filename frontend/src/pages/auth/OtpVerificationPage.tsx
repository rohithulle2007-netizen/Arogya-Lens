import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowRight, RefreshCw, KeyRound, CheckCircle2 } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { OtpInput } from '../../components/screening/OtpInput';
import { useAuth } from '../../context/AuthContext';

export const OtpVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    pendingMobile,
    otpFlow,
    verifyOtpCode,
    resendOtpCode,
    isLoading,
    error,
    clearError,
    devHintOtp,
  } = useAuth();

  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(30);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  // If no mobile in session, bounce back to login
  useEffect(() => {
    if (!pendingMobile) {
      navigate(location.pathname.includes('register') ? '/register' : '/login', { replace: true });
    }
  }, [pendingMobile, navigate, location.pathname]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async (codeToVerify?: string) => {
    const activeCode = codeToVerify || otp;
    if (activeCode.length !== 6) return;

    clearError();
    const res = await verifyOtpCode(activeCode);
    if (res.success) {
      navigate('/welcome');
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    clearError();
    setResendSuccess(null);
    const res = await resendOtpCode();
    if (res.success) {
      setResendSuccess(res.message || 'New OTP sent!');
      setResendCooldown(30);
      setTimeout(() => setResendSuccess(null), 4000);
    }
  };

  const formatMobile = (m: string | null) => {
    if (!m) return '';
    return `+91 ${m.slice(0, 5)} ${m.slice(5)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Header showBack onBack={() => navigate(-1)} hideUser />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 flex flex-col justify-center">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200/80 text-teal-600 mx-auto flex items-center justify-center mb-3 shadow-sm">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Enter Verification Code
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-slate-800">{formatMobile(pendingMobile)}</span>
          </p>
        </div>

        <Card className="shadow-lg border-slate-200/90 text-center">
          {error && (
            <div className="p-3 mb-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {resendSuccess && (
            <div className="p-3 mb-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> {resendSuccess}
            </div>
          )}

          {/* 6-Digit OTP Field */}
          <OtpInput
            value={otp}
            onChange={setOtp}
            hasError={!!error}
            disabled={isLoading}
            onComplete={(fullCode) => handleVerify(fullCode)}
          />

          {/* Dev mock OTP hint badge */}
          {devHintOtp && (
            <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-medium">
              <span>Development Mock OTP:</span>
              <button
                type="button"
                onClick={() => {
                  setOtp(devHintOtp);
                  handleVerify(devHintOtp);
                }}
                className="font-bold underline text-teal-800 hover:text-teal-950"
              >
                {devHintOtp} (Auto-Fill)
              </button>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={otp.length !== 6}
            isLoading={isLoading}
            onClick={() => handleVerify()}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Verify & Continue
          </Button>

          {/* Resend Code Section */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Didn't receive code?</span>
            {resendCooldown > 0 ? (
              <span className="text-slate-400 font-medium">
                Resend in <strong className="text-slate-600">{resendCooldown}s</strong>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading}
                className="font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Resend OTP
              </button>
            )}
          </div>
        </Card>
      </main>

      <footer className="py-4 text-center text-[11px] text-slate-400">
        Arogya Lens • Non-Invasive Healthcare Screening
      </footer>
    </div>
  );
};

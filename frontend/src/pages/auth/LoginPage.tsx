import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, ArrowRight, ShieldCheck, UserPlus } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { initiateLogin, isLoading, error, clearError } = useAuth();
  const [mobile, setMobile] = useState('');
  const [mobileError, setMobileError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setMobileError('');

    const clean = mobile.replace(/\D/g, '');
    if (!clean || clean.length !== 10) {
      setMobileError('Please enter a valid 10-digit mobile number');
      return;
    }

    const res = await initiateLogin(clean);
    if (res.success) {
      navigate('/login/verify-otp');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Header hideUser />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 flex flex-col justify-center">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Enter your mobile number to sign in and access your screening.
          </p>
        </div>

        <Card className="shadow-lg border-slate-200/90">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <Input
              label="Registered Mobile Number"
              placeholder="10-digit mobile number"
              type="tel"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
              error={mobileError}
              leftIcon={<Phone className="w-4 h-4" />}
              autoComplete="tel"
              helperText="Returning users do not need to re-enter name, age, or sex."
              required
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Send OTP
              </Button>
            </div>
          </form>
        </Card>

        {/* New user switch */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-500">
            First time using Arogya Lens?{' '}
            <Link to="/register" className="font-semibold text-teal-700 hover:text-teal-800 underline">
              Create New Registration
            </Link>
          </p>
        </div>
      </main>

      <footer className="py-4 text-center text-[11px] text-slate-400">
        Arogya Lens • Non-Invasive Healthcare Screening
      </footer>
    </div>
  );
};

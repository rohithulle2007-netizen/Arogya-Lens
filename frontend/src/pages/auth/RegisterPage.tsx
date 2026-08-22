import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, Calendar, Users, ArrowRight, ShieldCheck } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { SexType } from '../../types/auth';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { initiateRegistration, isLoading, error, clearError } = useAuth();

  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [sex, setSex] = useState<SexType>('female');
  const [age, setAge] = useState<string>('28');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 2) {
      errors.fullName = 'Name must be at least 2 characters';
    }

    const cleanMobile = mobile.replace(/\D/g, '');
    if (!cleanMobile) {
      errors.mobile = 'Mobile number is required';
    } else if (cleanMobile.length !== 10) {
      errors.mobile = 'Please enter a valid 10-digit mobile number';
    }

    const numAge = parseInt(age, 10);
    if (!age || isNaN(numAge)) {
      errors.age = 'Age is required';
    } else if (numAge < 1 || numAge > 120) {
      errors.age = 'Please enter a valid age between 1 and 120';
    }

    if (!sex) {
      errors.sex = 'Please select biological sex';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validate()) return;

    const res = await initiateRegistration({
      fullName: fullName.trim(),
      mobile: mobile.replace(/\D/g, ''),
      sex,
      age: parseInt(age, 10),
    });

    if (res.success) {
      navigate('/register/verify-otp');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Header hideUser />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 flex flex-col justify-center">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Patient Registration
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Register your profile to begin fast, non-invasive optical anaemia screening.
          </p>
        </div>

        <Card className="shadow-lg border-slate-200/90">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Full Name */}
            <Input
              label="Full Name"
              placeholder="e.g. Priya Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={formErrors.fullName}
              leftIcon={<User className="w-4 h-4" />}
              autoComplete="name"
              required
            />

            {/* Mobile Number */}
            <Input
              label="Mobile Number"
              placeholder="10-digit mobile number"
              type="tel"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
              error={formErrors.mobile}
              leftIcon={<Phone className="w-4 h-4" />}
              autoComplete="tel"
              helperText="We will send a 6-digit OTP to verify"
              required
            />

            <div className="grid grid-cols-2 gap-3">
              {/* Age */}
              <Input
                label="Age (Years)"
                placeholder="e.g. 28"
                type="number"
                min="1"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                error={formErrors.age}
                leftIcon={<Calendar className="w-4 h-4" />}
                required
              />

              {/* Sex */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Sex
                </label>
                <div className="relative">
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value as SexType)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {formErrors.sex && <p className="text-xs text-rose-600 font-medium">{formErrors.sex}</p>}
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Proceed to OTP Verification
              </Button>
            </div>
          </form>
        </Card>

        {/* Existing user switch */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-500">
            Already registered before?{' '}
            <Link to="/login" className="font-semibold text-teal-700 hover:text-teal-800 underline">
              Login with Mobile Number
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

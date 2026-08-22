import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Shield, Sparkles, ArrowRight, CheckCircle2, HeartPulse, Stethoscope } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { useScreening } from '../../context/ScreeningContext';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reportedSymptoms, toggleSymptom } = useScreening();

  const availableSymptoms = [
    'Fatigue / Weakness',
    'Dizziness / Lightheadedness',
    'Pale skin or conjunctiva',
    'Shortness of breath',
    'Cold hands or feet',
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Header />

      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 flex flex-col justify-center gap-5">
        {/* Welcome Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold">
            <HeartPulse className="w-3.5 h-3.5" />
            <span>AI-Powered Non-Invasive Screening</span>
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {user?.fullName ? `Welcome, ${user.fullName.split(' ')[0]}` : 'Arogya Lens'}
          </h1>
          <p className="text-sm font-medium text-teal-700">
            Let's begin your screening.
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Screen for potential anaemia in seconds by capturing a high-resolution image of your lower palpebral conjunctiva.
          </p>
        </div>

        {/* 3 Step Process Card */}
        <Card className="text-left space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Quick 3-Step Screening Guide
          </h3>
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                1
              </div>
              <p>
                <strong>Allow Camera:</strong> Grant camera access for high-definition optical capture.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                2
              </div>
              <p>
                <strong>Align Eye & Conjunctiva:</strong> Position your eye inside the rectangular frame and gently lower your eyelid.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                3
              </div>
              <p>
                <strong>Instant Hb Estimate:</strong> Receive instant haemoglobin and confidence screening estimates.
              </p>
            </div>
          </div>
        </Card>

        {/* Optional Symptom Tracker */}
        <Card className="text-left space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-teal-600" />
              Experiencing any symptoms?
            </h3>
            <span className="text-[10px] text-slate-400">Optional</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Select any symptoms you've noticed recently to include in your clinical report:
          </p>
          <div className="flex flex-wrap gap-2">
            {availableSymptoms.map((symptom) => {
              const isSelected = reportedSymptoms.includes(symptom);
              return (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => toggleSymptom(symptom)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150 active:scale-95 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-600/20'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {symptom}
                </button>
              );
            })}
          </div>
        </Card>

        {/* PRIMARY CTA */}
        <div className="pt-2">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => navigate('/scanner')}
            leftIcon={<Eye className="w-5 h-5" />}
            rightIcon={<ArrowRight className="w-5 h-5" />}
          >
            Start Eye Screening
          </Button>
        </div>
      </main>

      <footer className="py-4 text-center text-[11px] text-slate-400">
        Arogya Lens • Non-Invasive Healthcare Screening
      </footer>
    </div>
  );
};

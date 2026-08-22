import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Info,
  SlidersHorizontal,
  ChevronRight,
  FileCheck
} from 'lucide-react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { ScreeningResultData, ConfidenceTier } from '../../types/screening';
import { useScreening } from '../../context/ScreeningContext';
import { mockScreeningService, MockConfidenceMode } from '../../services/mocks/mockScreeningService';

interface ScreeningResultProps {
  data?: ScreeningResultData | null;
  onRetake?: () => void;
  onDone?: () => void;
}

export const ScreeningResult: React.FC<ScreeningResultProps> = ({
  data: externalData,
  onRetake,
  onDone,
}) => {
  const navigate = useNavigate();
  const { screeningResult: contextData, resetScreening, runScreeningAnalysis } = useScreening();
  const [showSimControls, setShowSimControls] = useState(false);

  // Fallback default if navigating directly
  const data: ScreeningResultData = externalData || contextData || {
    screening_id: 'AL-849201',
    estimated_hb: 10.8,
    confidence: 0.86,
    status: 'possible_anemia',
    image_quality: 'good',
    reported_symptoms: ['Fatigue', 'Dizziness'],
    created_at: new Date().toISOString(),
  };

  const handleRetake = () => {
    if (onRetake) {
      onRetake();
    } else {
      resetScreening();
      navigate('/scanner');
    }
  };

  const handleDone = () => {
    if (onDone) {
      onDone();
    } else {
      resetScreening();
      navigate('/dashboard');
    }
  };

  const handleConfidenceModeChange = async (mode: MockConfidenceMode) => {
    mockScreeningService.setConfidenceMode(mode);
    await runScreeningAnalysis();
  };

  // Compute Confidence Tier
  const getConfidenceTier = (confidence: number): ConfidenceTier => {
    if (confidence >= 0.80) return 'high';
    if (confidence >= 0.60) return 'medium';
    return 'low';
  };

  const confidenceTier = getConfidenceTier(data.confidence);
  const confidencePercent = Math.round(data.confidence * 100);

  // Format Status display
  const getStatusDisplay = (status: string, estimatedHb: number) => {
    if (status === 'normal' || estimatedHb >= 12.0) {
      return {
        label: 'Normal Hb Range',
        badge: 'success' as const,
        color: 'text-emerald-700',
        bg: 'bg-emerald-50 border-emerald-200',
        desc: 'Estimated haemoglobin is within typical expected physiological reference levels.',
      };
    }

    if (status === 'severe_anemia' || estimatedHb < 8.0) {
      return {
        label: 'Severe Anaemia Indicated',
        badge: 'danger' as const,
        color: 'text-rose-700',
        bg: 'bg-rose-50 border-rose-200',
        desc: 'Low conjunctival pallor detected consistent with severe anaemia.',
      };
    }

    return {
      label: 'Possible Anaemia',
      badge: 'warning' as const,
      color: 'text-amber-700',
      bg: 'bg-amber-50 border-amber-200',
      desc: 'Conjunctival vascularity suggests lower than typical haemoglobin levels.',
    };
  };

  const statusConfig = getStatusDisplay(data.status, data.estimated_hb);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4 text-left">
      {/* Top Banner / ID */}
      <div className="flex items-center justify-between px-1">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-teal-700">
            Screening Report
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Screening Result</h2>
        </div>
        <Badge variant="default" className="text-[11px]">
          ID: {data.screening_id}
        </Badge>
      </div>

      {/* LOW CONFIDENCE STATE: Prompt retake */}
      {confidenceTier === 'low' ? (
        <Card className="bg-amber-50/70 border-amber-200 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-900">
                Unable to provide a reliable screening estimate
              </h3>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                The optical analysis confidence is too low ({confidencePercent}%) to generate an accurate haemoglobin estimate. This may occur due to motion blur, indirect lighting, or partial conjunctiva occlusion.
              </p>
            </div>
          </div>

          <div className="p-3 bg-white/80 rounded-xl border border-amber-200/80 text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800">Tips for an optimal scan:</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              <li>Ensure your face and eye are evenly lit (avoid backlighting).</li>
              <li>Gently pull down your lower eyelid to show the pinkish/red conjunctiva.</li>
              <li>Keep the device completely still until captured.</li>
            </ul>
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleRetake}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Retake Scan
          </Button>
        </Card>
      ) : (
        /* NORMAL & MEDIUM CONFIDENCE STATE */
        <>
          {/* Primary Metric Card */}
          <Card className="space-y-4 shadow-sm">
            {/* Status Pill & Header */}
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${statusConfig.bg} ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="font-medium">Confidence:</span>
                <span className={`font-bold ${confidenceTier === 'medium' ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {confidencePercent}%
                </span>
              </div>
            </div>

            {/* Estimated Haemoglobin Display */}
            <div className="flex items-baseline justify-between py-2 border-y border-slate-100">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Estimated Hb
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                    {data.estimated_hb.toFixed(1)}
                  </span>
                  <span className="text-base font-bold text-slate-500">g/dL</span>
                </div>
              </div>

              {/* Normal reference range indicator */}
              <div className="text-right text-xs">
                <span className="text-slate-400">Reference:</span>
                <p className="font-medium text-slate-700">12.0 – 16.0 g/dL</p>
                <p className="text-[10px] text-slate-400">(General adult benchmark)</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {statusConfig.desc}
            </p>

            {/* MEDIUM CONFIDENCE NOTICE */}
            {confidenceTier === 'medium' && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-800 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Moderate Analysis Confidence ({confidencePercent}%)</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Result may be less reliable due to slight glare or lighting variation. Consider retaking the image for maximum precision.
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* CRITICAL MEDICAL DISCLAIMER */}
          <div className="p-3.5 rounded-2xl bg-teal-50/90 border border-teal-200 text-teal-900 text-xs flex items-start gap-3">
            <Info className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-teal-950">
                Screening estimate — not a laboratory diagnosis.
              </p>
              <p className="text-[11px] text-teal-800 leading-relaxed">
                This optical screening is an AI-assisted non-invasive estimation and does not replace certified laboratory blood tests (such as CBC / venous haemoglobin).
              </p>
            </div>
          </div>

          {/* REPORTED SYMPTOMS (Segregated patient report, NOT proof) */}
          {data.reported_symptoms && data.reported_symptoms.length > 0 && (
            <Card className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Reported Symptoms
                </h4>
                <span className="text-[10px] text-slate-400">(Self-reported)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.reported_symptoms.map((symptom, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                    {symptom}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 italic">
                Note: Symptoms are recorded for clinical context only and are not presented as diagnostic proof of anaemia.
              </p>
            </Card>
          )}

          {/* RECOMMENDED NEXT STEPS */}
          <Card className="bg-slate-900 text-white space-y-2.5 border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4" /> Next Steps & Clinical Advice
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Consider confirmatory haemoglobin testing or consultation with a healthcare professional.
            </p>
          </Card>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={handleRetake}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Retake Scan
            </Button>
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={handleDone}
              rightIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Finish Screening
            </Button>
          </div>
        </>
      )}

      {/* DEV / DEMO CONFIDENCE STATE SELECTOR */}
      <div className="pt-3 border-t border-slate-200/80">
        <button
          onClick={() => setShowSimControls((p) => !p)}
          className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 mx-auto"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Demo: Test Confidence Scenarios</span>
        </button>

        {showSimControls && (
          <div className="mt-2 p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
            <p className="text-[11px] text-slate-500">
              Quickly test the 3 required confidence states:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleConfidenceModeChange('high')}
                className={`p-1.5 rounded text-[11px] font-bold border transition ${
                  mockScreeningService.getConfidenceMode() === 'high'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                High (86%)
              </button>
              <button
                onClick={() => handleConfidenceModeChange('medium')}
                className={`p-1.5 rounded text-[11px] font-bold border transition ${
                  mockScreeningService.getConfidenceMode() === 'medium'
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Medium (68%)
              </button>
              <button
                onClick={() => handleConfidenceModeChange('low')}
                className={`p-1.5 rounded text-[11px] font-bold border transition ${
                  mockScreeningService.getConfidenceMode() === 'low'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Low (48%)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Activity,
  Sparkles,
  ShieldAlert,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Share2,
  FileText,
  Eye,
  Stethoscope,
} from 'lucide-react';
import { ScreeningRecord, getConfidenceMeta, getStatusMeta } from '../../types/health';
import { formatScreeningDate, formatScreeningTime } from '../../utils/dateTime';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

interface ScreeningDetailsViewProps {
  screening: ScreeningRecord;
  onBack?: () => void;
}

export const ScreeningDetailsView: React.FC<ScreeningDetailsViewProps> = ({ screening, onBack }) => {
  const navigate = useNavigate();

  const confMeta = getConfidenceMeta(screening.confidence);
  const statusMeta = getStatusMeta(screening.status, screening.estimated_hb);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/history');
    }
  };

  const formattedDate = formatScreeningDate(screening.date || screening.created_at);
  const formattedTime = formatScreeningTime(screening.time, screening.date || screening.created_at);

  const getImageQualityBadge = (quality: string) => {
    const q = (quality || '').toLowerCase();
    if (q === 'good') {
      return {
        label: 'Good Optical Quality',
        variant: 'success' as const,
        desc: 'Sharp palpebral conjunctiva clarity with uniform illumination.',
      };
    }
    if (q === 'fair') {
      return {
        label: 'Fair Optical Quality',
        variant: 'warning' as const,
        desc: 'Adequate conjunctiva visibility with minor ambient lighting variation.',
      };
    }
    return {
      label: 'Poor Optical Quality',
      variant: 'danger' as const,
      desc: 'Sub-optimal lighting or slight motion blur detected during capture.',
    };
  };

  const qualityMeta = getImageQualityBadge(screening.image_quality);

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 text-left">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to History</span>
        </button>

        <Badge variant="default" className="text-xs font-mono font-bold">
          ID: {screening.screening_id}
        </Badge>
      </div>

      {/* Primary Header Card */}
      <Card className="space-y-4">
        {/* Status Pill & Optical Confidence */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <span
            className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${statusMeta.bgColor} ${statusMeta.textColor} ${statusMeta.borderColor}`}
          >
            {statusMeta.label}
          </span>

          <div
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${confMeta.bgColor} ${confMeta.textColor} ${confMeta.borderColor}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {confMeta.percentage}% Optical Confidence ({confMeta.tier.toUpperCase()})
            </span>
          </div>
        </div>

        {/* Date and Time Header */}
        <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            <span>{formattedDate}</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="inline-flex items-center gap-1 text-teal-700 bg-teal-50/80 px-2 py-0.5 rounded-md font-medium text-[11px] border border-teal-200/60">
            <Clock className="w-3 h-3 text-teal-600" />
            <span>{formattedTime}</span>
          </div>
        </div>

        {/* ESTIMATED HAEMOGLOBIN READOUT */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex items-baseline justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-teal-800 block">
              Estimated Hb
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                {screening.estimated_hb.toFixed(1)}
              </span>
              <span className="text-base font-bold text-slate-500">g/dL</span>
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="text-slate-400 block font-medium">Standard Reference:</span>
            <span className="font-bold text-slate-800 block text-sm mt-0.5">12.0 – 16.0 g/dL</span>
            <span className="text-[10px] text-slate-400">(General adult benchmark)</span>
          </div>
        </div>

        {/* Status Clinical Description */}
        <p className="text-xs text-slate-600 leading-relaxed">
          {statusMeta.description}
        </p>
      </Card>

      {/* CRITICAL MEDICAL DISCLAIMER */}
      <div className="p-4 rounded-2xl bg-teal-50/90 border border-teal-200 text-teal-900 text-xs flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-teal-700 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-extrabold text-teal-950 text-sm">
            Screening estimate — not a laboratory diagnosis.
          </p>
          <p className="text-[11px] text-teal-800 leading-relaxed">
            This optical screening provides an AI-assisted non-invasive estimate based on conjunctival microvascular pallor. It does not replace clinical laboratory blood testing (such as venous CBC or certified photometer analysis).
          </p>
        </div>
      </div>

      {/* Optical Image Quality Assessment */}
      <Card className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-teal-600" />
            Image Quality Assessment
          </h4>
          <Badge variant={qualityMeta.variant} className="text-[10px]">
            {qualityMeta.label}
          </Badge>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          {qualityMeta.desc}
        </p>
      </Card>

      {/* Reported Symptoms (Segregated Patient Report) */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Stethoscope className="w-4 h-4 text-teal-600" />
            Reported Symptoms
          </h4>
          <span className="text-[10px] text-slate-400">(Self-reported)</span>
        </div>

        {screening.symptoms && screening.symptoms.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {screening.symptoms.map((symptom, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                {symptom}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No symptoms were recorded during this screening.</p>
        )}

        <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-100">
          Note: Symptoms are recorded for clinical context only and are not presented as diagnostic proof of anaemia.
        </p>
      </Card>

      {/* Next Steps & Healthcare Advice */}
      <Card className="bg-slate-900 text-white space-y-2.5 border-slate-800">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400">
            Next Steps & Guidance
          </h4>
        </div>
        <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
          <li>Consider scheduling a confirmatory complete blood count (CBC) with your physician if values remain below reference levels.</li>
          <li>Ensure adequate intake of dietary iron (leafy greens, legumes, whole grains, lean meats) and Vitamin C.</li>
          <li>Repeat periodic non-invasive screenings to monitor trends over time.</li>
        </ul>
      </Card>

      {/* Navigation Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          variant="outline"
          size="md"
          fullWidth
          onClick={handleBack}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to History
        </Button>
        <Button
          variant="primary"
          size="md"
          fullWidth
          onClick={() => navigate('/dashboard')}
          rightIcon={<Activity className="w-4 h-4" />}
        >
          Open Dashboard
        </Button>
      </div>
    </div>
  );
};

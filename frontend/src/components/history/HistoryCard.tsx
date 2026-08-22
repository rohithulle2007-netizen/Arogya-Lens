import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Calendar, Clock, Sparkles } from 'lucide-react';
import { ScreeningRecord, getConfidenceMeta, getStatusMeta } from '../../types/health';
import { formatScreeningDate, formatScreeningTime } from '../../utils/dateTime';

interface HistoryCardProps {
  screening: ScreeningRecord;
  onClick?: () => void;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({ screening, onClick }) => {
  const navigate = useNavigate();

  const confMeta = getConfidenceMeta(screening.confidence);
  const statusMeta = getStatusMeta(screening.status, screening.estimated_hb);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/history/${screening.screening_id}`);
    }
  };

  const formattedDate = formatScreeningDate(screening.date || screening.created_at);
  const formattedTime = formatScreeningTime(screening.time, screening.date || screening.created_at);

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className="w-full bg-white rounded-2xl border border-slate-200/90 hover:border-teal-400/80 shadow-xs hover:shadow-md transition-all duration-200 p-4 text-left cursor-pointer group focus:outline-none focus:ring-2 focus:ring-teal-500/40"
    >
      {/* Top Header: Date, Time & Status Pill */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
            <Calendar className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
            <span>{formattedDate}</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1 text-teal-700 bg-teal-50/80 px-2 py-0.5 rounded-md font-medium text-[11px] border border-teal-200/60">
            <Clock className="w-3 h-3 text-teal-600 flex-shrink-0" />
            <span>{formattedTime}</span>
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusMeta.bgColor} ${statusMeta.textColor} ${statusMeta.borderColor}`}
        >
          {statusMeta.label}
        </span>
      </div>

      {/* Main Metric Row: Estimated Hb & Confidence */}
      <div className="flex items-center justify-between py-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Estimated Hb
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 group-hover:text-teal-900 transition">
              {screening.estimated_hb.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-slate-500">g/dL</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-semibold text-slate-400 block">Optical Confidence</span>
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg border mt-0.5 ${confMeta.bgColor} ${confMeta.textColor} ${confMeta.borderColor}`}
            >
              <Sparkles className="w-3 h-3" />
              {confMeta.percentage}% ({confMeta.tier.toUpperCase()})
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-teal-50 text-slate-400 group-hover:text-teal-600 flex items-center justify-center transition flex-shrink-0">
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>

      {/* Reported Symptoms Tags */}
      {screening.symptoms && screening.symptoms.length > 0 && (
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mr-1">
            Symptoms:
          </span>
          {screening.symptoms.map((symptom, idx) => (
            <span
              key={idx}
              className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60"
            >
              {symptom}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

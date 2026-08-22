import React from 'react';
import { ClipboardCheck, Activity, ShieldCheck, Calendar, ArrowUpRight } from 'lucide-react';
import { getConfidenceMeta, getStatusMeta } from '../../types/health';

interface SummaryCardsProps {
  totalScreenings: number;
  latestEstimatedHb: number;
  latestConfidence: number;
  lastScreeningDate: string;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  totalScreenings,
  latestEstimatedHb,
  latestConfidence,
  lastScreeningDate,
}) => {
  const confMeta = getConfidenceMeta(latestConfidence);
  const statusMeta = getStatusMeta('possible_anemia', latestEstimatedHb);

  // Format date nicely if ISO
  const formattedDate = (() => {
    try {
      const d = new Date(lastScreeningDate);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch {}
    return lastScreeningDate;
  })();

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {/* Total Screenings */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm hover:border-slate-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Screenings
          </span>
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <ClipboardCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {totalScreenings}
          </span>
          <span className="text-xs text-slate-400 font-medium">completed</span>
        </div>
        <p className="text-[10px] text-teal-700 font-semibold mt-1 flex items-center gap-1">
          Recorded in history
        </p>
      </div>

      {/* Latest Estimated Hb */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm hover:border-slate-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Latest Estimated Hb
          </span>
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {latestEstimatedHb.toFixed(1)}
          </span>
          <span className="text-xs font-bold text-slate-500">g/dL</span>
        </div>
        <p className={`text-[10px] font-bold mt-1 ${statusMeta.textColor}`}>
          {statusMeta.label}
        </p>
      </div>

      {/* Latest Confidence */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm hover:border-slate-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Latest Confidence
          </span>
          <div className={`w-8 h-8 rounded-xl ${confMeta.bgColor} ${confMeta.textColor} flex items-center justify-center`}>
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {confMeta.percentage}%
          </span>
        </div>
        <p className={`text-[10px] font-bold mt-1 ${confMeta.textColor}`}>
          {confMeta.label}
        </p>
      </div>

      {/* Last Screening Date */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm hover:border-slate-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Last Screening
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-base sm:text-lg font-bold text-slate-800 leading-tight block truncate">
            {formattedDate}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 font-medium mt-1">
          Palpebral optical scan
        </p>
      </div>
    </div>
  );
};

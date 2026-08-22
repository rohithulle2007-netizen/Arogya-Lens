import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, History as HistoryIcon } from 'lucide-react';
import { ScreeningRecord } from '../../types/health';
import { HistoryCard } from '../history/HistoryCard';

interface RecentScreeningsProps {
  screenings: ScreeningRecord[];
}

export const RecentScreenings: React.FC<RecentScreeningsProps> = ({ screenings }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <HistoryIcon className="w-4 h-4 text-teal-600" />
            Recent Screenings
          </h3>
          <p className="text-xs text-slate-500">Your latest non-invasive assessments</p>
        </div>

        <Link
          to="/history"
          className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 px-2.5 py-1.5 rounded-xl transition active:scale-95"
        >
          <span>View All History</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {screenings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center">
          <p className="text-xs font-semibold text-slate-600">No screenings recorded yet.</p>
          <p className="text-[11px] text-slate-400 mt-1">Start your first screening to see your history here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {screenings.map((item) => (
            <HistoryCard key={item.screening_id} screening={item} />
          ))}
        </div>
      )}
    </div>
  );
};

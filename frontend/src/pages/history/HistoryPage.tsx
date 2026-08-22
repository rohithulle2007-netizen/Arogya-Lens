import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History as HistoryIcon, PlusCircle, RefreshCw, Filter, Sparkles } from 'lucide-react';
import { ScreeningRecord } from '../../types/health';
import { historyService } from '../../services/api/historyService';
import { AppLayout } from '../../components/navigation/AppLayout';
import { HistoryCard } from '../../components/history/HistoryCard';
import { Button } from '../../components/common/Button';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<ScreeningRecord[]>([]);
  const [filter, setFilter] = useState<'all' | 'possible_anemia' | 'normal'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await historyService.getHistory();
      setHistory(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load screening history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredHistory = history.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'possible_anemia') {
      return (
        item.status === 'possible_anemia' ||
        item.status === 'mild_anemia' ||
        item.status === 'moderate_anemia' ||
        item.status === 'severe_anemia' ||
        item.estimated_hb < 12.0
      );
    }
    if (filter === 'normal') {
      return item.status === 'normal' || item.estimated_hb >= 12.0;
    }
    return true;
  });

  return (
    <AppLayout subtitle="Past Assessments">
      <div className="space-y-5 text-left">
        {/* Top Header & New Screening CTA */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <HistoryIcon className="w-6 h-6 text-teal-600" />
              Screening History
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review all past optical assessments and clinical notes
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/welcome')}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            New Scan
          </Button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1 flex-shrink-0">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex-shrink-0 ${
              filter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            All ({history.length})
          </button>
          <button
            onClick={() => setFilter('possible_anemia')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex-shrink-0 ${
              filter === 'possible_anemia'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Possible Anaemia
          </button>
          <button
            onClick={() => setFilter('normal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex-shrink-0 ${
              filter === 'normal'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Normal Hb Range
          </button>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-6 h-6 text-teal-600 animate-spin" />
            <p className="text-xs font-semibold text-slate-600 mt-2">Loading screenings...</p>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={loadHistory}>
              Retry
            </Button>
          </div>
        )}

        {/* Screening Records List */}
        {!isLoading && filteredHistory.length > 0 && (
          <div className="space-y-3">
            {filteredHistory.map((screening) => (
              <HistoryCard key={screening.screening_id} screening={screening} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredHistory.length === 0 && !error && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
              <HistoryIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">No screenings match this filter</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Try switching the filter or complete a new screening.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilter('all')}
              className="mx-auto"
            >
              Reset Filter
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

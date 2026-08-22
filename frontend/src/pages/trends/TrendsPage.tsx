import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Activity,
  Calendar,
  Sparkles,
  Info,
  RefreshCw,
  PlusCircle,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { DashboardSummary, TrendPoint } from '../../types/health';
import { dashboardService } from '../../services/api/dashboardService';
import { AppLayout } from '../../components/navigation/AppLayout';
import { HbTrendChart } from '../../components/charts/HbTrendChart';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const TrendsPage: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTrends = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getDashboardSummary();
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load trend analysis');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrends();
  }, []);

  const stats = React.useMemo(() => {
    if (!summary || summary.trend.length === 0) return null;
    const hbValues = summary.trend.map((t) => t.estimated_hb);
    const avg = hbValues.reduce((a, b) => a + b, 0) / hbValues.length;
    const min = Math.min(...hbValues);
    const max = Math.max(...hbValues);
    return {
      average: avg.toFixed(1),
      min: min.toFixed(1),
      max: max.toFixed(1),
      count: hbValues.length,
    };
  }, [summary]);

  return (
    <AppLayout subtitle="Longitudinal Hb Tracking">
      <div className="space-y-6 text-left">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-teal-600" />
              Hb Trend & Analytics
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Longitudinal tracking of estimated haemoglobin over time
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

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-6 h-6 text-teal-600 animate-spin" />
            <p className="text-xs font-semibold text-slate-600 mt-2">Loading trend analytics...</p>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={loadTrends}>
              Retry
            </Button>
          </div>
        )}

        {!isLoading && summary && (
          <>
            {/* Extended Analytics Cards */}
            {stats && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl border border-slate-200 p-3.5 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Average Hb
                  </span>
                  <div className="flex items-baseline justify-center gap-1 mt-1">
                    <span className="text-xl sm:text-2xl font-extrabold text-slate-900">{stats.average}</span>
                    <span className="text-[10px] font-bold text-slate-500">g/dL</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-3.5 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Lowest Hb
                  </span>
                  <div className="flex items-baseline justify-center gap-1 mt-1">
                    <span className="text-xl sm:text-2xl font-extrabold text-rose-600">{stats.min}</span>
                    <span className="text-[10px] font-bold text-slate-500">g/dL</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-3.5 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Highest Hb
                  </span>
                  <div className="flex items-baseline justify-center gap-1 mt-1">
                    <span className="text-xl sm:text-2xl font-extrabold text-emerald-600">{stats.max}</span>
                    <span className="text-[10px] font-bold text-slate-500">g/dL</span>
                  </div>
                </div>
              </div>
            )}

            {/* Main Interactive Chart */}
            <Card className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Estimated Haemoglobin Progression</h3>
                  <p className="text-xs text-slate-500">Interactive timeline of non-invasive readings</p>
                </div>
              </div>

              <HbTrendChart
                data={summary.trend}
                height={270}
                onPointSelect={(p) => {
                  if (p.screening_id) {
                    navigate(`/history/${p.screening_id}`);
                  }
                }}
              />
            </Card>

            {/* Reference Range Details Card */}
            <Card className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-teal-600" />
                Clinical Benchmark Understanding
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <span className="font-bold text-emerald-900 block">Normal Hb Benchmark</span>
                  <p className="text-emerald-800 text-[11px] mt-0.5">
                    <strong>12.0 – 16.0 g/dL</strong>: Typical physiological range for healthy adults.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                  <span className="font-bold text-amber-900 block">Possible Anaemia Indicator</span>
                  <p className="text-amber-800 text-[11px] mt-0.5">
                    <strong>&lt; 12.0 g/dL</strong>: Optical conjunctival pallor indicates potential anaemic condition.
                  </p>
                </div>
              </div>
            </Card>

            {/* Critical Disclaimer */}
            <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-teal-950">
                  Screening estimate — not a laboratory diagnosis.
                </p>
                <p className="text-[11px] text-teal-800 mt-0.5 leading-relaxed">
                  These trend values reflect non-invasive optical screening estimates. Regular medical reviews and venous blood tests should be performed for clinical diagnosis.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Sparkles,
  TrendingUp,
  Eye,
  ArrowRight,
  ShieldCheck,
  Info,
  RefreshCw,
} from 'lucide-react';
import { DashboardSummary } from '../../types/health';
import { dashboardService } from '../../services/api/dashboardService';
import { useAuth } from '../../context/AuthContext';
import { AppLayout } from '../../components/navigation/AppLayout';
import { SummaryCards } from '../../components/dashboard/SummaryCards';
import { RecentScreenings } from '../../components/dashboard/RecentScreenings';
import { HbTrendChart } from '../../components/charts/HbTrendChart';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getDashboardSummary();
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard summary');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const userName = user?.fullName || 'User';
  const firstName = userName.split(' ')[0];

  return (
    <AppLayout subtitle="Health Screening Summary">
      <div className="space-y-6 text-left">
        {/* Welcome & Quick Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-teal-700 to-teal-900 text-white rounded-3xl p-5 sm:p-6 shadow-md shadow-teal-900/10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-600/60 border border-teal-400/40 text-[11px] font-semibold text-teal-100">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Optical Screening Dashboard</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              Welcome back, {firstName}
            </h1>
            <p className="text-xs text-teal-100/90 max-w-sm leading-relaxed">
              Track your estimated haemoglobin trends and review previous non-invasive screenings.
            </p>
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/welcome')}
            leftIcon={<Eye className="w-4 h-4 text-teal-700" />}
            className="self-start sm:self-center bg-white text-teal-900 hover:bg-teal-50 border-0 shadow-sm font-bold"
          >
            Start Scan
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center p-12 space-y-3 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-6 h-6 text-teal-600 animate-spin" />
            <p className="text-xs font-semibold text-slate-600">Loading screening metrics...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={loadData}>
              Retry
            </Button>
          </div>
        )}

        {/* Main Dashboard Content */}
        {!isLoading && summary && (
          <>
            {/* 1. Summary Cards */}
            <SummaryCards
              totalScreenings={summary.total_screenings}
              latestEstimatedHb={summary.latest_hb}
              latestConfidence={summary.latest_confidence}
              lastScreeningDate={summary.last_screening}
            />

            {/* 2. Hb Trend Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-teal-600" />
                    Hb Trend
                  </h3>
                  <p className="text-xs text-slate-500">Estimated haemoglobin progression over time</p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/trends')}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="text-teal-700 text-xs font-bold"
                >
                  Full Trends
                </Button>
              </div>

              <HbTrendChart
                data={summary.trend}
                height={250}
                onPointSelect={(p) => {
                  if (p.screening_id) {
                    navigate(`/history/${p.screening_id}`);
                  }
                }}
              />
            </div>

            {/* 3. Non-Invasive Medical Notice */}
            <div className="p-3.5 rounded-2xl bg-teal-50/80 border border-teal-200/80 text-teal-900 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-teal-950">
                  Screening estimate — not a laboratory diagnosis.
                </p>
                <p className="text-[11px] text-teal-800 mt-0.5 leading-relaxed">
                  Haemoglobin estimates are optical non-invasive indicators calculated from conjunctival palpebral imagery. Please consult a qualified clinician for clinical blood evaluations.
                </p>
              </div>
            </div>

            {/* 4. Recent Screenings */}
            <RecentScreenings screenings={summary.recent_screenings} />
          </>
        )}
      </div>
    </AppLayout>
  );
};

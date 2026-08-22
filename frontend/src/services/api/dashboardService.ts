import { apiRequest, USE_MOCK } from './apiClient';
import { DashboardSummary, TrendPoint, ScreeningRecord } from '../../types/health';
import { mockDashboardService } from '../mocks/mockDashboardService';

export const dashboardService = {
  /**
   * Fetch aggregated screening dashboard summary
   * GET /api/dashboard & GET /api/dashboard/trend
   */
  async getDashboardSummary(): Promise<DashboardSummary> {
    if (USE_MOCK) {
      return mockDashboardService.getDashboardSummary();
    }

    const res = await apiRequest<any>('/api/dashboard', {
      method: 'GET',
    });

    if (res.error || !res.data) {
      throw new Error(res.error || 'Failed to fetch dashboard summary');
    }

    const data = res.data;

    // Fetch trend data
    let trendPoints: TrendPoint[] = [];
    try {
      const trendRes = await apiRequest<any[]>('/api/dashboard/trend');
      if (trendRes.data && Array.isArray(trendRes.data)) {
        trendPoints = trendRes.data.map((t: any) => ({
          screening_id: t.screening_id,
          date: t.date,
          displayDate: t.display_date || t.date,
          estimated_hb: t.estimated_hb ?? 0,
          confidence: t.confidence,
          status: t.status,
        }));
      }
    } catch {
      trendPoints = [];
    }

    const recent: ScreeningRecord[] = Array.isArray(data.recent_screenings)
      ? data.recent_screenings.map((item: any) => {
          const symptomLabels: string[] = Array.isArray(item.symptoms)
            ? item.symptoms.map((s: any) => (typeof s === 'string' ? s : (s.label_en || s.symptom_name || String(s))))
            : [];
          const rawDate = item.date ?? item.checkup_date ?? (item.created_at ? item.created_at.split('T')[0] : 'Recent');
          let rawTime = item.time ?? item.checkup_time;
          if (!rawTime && item.created_at && item.created_at.includes('T')) {
            rawTime = item.created_at.split('T')[1]?.split('.')[0] || item.created_at.split('T')[1];
          }

          return {
            screening_id: item.screening_id ?? item.id ?? 'AL-000',
            date: rawDate,
            time: rawTime || '12:00',
            estimated_hb: item.estimated_hb ?? 0,
            confidence: item.confidence ?? 0.8,
            status: item.status ?? 'normal',
            image_quality: item.image_quality ?? 'good',
            symptoms: symptomLabels,
            created_at: item.created_at,
          };
        })
      : [];

    const latestHb = data.latest_screening?.estimated_hb ?? data.latest_estimated_hb ?? data.average_estimated_hb ?? (recent[0]?.estimated_hb ?? 0);
    const latestConfidence = data.latest_screening?.confidence ?? data.latest_confidence ?? (recent[0]?.confidence ?? 0);
    const lastDate = data.latest_screening?.date
      ? new Date(data.latest_screening.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : (data.latest_screening_date ? new Date(data.latest_screening_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : (recent[0]?.date || 'No scans yet'));

    return {
      total_screenings: data.total_screenings ?? 0,
      latest_hb: latestHb,
      latest_confidence: latestConfidence,
      last_screening: lastDate,
      trend: trendPoints,
      recent_screenings: recent,
    };
  },

  /**
   * Fetch longitudinal Hb trend data
   * GET /api/dashboard/trend
   */
  async getTrend(): Promise<TrendPoint[]> {
    if (USE_MOCK) {
      return mockDashboardService.getTrend();
    }

    const res = await apiRequest<any[]>('/api/dashboard/trend', {
      method: 'GET',
    });

    if (res.error || !res.data) {
      throw new Error(res.error || 'Failed to fetch trend data');
    }

    return res.data.map((t: any) => ({
      screening_id: t.screening_id,
      date: t.date,
      displayDate: t.display_date || t.date,
      estimated_hb: t.estimated_hb ?? 0,
      confidence: t.confidence,
      status: t.status,
    }));
  },
};

import { apiRequest, USE_MOCK } from './apiClient';
import { ScreeningRecord } from '../../types/health';
import { mockHistoryService } from '../mocks/mockHistoryService';

function mapToScreeningRecord(item: any): ScreeningRecord {
  const symptomLabels: string[] = Array.isArray(item.symptoms)
    ? item.symptoms.map((s: any) => (typeof s === 'string' ? s : (s.label_en || s.symptom_name || String(s))))
    : [];

  const rawDate = item.date ?? item.checkup_date ?? (item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
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
}

export const historyService = {
  /**
   * Fetch complete screening history
   * GET /api/history
   */
  async getHistory(): Promise<ScreeningRecord[]> {
    if (USE_MOCK) {
      return mockHistoryService.getHistory();
    }

    const res = await apiRequest<any[]>('/api/history', {
      method: 'GET',
    });

    if (res.error || !res.data) {
      throw new Error(res.error || 'Failed to fetch screening history');
    }

    return res.data.map(mapToScreeningRecord);
  },

  /**
   * Fetch single screening detail by ID
   * GET /api/history/{screening_id} or /api/screenings/{screening_id}
   */
  async getScreeningById(screeningId: string | number): Promise<ScreeningRecord | null> {
    if (USE_MOCK) {
      return mockHistoryService.getScreeningById(screeningId);
    }

    const res = await apiRequest<any>(`/api/history/${screeningId}`, {
      method: 'GET',
    });

    if (res.error || !res.data) {
      // Fallback to /api/screenings/{id}
      const altRes = await apiRequest<any>(`/api/screenings/${screeningId}`, {
        method: 'GET',
      });
      if (altRes.data) {
        return mapToScreeningRecord(altRes.data);
      }
      return null;
    }

    return mapToScreeningRecord(res.data);
  },
};

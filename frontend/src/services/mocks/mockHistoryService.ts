import { ScreeningRecord } from '../../types/health';

/**
 * Mock screening history dataset representing historical screenings over time.
 */
const initialMockScreenings: ScreeningRecord[] = [
  {
    screening_id: 'AL-849204',
    date: '2026-08-21',
    time: '14:30',
    estimated_hb: 10.8,
    confidence: 0.86,
    status: 'possible_anemia',
    image_quality: 'good',
    symptoms: ['Fatigue', 'Dizziness'],
    notes: 'Mild palpebral conjunctiva pallor detected. Recommended dietary review and medical consultation.',
    created_at: '2026-08-21T14:30:00Z',
  },
  {
    screening_id: 'AL-849203',
    date: '2026-07-15',
    time: '10:15',
    estimated_hb: 11.0,
    confidence: 0.88,
    status: 'possible_anemia',
    image_quality: 'good',
    symptoms: ['Fatigue', 'Shortness of breath'],
    notes: 'Moderate pallor noted on lower eyelid inspection.',
    created_at: '2026-07-15T10:15:00Z',
  },
  {
    screening_id: 'AL-849202',
    date: '2026-05-10',
    time: '16:45',
    estimated_hb: 11.5,
    confidence: 0.79,
    status: 'possible_anemia',
    image_quality: 'fair',
    symptoms: ['Cold hands or feet'],
    notes: 'Vascularisation borderline normal.',
    created_at: '2026-05-10T16:45:00Z',
  },
  {
    screening_id: 'AL-849201',
    date: '2026-02-20',
    time: '11:00',
    estimated_hb: 11.2,
    confidence: 0.82,
    status: 'possible_anemia',
    image_quality: 'good',
    symptoms: ['Fatigue'],
    notes: 'Initial non-invasive baseline screening.',
    created_at: '2026-02-20T11:00:00Z',
  },
];

class MockHistoryService {
  private STORAGE_KEY = 'arogya_mock_history_v2';

  private getStoredHistory(): ScreeningRecord[] {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    return [...initialMockScreenings];
  }

  private saveHistory(records: ScreeningRecord[]): void {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));
    } catch {
      // ignore
    }
  }

  async getHistory(): Promise<ScreeningRecord[]> {
    await new Promise((res) => setTimeout(res, 250));
    return this.getStoredHistory();
  }

  async getScreeningById(screeningId: string | number): Promise<ScreeningRecord | null> {
    await new Promise((res) => setTimeout(res, 200));
    const records = this.getStoredHistory();
    const idStr = String(screeningId).trim();
    const found = records.find(
      (r) => String(r.screening_id).trim() === idStr || String(r.screening_id).replace('AL-', '') === idStr
    );
    return found || null;
  }

  async addScreeningRecord(record: Omit<ScreeningRecord, 'created_at'>): Promise<ScreeningRecord> {
    await new Promise((res) => setTimeout(res, 300));
    const records = this.getStoredHistory();
    const newRecord: ScreeningRecord = {
      ...record,
      created_at: new Date().toISOString(),
    };
    const updated = [newRecord, ...records];
    this.saveHistory(updated);
    return newRecord;
  }
}

export const mockHistoryService = new MockHistoryService();

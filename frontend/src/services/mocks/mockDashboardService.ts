import { DashboardSummary, TrendPoint } from '../../types/health';
import { mockHistoryService } from './mockHistoryService';
import { mockProfileService } from './mockProfileService';

class MockDashboardService {
  async getDashboardSummary(): Promise<DashboardSummary> {
    const history = await mockHistoryService.getHistory();
    const profile = await mockProfileService.getProfile();

    // Sort chronologically for trend (oldest to newest)
    const sortedChronological = [...history].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const trend: TrendPoint[] = sortedChronological.map((item) => {
      // Format date for chart display, e.g. "21 Aug"
      const dateObj = new Date(item.date);
      const displayDate = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        : item.date;

      return {
        screening_id: item.screening_id,
        date: item.date,
        displayDate,
        estimated_hb: item.estimated_hb,
        confidence: item.confidence,
        status: item.status,
      };
    });

    // Sort newest to oldest for recent screenings list
    const sortedRecent = [...history].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const latestScreening = sortedRecent[0];

    const summary: DashboardSummary = {
      total_screenings: history.length,
      latest_hb: latestScreening ? latestScreening.estimated_hb : profile.latestEstimatedHb,
      latest_confidence: latestScreening ? latestScreening.confidence : 0.86,
      last_screening: latestScreening ? latestScreening.date : profile.lastScreeningDate,
      trend,
      recent_screenings: sortedRecent.slice(0, 3),
    };

    return summary;
  }

  async getTrend(): Promise<TrendPoint[]> {
    const summary = await this.getDashboardSummary();
    return summary.trend;
  }
}

export const mockDashboardService = new MockDashboardService();

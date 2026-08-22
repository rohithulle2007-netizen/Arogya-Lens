/**
 * Arogya Lens — Dashboard Controller
 * Updates 4 summary metric cards, recent checkups list, and SVG Hb progression chart
 */

class DashboardManager {
  async loadDashboardData() {
    try {
      window.App.showLoading(true);
      const [dashData, trendData] = await Promise.all([
        window.API.getDashboard().catch(() => ({})),
        window.API.getDashboardTrend(8).catch(() => ([]))
      ]);

      // Populate 4 Metric Summary Cards
      const totalCount = dashData.total_screenings || 0;
      const latestHb = dashData.latest_estimated_hb != null ? Number(dashData.latest_estimated_hb).toFixed(1) : "--";
      const latestStatus = dashData.latest_status ? window.Screening.formatStatusLabel(dashData.latest_status) : "--";
      const normalCount = dashData.likely_normal_count || 0;

      document.getElementById("metricTotalScans").textContent = totalCount;
      document.getElementById("metricLatestHb").textContent = latestHb;
      document.getElementById("metricStatusText").textContent = latestStatus;
      document.getElementById("metricNormalScans").textContent = normalCount;

      // Render SVG Progression Chart
      const points = Array.isArray(trendData) ? trendData : (trendData.data_points || []);
      window.Charts.renderHbTrendChart("dashboardTrendChartContainer", points);

      // Render Recent Screenings preview
      this.renderRecentList(dashData.recent_screenings || []);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      window.App.showLoading(false);
    }
  }

  renderRecentList(screenings) {
    const listEl = document.getElementById("dashboardRecentList");
    if (!listEl) return;

    if (screenings.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; padding: 20px; color: var(--text-subtle); font-size: 0.85rem;">
          No recent scans. Tap the Scan button below to conduct an eye checkup.
        </div>
      `;
      return;
    }

    listEl.innerHTML = screenings.map(item => {
      const id = item.screening_id ?? item.id;
      const rawDate = item.checkup_date || item.date || item.created_at;
      const rawTime = item.checkup_time || item.time || item.created_at;
      const displayDate = window.History ? window.History.formatDate(rawDate) : (rawDate || "--");
      const displayTime = window.History ? window.History.formatTime(rawTime, rawDate) : (rawTime || "--");

      return `
      <div class="history-card" onclick="window.History.viewDetail(${id})">
        <div>
          <div class="history-datetime-badge">
            <div class="history-date">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px; margin-right:4px; color:var(--primary-teal);"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              ${displayDate}
            </div>
            <div class="history-time">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px; margin-right:3px; color:var(--primary-teal);"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${displayTime}
            </div>
          </div>
          <span class="badge ${window.Screening.getStatusBadgeClass(item.status || '')}" style="margin-top:6px;">
            ${window.Screening.formatStatusLabel(item.status || '')}
          </span>
        </div>
        <div class="history-metrics">
          <div class="history-hb">${item.estimated_hb != null ? Number(item.estimated_hb).toFixed(1) : '--'}<span style="font-size:0.8rem; font-weight:normal; color:var(--text-muted);"> g/dL</span></div>
          <div style="font-size:0.75rem; color:var(--text-subtle);">Conf: ${Math.round((item.confidence || 0.85) * 100)}%</div>
        </div>
      </div>
    `;
    }).join("");
  }
}

window.Dashboard = new DashboardManager();

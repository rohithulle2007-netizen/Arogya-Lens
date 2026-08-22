/**
 * Arogya Lens — History & Screening Details Controller
 * Filterable screening history records, detail inspection modal, and symptoms breakdown
 */

class HistoryManager {
  constructor() {
    this.screenings = [];
    this.currentFilter = "all";
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Filter Tabs
    document.querySelectorAll(".history-filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".history-filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.currentFilter = btn.getAttribute("data-filter") || "all";
        this.renderHistory();
      });
    });

    // Close Modal
    document.getElementById("closeDetailModalBtn")?.addEventListener("click", () => {
      document.getElementById("screeningDetailModal").style.display = "none";
    });
  }

  async loadHistory() {
    try {
      window.App.showLoading(true);
      const data = await window.API.getHistory();
      this.screenings = Array.isArray(data) ? data : [];
      this.renderHistory();
    } catch (err) {
      window.App.showToast("Failed to load screening history", "error");
    } finally {
      window.App.showLoading(false);
    }
  }

  formatDate(dateVal) {
    if (!dateVal) return "--";
    try {
      if (typeof dateVal === "string" && dateVal.includes("T")) {
        const d = new Date(dateVal);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
        }
      }
      if (typeof dateVal === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        const parts = dateVal.split("-");
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
        }
      }
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      }
    } catch {}
    return String(dateVal);
  }

  formatTime(timeVal, dateVal) {
    if (!timeVal && !dateVal) return "--";
    try {
      if (typeof timeVal === "string" && /^\d{1,2}:\d{2}(:\d{2})?/.test(timeVal)) {
        const parts = timeVal.split(":");
        let hours = parseInt(parts[0], 10);
        const minutes = parts[1];
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12;
        const paddedHours = hours < 10 ? `0${hours}` : hours;
        return `${paddedHours}:${minutes} ${ampm}`;
      }
      if (typeof timeVal === "string" && timeVal.includes("T")) {
        const d = new Date(timeVal);
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
        }
      }
      if (dateVal && typeof dateVal === "string" && dateVal.includes("T")) {
        const d = new Date(dateVal);
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
        }
      }
    } catch {}
    return timeVal ? String(timeVal) : "--";
  }

  renderHistory() {
    const listEl = document.getElementById("fullHistoryList");
    if (!listEl) return;

    let filtered = this.screenings;
    if (this.currentFilter === "normal") {
      filtered = this.screenings.filter(s => (s.status || "").includes("normal"));
    } else if (this.currentFilter === "anemia") {
      filtered = this.screenings.filter(s => (s.status || "").includes("anemia") || (s.status || "").includes("high"));
    }

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; padding: 40px 20px; color: var(--text-subtle); font-size: 0.9rem;">
          No screening records match the selected filter.
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(item => {
      const id = item.screening_id ?? item.id;
      const rawDate = item.checkup_date || item.date || item.created_at;
      const rawTime = item.checkup_time || item.time || item.created_at;
      const displayDate = this.formatDate(rawDate);
      const displayTime = this.formatTime(rawTime, rawDate);

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
          <div style="font-size:0.75rem; color:var(--text-subtle);">Confidence: ${Math.round((item.confidence || 0.85) * 100)}%</div>
        </div>
      </div>
    `;
    }).join("");
  }

  async viewDetail(screeningId) {
    try {
      window.App.showLoading(true);
      const detail = await window.API.getScreening(screeningId);
      
      document.getElementById("modalHb").textContent = detail.estimated_hb != null ? Number(detail.estimated_hb).toFixed(1) : "--";
      document.getElementById("modalConfidence").textContent = `${Math.round((detail.confidence || 0.85) * 100)}%`;
      
      const rawDate = detail.checkup_date || detail.date || detail.created_at;
      const rawTime = detail.checkup_time || detail.time || detail.created_at;
      const displayDate = this.formatDate(rawDate);
      const displayTime = this.formatTime(rawTime, rawDate);

      const modalDateEl = document.getElementById("modalDate");
      if (modalDateEl) {
        modalDateEl.innerHTML = `
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-weight:600; color:var(--text-main);">
            <span style="display:inline-flex; align-items:center; gap:4px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--primary-teal);"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              ${displayDate}
            </span>
            <span style="color:var(--border-light);">•</span>
            <span style="display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:6px; background:var(--primary-teal-surface); color:var(--primary-teal-dark); font-size:0.85rem; border:1px solid rgba(13,148,136,0.15);">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${displayTime}
            </span>
          </div>
        `;
      }
      
      const badge = document.getElementById("modalStatusBadge");
      if (badge) {
        badge.textContent = window.Screening.formatStatusLabel(detail.status || '');
        badge.className = "badge " + window.Screening.getStatusBadgeClass(detail.status || '');
      }

      // Render Symptoms
      const symList = document.getElementById("modalSymptomsList");
      if (symList) {
        if (detail.symptoms && detail.symptoms.length > 0) {
          symList.innerHTML = detail.symptoms.map(s => `
            <span class="badge badge-neutral" style="margin:2px;">
              ${window.I18N.currentLang === 'hi' ? (s.label_hi || s.symptom_name) : (s.label_en || s.symptom_name)}
            </span>
          `).join("");
        } else {
          symList.innerHTML = `<span style="font-size:0.8rem; color:var(--text-subtle);">None reported</span>`;
        }
      }

      document.getElementById("screeningDetailModal").style.display = "flex";
    } catch (err) {
      window.App.showToast("Could not load details: " + err.message, "error");
    } finally {
      window.App.showLoading(false);
    }
  }
}

window.History = new HistoryManager();

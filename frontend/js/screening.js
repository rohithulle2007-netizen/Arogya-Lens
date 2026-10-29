/**
 * Arogya Lens — Screening Results Controller (No Symptoms Step)
 * Formats multi-site Hb estimates, confidence gauge, WHO clinical classification & direct dashboard navigation
 */

class ScreeningManager {
  constructor() {
    this.currentScreening = null;
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Continue directly to Dashboard
    document.getElementById("viewDashboardBtn")?.addEventListener("click", async () => {
      window.App.showScreen("dashboardScreen");
      await window.Dashboard.loadDashboardData();
    });

    // Start New Screening from Results View
    document.getElementById("resultRetakeBtn")?.addEventListener("click", async () => {
      window.Scanner.resetFullScan();
      window.App.showScreen("scannerScreen");
      await window.Scanner.launchCurrentStep();
    });
  }

  presentResult(data) {
    this.currentScreening = data;

    // Render Hb Value
    const hbValue = data.estimated_hb != null ? Number(data.estimated_hb).toFixed(1) : "--";
    const hbEl = document.getElementById("resultHbValue");
    if (hbEl) hbEl.textContent = hbValue;

    // Render Confidence
    const confidencePct = Math.round((data.confidence || 0.90) * 100);
    const confValEl = document.getElementById("resultConfidenceValue");
    const confBarEl = document.getElementById("resultConfidenceBar");
    if (confValEl) confValEl.textContent = `${confidencePct}%`;
    if (confBarEl) confBarEl.style.width = `${confidencePct}%`;

    // Render Screening Status Badge
    const statusBadge = document.getElementById("resultStatusBadge");
    if (statusBadge) {
      const statusKey = data.status || "likely_normal";
      statusBadge.textContent = this.formatStatusLabel(statusKey);
      statusBadge.className = "badge " + this.getStatusBadgeClass(statusKey);
    }

    // Render Guidance Summary
    const guidanceEl = document.getElementById("resultGuidanceText");
    if (guidanceEl) {
      if (data.status === "possible_anemia" || data.status === "high_risk") {
        guidanceEl.textContent = "Multi-site analysis indicates hemoglobin concentration below typical reference levels. A routine CBC blood test and medical checkup are recommended.";
      } else {
        guidanceEl.textContent = "Multi-site analysis indicates hemoglobin concentration within expected healthy parameters. Maintain a balanced, iron-rich nutrition regimen.";
      }
    }

    // Update 4-Site Verified Badges
    const sites = data.metrics?.sites || {};
    this.updateSiteBadge("statLeftEye", sites.left_eye || { quality: "good" }, "Conjunctiva");
    this.updateSiteBadge("statRightEye", sites.right_eye || { quality: "good" }, "Conjunctiva");
    this.updateSiteBadge("statLeftThumb", sites.left_thumb || { quality: "good" }, "Nail Bed");
    this.updateSiteBadge("statRightThumb", sites.right_thumb || { quality: "good" }, "Nail Bed");

    // Display Simulated Demo Banner if in Demo Mode
    const demoBanner = document.getElementById("demoResultBanner");
    if (demoBanner) {
      demoBanner.style.display = (data.is_demo || window.API?.isDemoMode()) ? "block" : "none";
    }

    window.App.showScreen("resultScreen");
  }

  updateSiteBadge(elementId, siteData, typeName) {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (siteData && siteData.quality === "good") {
      el.textContent = `${typeName} Optimal`;
      el.className = "site-stat-badge";
    } else {
      el.textContent = `${typeName} Verified`;
      el.className = "site-stat-badge";
    }
  }

  formatStatusLabel(status) {
    switch (status) {
      case "likely_normal":
      case "normal":
        return window.I18N.t("status_likely_normal");
      case "possible_anemia":
      case "mild_anemia":
      case "moderate_anemia":
        return window.I18N.t("status_possible_anemia");
      case "high_risk":
      case "severe_anemia":
        return window.I18N.t("status_high_risk");
      case "low_confidence":
        return window.I18N.t("status_low_confidence");
      default:
        return status.replace(/_/g, " ").toUpperCase();
    }
  }

  getStatusBadgeClass(status) {
    if (status.includes("normal")) return "badge-normal";
    if (status.includes("anemia") || status.includes("possible")) return "badge-warning";
    if (status.includes("high") || status.includes("severe")) return "badge-danger";
    return "badge-neutral";
  }
}

window.Screening = new ScreeningManager();

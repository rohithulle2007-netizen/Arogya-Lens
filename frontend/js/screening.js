/**
 * Arogya Lens — Screening Results & Symptoms Controller
 * Formats Hb estimates, confidence progress bar, WHO clinical classification, and optional symptom inputs
 */

class ScreeningManager {
  constructor() {
    this.currentScreening = null;
    this.selectedSymptoms = new Set();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Symptom Chip Selection Toggle
    document.querySelectorAll(".symptom-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const val = chip.getAttribute("data-symptom");
        if (val === "none") {
          this.selectedSymptoms.clear();
          document.querySelectorAll(".symptom-chip").forEach(c => c.classList.remove("selected"));
          chip.classList.add("selected");
          this.selectedSymptoms.add("none");
        } else {
          document.querySelector('.symptom-chip[data-symptom="none"]')?.classList.remove("selected");
          this.selectedSymptoms.delete("none");

          if (this.selectedSymptoms.has(val)) {
            this.selectedSymptoms.delete(val);
            chip.classList.remove("selected");
          } else {
            this.selectedSymptoms.add(val);
            chip.classList.add("selected");
          }
        }
      });
    });

    // Save Symptoms & View Dashboard
    document.getElementById("saveSymptomsBtn")?.addEventListener("click", async () => {
      if (!this.currentScreening) {
        window.App.showScreen("dashboardScreen");
        return;
      }

      const symptomsList = Array.from(this.selectedSymptoms);
      if (symptomsList.length > 0) {
        try {
          window.App.showLoading(true);
          await window.API.submitSymptoms(this.currentScreening.id, symptomsList);
          window.App.showToast("Screening and symptoms saved successfully!", "success");
        } catch (err) {
          console.warn("Error saving symptoms:", err);
        } finally {
          window.App.showLoading(false);
        }
      }

      window.App.showScreen("dashboardScreen");
      await window.Dashboard.loadDashboardData();
    });

    // Retake from Results View
    document.getElementById("resultRetakeBtn")?.addEventListener("click", async () => {
      window.App.showScreen("scannerScreen");
      await window.Scanner.launchScanner();
    });
  }

  presentResult(data) {
    this.currentScreening = data;
    this.selectedSymptoms.clear();
    document.querySelectorAll(".symptom-chip").forEach(c => c.classList.remove("selected"));

    // Render Hb Value
    const hbValue = data.estimated_hb != null ? Number(data.estimated_hb).toFixed(1) : "--";
    const hbEl = document.getElementById("resultHbValue");
    if (hbEl) hbEl.textContent = hbValue;

    // Render Confidence
    const confidencePct = Math.round((data.confidence || 0.85) * 100);
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
        guidanceEl.textContent = "Estimated Hb is below typical normal ranges. A routine follow-up with a doctor or CBC blood test is recommended.";
      } else {
        guidanceEl.textContent = "Estimated Hb is within expected normal limits. Maintain a balanced, iron-rich diet.";
      }
    }

    window.App.showScreen("resultScreen");
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

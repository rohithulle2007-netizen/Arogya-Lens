/**
 * Arogya Lens — Main Application Router & Coordinator
 */

class Application {
  constructor() {
    this.userProfile = null;
    this.currentScreenId = "onboardingScreen";
  }

  async init() {
    // Initialize components
    window.I18N.updateDOM();
    window.Auth.init();
    window.Scanner.init();
    window.Screening.init();
    window.History.init();
    window.Profile.init();

    this.bindGlobalEvents();

    // Check existing authentication session
    const token = window.API.getToken();
    if (token) {
      try {
        await this.loadUserSession();
        this.showScreen("homeScreen");
      } catch (e) {
        this.showScreen("onboardingScreen");
      }
    } else {
      this.showScreen("onboardingScreen");
    }
  }

  bindGlobalEvents() {
    // Language Toggle
    document.getElementById("langToggleBtn")?.addEventListener("click", () => {
      window.I18N.toggleLanguage();
    });

    // Onboarding Agree
    document.getElementById("onboardingAgreeBtn")?.addEventListener("click", () => {
      this.showScreen("loginScreen");
    });

    // Bottom Navigation Bar Routing
    document.querySelectorAll(".nav-item[data-target]").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const target = btn.getAttribute("data-target");
        this.showScreen(target);

        if (target === "dashboardScreen") {
          await window.Dashboard.loadDashboardData();
        } else if (target === "historyScreen") {
          await window.History.loadHistory();
        } else if (target === "profileScreen") {
          await window.Profile.loadProfile();
        }
      });
    });
  }

  async loadUserSession() {
    this.userProfile = await window.API.getProfile();
    const greetName = document.getElementById("userGreetingName");
    if (greetName) {
      greetName.textContent = this.userProfile?.name || "Patient";
    }
  }

  showScreen(screenId) {
    // Stop camera when moving away from scanner view
    if (this.currentScreenId === "scannerScreen" && screenId !== "scannerScreen") {
      window.Camera.stopCamera();
    }

    document.querySelectorAll(".screen-view").forEach(s => s.classList.remove("active"));
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add("active");
      this.currentScreenId = screenId;
    }

    // Toggle bottom navigation visibility
    const authScreens = ["onboardingScreen", "loginScreen", "registerScreen", "otpScreen", "scannerScreen", "analyzingScreen"];
    const bottomNav = document.getElementById("bottomNav");
    if (bottomNav) {
      bottomNav.style.display = authScreens.includes(screenId) ? "none" : "flex";
    }

    // Update active nav icon
    document.querySelectorAll(".nav-item").forEach(item => {
      if (item.getAttribute("data-target") === screenId) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type === "error" ? "toast-error" : type === "success" ? "toast-success" : ""}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-10px)";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  showLoading(isLoading) {
    const spinner = document.getElementById("globalLoadingOverlay");
    if (spinner) {
      spinner.style.display = isLoading ? "flex" : "none";
    }
  }
}

window.App = new Application();
document.addEventListener("DOMContentLoaded", () => {
  window.App.init();
});

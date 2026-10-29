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

    // Server API Configuration
    document.getElementById("serverConfigBtn")?.addEventListener("click", () => {
      const currentUrl = window.API.baseUrl || "";
      const promptVal = prompt(
        "Arogya Lens Backend Server URL:\n\nEnter your deployed FastAPI server URL (e.g. https://your-backend.railway.app, https://arogya-lens.onrender.com, or http://127.0.0.1:8000).\nLeave blank to use Interactive Demo Mode:",
        currentUrl
      );
      if (promptVal !== null) {
        const cleanUrl = promptVal.trim().replace(/\/+$/, "");
        window.API.setBaseUrl(cleanUrl);
        if (cleanUrl) {
          window.API.disableDemoMode();
          this.showToast(`Backend API set to: ${cleanUrl}`, "success");
        } else {
          this.showToast("Using Interactive Demo Mode (Client-side)", "info");
        }
      }
    });

    // Onboarding Navigation
    document.getElementById("getStartedBtn")?.addEventListener("click", () => {
      this.showScreen("registerScreen");
    });

    document.getElementById("onboardingLoginBtn")?.addEventListener("click", () => {
      this.showScreen("loginScreen");
    });

    document.getElementById("onboardingAgreeBtn")?.addEventListener("click", () => {
      this.showScreen("loginScreen");
    });

    document.getElementById("quickDemoBtn")?.addEventListener("click", async () => {
      if (window.Auth && typeof window.Auth.demoLogin === "function") {
        await window.Auth.demoLogin();
      }
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

    // Manage bottom navigation active states & visibility
    const bottomNav = document.getElementById("bottomNav");
    const authedScreens = ["homeScreen", "dashboardScreen", "historyScreen", "profileScreen"];

    if (bottomNav) {
      if (authedScreens.includes(screenId)) {
        bottomNav.style.display = "flex";
        document.querySelectorAll(".nav-item").forEach(item => {
          if (item.getAttribute("data-target") === screenId) {
            item.classList.add("active");
          } else {
            item.classList.remove("active");
          }
        });
      } else {
        bottomNav.style.display = "none";
      }
    }
  }

  showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  showLoading(visible = true) {
    const overlay = document.getElementById("globalLoadingOverlay");
    if (overlay) {
      overlay.style.display = visible ? "flex" : "none";
    }
  }
}

window.App = new Application();

document.addEventListener("DOMContentLoaded", () => {
  window.App.init();
});

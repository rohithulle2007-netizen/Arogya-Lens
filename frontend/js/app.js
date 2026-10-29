/**
 * Arogya Lens — Main Application Router & Coordinator
 * SPA history navigation, route state preservation, and component coordinator
 */

class Application {
  constructor() {
    this.userProfile = null;
    this.currentScreenId = "onboardingScreen";
  }

  async init() {
    if (this._initialized) return;
    this._initialized = true;

    // Initialize component controllers
    window.I18N.updateDOM();
    window.Auth.init();
    window.Scanner.init();
    window.Screening.init();
    window.History.init();
    window.Profile.init();

    this.bindGlobalEvents();
    this.bindHistoryRouting();

    // Check existing authentication session and route
    const token = window.API.getToken();
    const routeScreen = this.getScreenFromRoute();

    if (token) {
      try {
        await this.loadUserSession();
        const authedScreens = ["homeScreen", "dashboardScreen", "historyScreen", "profileScreen", "scannerScreen"];
        const target = routeScreen && authedScreens.includes(routeScreen) ? routeScreen : "homeScreen";
        this.showScreen(target, false);
        window.history.replaceState({ screenId: target }, "", target === "onboardingScreen" ? window.location.pathname : `#${target}`);
      } catch (e) {
        window.API.clearToken();
        const guestScreens = ["registerScreen", "loginScreen"];
        const target = routeScreen && guestScreens.includes(routeScreen) ? routeScreen : "onboardingScreen";
        this.showScreen(target, false);
        window.history.replaceState({ screenId: target }, "", target === "onboardingScreen" ? window.location.pathname : `#${target}`);
      }
    } else {
      const guestScreens = ["registerScreen", "loginScreen", "otpScreen"];
      const target = routeScreen && guestScreens.includes(routeScreen) ? routeScreen : "onboardingScreen";
      this.showScreen(target, false);
      window.history.replaceState({ screenId: target }, "", target === "onboardingScreen" ? window.location.pathname : `#${target}`);
    }

    // Expose developer console helper (not in public UI)
    window.__arogyaSetApiUrl = (url) => {
      window.API.setBaseUrl(url);
      console.log(`[Arogya Lens Dev] Backend API set to: ${url}`);
    };
  }

  bindGlobalEvents() {
    // Language Toggle
    document.getElementById("langToggleBtn")?.addEventListener("click", () => {
      window.I18N.toggleLanguage();
    });

    // Top Header Brand Logo -> Return Home
    document.getElementById("headerBrandLogo")?.addEventListener("click", () => {
      const token = window.API.getToken();
      this.showScreen(token ? "homeScreen" : "onboardingScreen");
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

    // Bottom Navigation Bar Routing
    document.querySelectorAll(".nav-item[data-target]").forEach((btn) => {
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

  bindHistoryRouting() {
    window.addEventListener("popstate", (e) => {
      const screenId =
        e.state?.screenId ||
        this.getScreenFromRoute() ||
        (window.API.getToken() ? "homeScreen" : "onboardingScreen");
      this.showScreen(screenId, false);
    });
  }

  getScreenFromRoute() {
    const hash = (window.location.hash || "").replace(/^#/, "").trim();
    if (hash) {
      if (document.getElementById(hash)) {
        return hash;
      }
      const aliases = {
        login: "loginScreen",
        register: "registerScreen",
        signup: "registerScreen",
        otp: "otpScreen",
        home: "homeScreen",
        dashboard: "dashboardScreen",
        scanner: "scannerScreen",
        history: "historyScreen",
        profile: "profileScreen",
        onboarding: "onboardingScreen",
      };
      if (aliases[hash]) {
        return aliases[hash];
      }
    }

    const segments = window.location.pathname.split("/").filter(Boolean);
    const lastSegment = segments.pop() || "";
    const pathAliases = {
      login: "loginScreen",
      register: "registerScreen",
      signup: "registerScreen",
      otp: "otpScreen",
      home: "homeScreen",
      dashboard: "dashboardScreen",
      scanner: "scannerScreen",
      history: "historyScreen",
      profile: "profileScreen",
    };
    if (pathAliases[lastSegment]) {
      return pathAliases[lastSegment];
    }

    return null;
  }

  async loadUserSession() {
    this.userProfile = await window.API.getProfile();
    const greetName = document.getElementById("userGreetingName");
    if (greetName) {
      greetName.textContent = this.userProfile?.name || "Patient";
    }
  }

  showScreen(screenId, pushHistory = true) {
    // Stop camera when moving away from scanner view
    if (this.currentScreenId === "scannerScreen" && screenId !== "scannerScreen") {
      window.Camera?.stopCamera();
    }

    let target = document.getElementById(screenId);
    if (!target) {
      screenId = "onboardingScreen";
      target = document.getElementById(screenId);
    }

    document.querySelectorAll(".screen-view").forEach((s) => s.classList.remove("active"));
    if (target) {
      target.classList.add("active");
      this.currentScreenId = screenId;
    }

    // Push history state to enable smooth Back / Forward navigation without exiting app
    if (pushHistory && window.history) {
      const hash = screenId === "onboardingScreen" ? "" : `#${screenId}`;
      const url = hash ? `${window.location.pathname}${hash}` : window.location.pathname;
      if (window.location.hash !== hash) {
        window.history.pushState({ screenId }, "", url);
      }
    }

    // Manage bottom navigation active states & visibility
    const bottomNav = document.getElementById("bottomNav");
    const authedScreens = ["homeScreen", "dashboardScreen", "historyScreen", "profileScreen"];

    if (bottomNav) {
      if (authedScreens.includes(screenId)) {
        bottomNav.style.display = "flex";
        document.querySelectorAll(".nav-item").forEach((item) => {
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

    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const contentEl = document.querySelector(".app-content");
    if (contentEl) contentEl.scrollTop = 0;
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
      overlay.style.pointerEvents = visible ? "auto" : "none";
    }
  }
}

window.App = new Application();

// Reliable DOM-ready initialization across all browser environments
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.App.init();
  });
} else {
  window.App.init();
}

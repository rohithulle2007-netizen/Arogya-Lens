/**
 * Arogya Lens — Centralized API Client with JWT Bearer Authentication & Offline Demo Fallback
 */

const SEED_DEMO_HISTORY = [
  {
    screening_id: 103,
    id: 103,
    estimated_hb: 12.4,
    confidence: 0.94,
    status: "likely_normal",
    image_quality: "good",
    checkup_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    checkup_time: "10:30 AM",
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    metrics: {
      sites: {
        left_eye: { quality: "good" },
        right_eye: { quality: "good" },
        left_thumb: { quality: "good" },
        right_thumb: { quality: "good" }
      }
    }
  },
  {
    screening_id: 102,
    id: 102,
    estimated_hb: 12.0,
    confidence: 0.91,
    status: "likely_normal",
    image_quality: "good",
    checkup_date: new Date(Date.now() - 16 * 86400000).toISOString().split('T')[0],
    checkup_time: "02:15 PM",
    created_at: new Date(Date.now() - 16 * 86400000).toISOString(),
    metrics: {
      sites: {
        left_eye: { quality: "good" },
        right_eye: { quality: "good" },
        left_thumb: { quality: "good" },
        right_thumb: { quality: "good" }
      }
    }
  },
  {
    screening_id: 101,
    id: 101,
    estimated_hb: 11.5,
    confidence: 0.88,
    status: "possible_anemia",
    image_quality: "good",
    checkup_date: new Date(Date.now() - 32 * 86400000).toISOString().split('T')[0],
    checkup_time: "11:45 AM",
    created_at: new Date(Date.now() - 32 * 86400000).toISOString(),
    metrics: {
      sites: {
        left_eye: { quality: "good" },
        right_eye: { quality: "good" },
        left_thumb: { quality: "good" },
        right_thumb: { quality: "good" }
      }
    }
  }
];

class ApiClient {
  constructor() {
    this.baseUrl = window.CONFIG?.API_BASE_URL || "";
    this.demoStorageKey = "arogya_demo_screenings";
    this.demoUserKey = "arogya_demo_profile";
  }

  setBaseUrl(url) {
    this.baseUrl = (url || "").replace(/\/+$/, "");
    if (window.CONFIG) {
      window.CONFIG.API_BASE_URL = this.baseUrl;
    }
    if (this.baseUrl) {
      localStorage.setItem("arogya_api_base_url", this.baseUrl);
    } else {
      localStorage.removeItem("arogya_api_base_url");
    }
  }

  isDemoMode() {
    return localStorage.getItem("arogya_demo_mode") === "true";
  }

  enableDemoMode() {
    localStorage.setItem("arogya_demo_mode", "true");
    this.setToken("demo_jwt_token_priya_sharma");
    if (!localStorage.getItem(this.demoUserKey)) {
      localStorage.setItem(this.demoUserKey, JSON.stringify({
        name: "Priya Sharma",
        mobile_number: "9876543210",
        age: 28,
        sex: "female"
      }));
    }
    if (!localStorage.getItem(this.demoStorageKey)) {
      localStorage.setItem(this.demoStorageKey, JSON.stringify(SEED_DEMO_HISTORY));
    }
  }

  disableDemoMode() {
    localStorage.removeItem("arogya_demo_mode");
  }

  getToken() {
    return localStorage.getItem(window.CONFIG?.STORAGE_TOKEN_KEY || "arogya_lens_jwt_token");
  }

  setToken(token) {
    localStorage.setItem(window.CONFIG?.STORAGE_TOKEN_KEY || "arogya_lens_jwt_token", token);
  }

  clearToken() {
    localStorage.removeItem(window.CONFIG?.STORAGE_TOKEN_KEY || "arogya_lens_jwt_token");
    localStorage.removeItem(window.CONFIG?.STORAGE_USER_KEY || "arogya_lens_user");
    localStorage.removeItem("arogya_demo_mode");
  }

  async request(endpoint, options = {}) {
    if (!this.baseUrl && !this.isDemoMode()) {
      throw new Error("No backend API configured. Please connect to a server or launch Demo Mode.");
    }

    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const token = this.getToken();

    const headers = options.headers || {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (response.status === 401) {
        this.clearToken();
        if (window.App && typeof window.App.showScreen === 'function') {
          window.App.showToast("Session expired. Please log in again.", "error");
          window.App.showScreen("loginScreen");
        }
        throw new Error("Unauthorized");
      }

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        let errorMsg = data.detail || data.message;
        if (!errorMsg) {
          if (response.status === 404) {
            errorMsg = "Account not found. Please register first.";
          } else {
            errorMsg = `Server error (${response.status}): ${response.statusText || "Request failed"}`;
          }
        }
        throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      if (err.message === "Failed to fetch" || (err.name === "TypeError" && !err.message)) {
        throw new Error("Unable to connect to backend server. Please verify your backend URL or click 'Instant Demo Mode'.");
      }
      throw err;
    }
  }

  // --- Auth APIs ---
  async register(payload) {
    if (this.isDemoMode()) {
      localStorage.setItem(this.demoUserKey, JSON.stringify(payload));
      return { message: "Demo registration successful", access_token: "demo_jwt_token_priya_sharma", token_type: "bearer" };
    }
    return this.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async sendOtp(mobileNumber) {
    if (this.isDemoMode()) {
      return { message: "Demo OTP sent (Code: 123456)", demo_otp: "123456" };
    }
    return this.request("/api/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ mobile_number: mobileNumber })
    });
  }

  async verifyOtp(mobileNumber, otp) {
    if (this.isDemoMode()) {
      return { access_token: "demo_jwt_token_priya_sharma", token_type: "bearer" };
    }
    return this.request("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ mobile_number: mobileNumber, otp })
    });
  }

  async getMe() {
    return this.getProfile();
  }

  // --- Profile APIs ---
  async getProfile() {
    if (this.isDemoMode()) {
      const stored = localStorage.getItem(this.demoUserKey);
      if (stored) {
        try { return JSON.parse(stored); } catch (e) {}
      }
      return { name: "Priya Sharma", mobile_number: "9876543210", age: 28, sex: "female" };
    }
    return this.request("/api/users/me");
  }

  async updateProfile(payload) {
    if (this.isDemoMode()) {
      const current = await this.getProfile();
      const updated = { ...current, ...payload };
      localStorage.setItem(this.demoUserKey, JSON.stringify(updated));
      return updated;
    }
    return this.request("/api/users/me", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  }

  async getUserSummary() {
    if (this.isDemoMode()) {
      const history = await this.getHistory();
      const latest = history[0] || {};
      return {
        total_screenings: history.length,
        latest_hb: latest.estimated_hb || 12.4,
        status: latest.status || "likely_normal"
      };
    }
    return this.request("/api/users/me/summary");
  }

  // --- Screening APIs ---
  async analyzeMultiSite(scans = {}) {
    if (this.isDemoMode()) {
      // Simulate realistic AI analysis locally
      const simulatedHb = Number((12.1 + (Math.random() * 0.8 - 0.4)).toFixed(1));
      const simulatedConf = Number((0.91 + Math.random() * 0.06).toFixed(2));
      const isNormal = simulatedHb >= 12.0;
      const status = isNormal ? "likely_normal" : "possible_anemia";
      
      const newScreening = {
        screening_id: Date.now(),
        id: Date.now(),
        estimated_hb: simulatedHb,
        confidence: simulatedConf,
        status: status,
        image_quality: "good",
        checkup_date: new Date().toISOString().split('T')[0],
        checkup_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        created_at: new Date().toISOString(),
        metrics: {
          sites: {
            left_eye: { quality: "good" },
            right_eye: { quality: "good" },
            left_thumb: { quality: "good" },
            right_thumb: { quality: "good" }
          }
        }
      };

      const history = await this.getHistory();
      history.unshift(newScreening);
      localStorage.setItem(this.demoStorageKey, JSON.stringify(history));
      return newScreening;
    }

    const formData = new FormData();
    if (scans.left_eye) formData.append("left_eye", scans.left_eye, "left_eye.jpg");
    if (scans.right_eye) formData.append("right_eye", scans.right_eye, "right_eye.jpg");
    if (scans.left_thumb) formData.append("left_thumb", scans.left_thumb, "left_thumb.jpg");
    if (scans.right_thumb) formData.append("right_thumb", scans.right_thumb, "right_thumb.jpg");
    if (scans.image) formData.append("image", scans.image, "scan.jpg");

    return this.request("/api/screenings/analyze", {
      method: "POST",
      body: formData
    });
  }

  async analyzeImage(imageBlob) {
    return this.analyzeMultiSite({ left_eye: imageBlob });
  }

  async getScreening(screeningId) {
    if (this.isDemoMode()) {
      const history = await this.getHistory();
      const match = history.find(s => String(s.screening_id || s.id) === String(screeningId));
      if (match) return match;
      return history[0] || null;
    }
    return this.request(`/api/screenings/${screeningId}`);
  }

  async submitSymptoms(screeningId, symptomsList) {
    if (this.isDemoMode()) {
      return { success: true, message: "Symptoms recorded in demo session" };
    }
    return this.request(`/api/screenings/${screeningId}/symptoms`, {
      method: "POST",
      body: JSON.stringify({ symptoms: symptomsList })
    });
  }

  // --- History & Dashboard APIs ---
  async getHistory() {
    if (this.isDemoMode()) {
      const stored = localStorage.getItem(this.demoStorageKey);
      if (stored) {
        try {
          const list = JSON.parse(stored);
          if (Array.isArray(list)) return list;
        } catch (e) {}
      }
      return SEED_DEMO_HISTORY;
    }
    return this.request("/api/history");
  }

  async getDashboard() {
    if (this.isDemoMode()) {
      const history = await this.getHistory();
      const total = history.length;
      const normalCount = history.filter(s => (s.status || "").includes("normal")).length;
      const latest = history[0] || {};
      return {
        total_screenings: total,
        latest_estimated_hb: latest.estimated_hb || 12.4,
        latest_status: latest.status || "likely_normal",
        likely_normal_count: normalCount,
        recent_screenings: history.slice(0, 5)
      };
    }
    return this.request("/api/dashboard");
  }

  async getDashboardTrend(limit = 10) {
    if (this.isDemoMode()) {
      const history = await this.getHistory();
      const reversed = [...history].reverse().slice(-limit);
      return reversed.map(s => ({
        screening_id: s.screening_id || s.id,
        estimated_hb: s.estimated_hb,
        confidence: s.confidence,
        status: s.status,
        date: s.checkup_date,
        created_at: s.created_at
      }));
    }
    return this.request(`/api/dashboard/trend?limit=${limit}`);
  }
}

window.API = new ApiClient();

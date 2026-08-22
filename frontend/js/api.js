/**
 * Arogya Lens — Centralized API Client with JWT Bearer Authentication
 */

class ApiClient {
  constructor() {
    this.baseUrl = window.CONFIG?.API_BASE_URL || "http://127.0.0.1:8000";
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
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const token = this.getToken();

    const headers = options.headers || {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Only set Content-Type to application/json if not FormData
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
        throw new Error("Unable to connect to backend server. Please ensure FastAPI is running on http://127.0.0.1:8000.");
      }
      throw err;
    }
  }

  // --- Auth APIs ---
  register(payload) {
    return this.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  sendOtp(mobileNumber) {
    return this.request("/api/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ mobile_number: mobileNumber })
    });
  }

  verifyOtp(mobileNumber, otp) {
    return this.request("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ mobile_number: mobileNumber, otp })
    });
  }

  getMe() {
    return this.request("/api/auth/me");
  }

  // --- Profile APIs ---
  getProfile() {
    return this.request("/api/users/me");
  }

  updateProfile(payload) {
    return this.request("/api/users/me", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  }

  getUserSummary() {
    return this.request("/api/users/me/summary");
  }

  // --- Screening APIs ---
  analyzeImage(imageBlob) {
    const formData = new FormData();
    formData.append("image", imageBlob, "eye_capture.jpg");
    return this.request("/api/screenings/analyze", {
      method: "POST",
      body: formData
    });
  }

  getScreening(screeningId) {
    return this.request(`/api/screenings/${screeningId}`);
  }

  submitSymptoms(screeningId, symptomsList) {
    return this.request(`/api/screenings/${screeningId}/symptoms`, {
      method: "POST",
      body: JSON.stringify({ symptoms: symptomsList })
    });
  }

  // --- History & Dashboard APIs ---
  getHistory() {
    return this.request("/api/history");
  }

  getDashboard() {
    return this.request("/api/dashboard");
  }

  getDashboardTrend(limit = 10) {
    return this.request(`/api/dashboard/trend?limit=${limit}`);
  }
}

window.API = new ApiClient();

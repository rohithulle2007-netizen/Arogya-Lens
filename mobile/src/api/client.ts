import { Storage } from "../utils/storage";
import { AuthResponse, DashboardResponse, MultiScanPayload, ScreeningResult, UserProfile } from "./types";

class ApiClient {
  private async getBaseUrl(): Promise<string> {
    return Storage.getApiUrl();
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await Storage.getToken();
    return {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async sendOtp(mobile_number: string): Promise<{ message: string }> {
    const baseUrl = await this.getBaseUrl();
    const res = await fetch(`${baseUrl}/api/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile_number }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Failed to send OTP" }));
      throw new Error(err.detail || "Failed to send OTP");
    }
    return res.json();
  }

  async verifyOtp(mobile_number: string, otp: string): Promise<AuthResponse> {
    const baseUrl = await this.getBaseUrl();
    const res = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile_number, otp }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Invalid OTP" }));
      throw new Error(err.detail || "Invalid OTP");
    }
    const data: AuthResponse = await res.json();
    await Storage.setToken(data.access_token);
    await Storage.setUser(data.user);
    return data;
  }

  async register(name: string, mobile_number: string, sex: string, age: number): Promise<{ message: string; user_id: number }> {
    const baseUrl = await this.getBaseUrl();
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, mobile_number, sex, age }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Registration failed" }));
      throw new Error(err.detail || "Registration failed");
    }
    return res.json();
  }

  async getMe(): Promise<UserProfile> {
    const baseUrl = await this.getBaseUrl();
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${baseUrl}/api/auth/me`, { headers });
    if (!res.ok) throw new Error("Unauthorized");
    return res.json();
  }

  async updateProfile(name: string, age: number, sex: string): Promise<UserProfile> {
    const baseUrl = await this.getBaseUrl();
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${baseUrl}/api/users/profile`, {
      method: "PUT",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, age, sex }),
    });
    if (!res.ok) throw new Error("Failed to update profile");
    const updated = await res.json();
    await Storage.setUser(updated);
    return updated;
  }

  async getDashboard(): Promise<DashboardResponse> {
    const baseUrl = await this.getBaseUrl();
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${baseUrl}/api/dashboard`, { headers });
    if (!res.ok) throw new Error("Failed to fetch dashboard data");
    return res.json();
  }

  async getHistory(): Promise<ScreeningResult[]> {
    const baseUrl = await this.getBaseUrl();
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${baseUrl}/api/history`, { headers });
    if (!res.ok) throw new Error("Failed to fetch screening history");
    return res.json();
  }

  async analyzeMultiSite(scans: MultiScanPayload): Promise<ScreeningResult> {
    const baseUrl = await this.getBaseUrl();
    const token = await Storage.getToken();

    const formData = new FormData();
    formData.append("left_eye", {
      uri: scans.left_eye.uri,
      type: scans.left_eye.type || "image/jpeg",
      name: scans.left_eye.name || "left_eye.jpg",
    } as any);

    formData.append("right_eye", {
      uri: scans.right_eye.uri,
      type: scans.right_eye.type || "image/jpeg",
      name: scans.right_eye.name || "right_eye.jpg",
    } as any);

    formData.append("left_thumb", {
      uri: scans.left_thumb.uri,
      type: scans.left_thumb.type || "image/jpeg",
      name: scans.left_thumb.name || "left_thumb.jpg",
    } as any);

    formData.append("right_thumb", {
      uri: scans.right_thumb.uri,
      type: scans.right_thumb.type || "image/jpeg",
      name: scans.right_thumb.name || "right_thumb.jpg",
    } as any);

    const res = await fetch(`${baseUrl}/api/screenings/analyze`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Screening upload failed" }));
      throw new Error(err.detail || "Screening upload failed");
    }

    return res.json();
  }
}

export const API = new ApiClient();

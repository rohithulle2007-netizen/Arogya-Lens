export interface UserProfile {
  id: number;
  mobile_number: string;
  name?: string;
  age?: number;
  sex?: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export interface ScreeningResult {
  id: number;
  user_id: number;
  checkup_date: string;
  checkup_time: string;
  estimated_hb: number;
  confidence: number;
  status: "likely_normal" | "mild_anemia" | "moderate_anemia" | "severe_anemia" | "possible_anemia" | string;
  image_quality: string;
  left_eye_image_path?: string;
  right_eye_image_path?: string;
  left_thumb_image_path?: string;
  right_thumb_image_path?: string;
  metrics?: Record<string, any>;
  created_at: string;
}

export interface DashboardResponse {
  total_screenings: number;
  latest_hb?: number;
  latest_status?: string;
  latest_date?: string;
  average_hb?: number;
  hb_trend: Array<{
    date: string;
    estimated_hb: number;
    status: string;
  }>;
  recent_screenings: ScreeningResult[];
}

export type ScanStep = "left_eye" | "right_eye" | "left_thumb" | "right_thumb";

export interface ScanItem {
  uri: string;
  type: string;
  name: string;
}

export interface MultiScanPayload {
  left_eye: ScanItem;
  right_eye: ScanItem;
  left_thumb: ScanItem;
  right_thumb: ScanItem;
}

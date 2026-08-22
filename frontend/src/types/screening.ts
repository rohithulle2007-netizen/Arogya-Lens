export type EyeAlignmentPrompt =
  | 'position_eye'
  | 'move_closer'
  | 'move_left'
  | 'move_right'
  | 'hold_steady'
  | 'eye_detected';

export type QualityGrade = 'good' | 'fair' | 'poor';

export interface EyeDetectionState {
  detected: boolean;
  aligned: boolean;
  quality: QualityGrade;
  prompt?: EyeAlignmentPrompt;
  confidenceScore?: number;
}

export interface QualityCheckDetail {
  eye_visible: boolean;
  sharpness: boolean;
  lighting: boolean;
  conjunctiva_visible: boolean;
}

export interface ImageQualityResult {
  image_quality: 'good' | 'poor';
  quality_score: number; // 0.00 to 1.00
  checks: QualityCheckDetail;
  message?: string;
}

export type AnemiaStatus =
  | 'normal'
  | 'possible_anemia'
  | 'mild_anemia'
  | 'moderate_anemia'
  | 'severe_anemia';

export type ConfidenceTier = 'high' | 'medium' | 'low';

export interface ScreeningResultData {
  screening_id: number | string;
  estimated_hb: number; // e.g. 10.8 g/dL
  confidence: number;   // 0.00 to 1.00 e.g. 0.86
  status: AnemiaStatus | string;
  image_quality: 'good' | 'poor' | string;
  reported_symptoms?: string[];
  created_at?: string;
  message?: string;
}

export interface AnalyzeScreeningPayload {
  image: string; // base64 / data URL
  symptoms?: string[];
  user_id?: string;
}

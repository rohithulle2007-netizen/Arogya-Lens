/**
 * Types & Data Contracts for Arogya Lens - Frontend Member 2
 * Post-Screening & User Data Domain
 */

export type SexType = 'male' | 'female' | 'other';

export type ConfidenceTier = 'high' | 'medium' | 'low';

export type AnemiaStatus =
  | 'normal'
  | 'possible_anemia'
  | 'mild_anemia'
  | 'moderate_anemia'
  | 'severe_anemia';

export type ImageQualityGrade = 'good' | 'fair' | 'poor';

/**
 * User Profile interface for profile page and user settings
 */
export interface ProfileData {
  id: string;
  name: string;
  mobile: string;
  age: number;
  sex: SexType;
  memberSince: string; // e.g., "21 Aug 2026"
  totalScreenings: number;
  latestEstimatedHb: number; // e.g., 10.8
  lastScreeningDate: string; // e.g., "21 Aug 2026"
  email?: string;
  bloodGroup?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Payload for updating user profile
 */
export interface ProfileUpdateRequest {
  name?: string;
  age?: number;
  sex?: SexType;
  mobile?: string;
  email?: string;
  bloodGroup?: string;
}

/**
 * Individual Screening record item for history and details
 */
export interface ScreeningRecord {
  screening_id: string | number;
  date: string; // ISO date "YYYY-MM-DD" or formatted "21 Aug 2026"
  time: string; // e.g., "14:30"
  estimated_hb: number; // e.g., 10.8 (in g/dL)
  confidence: number; // 0.00 to 1.00, e.g., 0.86
  status: AnemiaStatus | string;
  image_quality: ImageQualityGrade | string;
  symptoms: string[];
  notes?: string;
  created_at?: string;
}

/**
 * Trend point for progress visualization
 */
export interface TrendPoint {
  screening_id?: string | number;
  date: string; // "2026-08-21" or "21 Aug"
  displayDate?: string;
  estimated_hb: number;
  confidence?: number;
  status?: string;
}

/**
 * Aggregated summary for the Health Screening Dashboard
 */
export interface DashboardSummary {
  total_screenings: number;
  latest_hb: number;
  latest_confidence: number;
  last_screening: string;
  trend: TrendPoint[];
  recent_screenings: ScreeningRecord[];
}

/**
 * Helper: Derive confidence tier from numeric value (0.0 to 1.0 or 0 to 100)
 */
export function getConfidenceTier(confidence: number): ConfidenceTier {
  const normalized = confidence > 1 ? confidence / 100 : confidence;
  if (normalized >= 0.8) return 'high';
  if (normalized >= 0.6) return 'medium';
  return 'low';
}

/**
 * Helper: Format status into human-readable label and color style
 */
export function getStatusMeta(status: string, estimatedHb?: number) {
  const normStatus = (status || '').toLowerCase().replace(/[\s-]/g, '_');

  if (normStatus === 'normal' || (estimatedHb !== undefined && estimatedHb >= 12.0)) {
    return {
      label: 'Normal Hb Range',
      badgeVariant: 'success' as const,
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      description: 'Estimated haemoglobin is within expected typical reference levels.',
    };
  }

  if (normStatus === 'severe_anemia' || (estimatedHb !== undefined && estimatedHb < 8.0)) {
    return {
      label: 'Severe Anaemia Indicated',
      badgeVariant: 'danger' as const,
      textColor: 'text-rose-700',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
      description: 'Low conjunctival pallor detected consistent with severe anaemia.',
    };
  }

  if (normStatus === 'moderate_anemia' || (estimatedHb !== undefined && estimatedHb < 10.0)) {
    return {
      label: 'Moderate Anaemia Indicated',
      badgeVariant: 'warning' as const,
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      description: 'Conjunctival vascularity suggests moderately reduced haemoglobin levels.',
    };
  }

  // Default / possible_anemia / mild_anemia
  return {
    label: 'Possible Anaemia',
    badgeVariant: 'warning' as const,
    textColor: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    description: 'Conjunctival vascularity suggests lower than typical haemoglobin levels.',
  };
}

/**
 * Helper: Format confidence into percentage string and styling
 */
export function getConfidenceMeta(confidence: number) {
  const normalized = confidence > 1 ? confidence / 100 : confidence;
  const percentage = Math.round(normalized * 100);
  const tier = getConfidenceTier(normalized);

  switch (tier) {
    case 'high':
      return {
        tier,
        percentage,
        label: 'High Confidence',
        badgeVariant: 'success' as const,
        textColor: 'text-emerald-700',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
      };
    case 'medium':
      return {
        tier,
        percentage,
        label: 'Medium Confidence',
        badgeVariant: 'warning' as const,
        textColor: 'text-amber-700',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
      };
    case 'low':
    default:
      return {
        tier,
        percentage,
        label: 'Low Confidence',
        badgeVariant: 'danger' as const,
        textColor: 'text-rose-700',
        bgColor: 'bg-rose-50',
        borderColor: 'border-rose-200',
      };
  }
}

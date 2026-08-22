// Base API configuration and helpers
// Toggle between Mock mode and Live FastAPI backend seamlessly
import { API_BASE_URL, USE_MOCK } from './config';

export { API_BASE_URL, USE_MOCK };

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = sessionStorage.getItem('arogya_auth_token');
  const headers = new Headers(options.headers || {});

  // Only set application/json if body is not FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        error: data?.detail || data?.message || `Request failed with status ${response.status}`,
        status: response.status,
      };
    }

    return {
      data,
      status: response.status,
    };
  } catch (err: any) {
    return {
      error: err.message || 'Network error occurred while contacting backend service',
      status: 0,
    };
  }
}

/**
 * Arogya Lens - Frontend API Configuration
 * Centralized API base URL and environment toggle
 */

export const API_BASE_URL: string =
  (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export const USE_MOCK: boolean =
  (import.meta as any).env?.VITE_USE_MOCK === 'true';

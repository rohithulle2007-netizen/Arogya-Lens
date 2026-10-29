/**
 * Arogya Lens — Frontend Configuration
 * Centralized API base URL and application defaults
 */

const getApiBaseUrl = () => {
  // 1. Explicit build-time URL (e.g. from GitHub Actions / Vite define)
  if (typeof window.__API_BASE_URL__ === 'string' && window.__API_BASE_URL__.trim()) {
    return window.__API_BASE_URL__.trim();
  }

  // 2. Custom URL explicitly set by user in localStorage
  const storedUrl = localStorage.getItem('arogya_api_base_url');
  if (storedUrl && storedUrl.trim()) {
    return storedUrl.trim();
  }

  const hostname = window.location.hostname || '127.0.0.1';

  // 3. GitHub Pages: Default to empty string for standalone offline demo mode
  if (hostname.endsWith('github.io')) {
    return '';
  }

  // 4. Local development or container environments:
  // - If running under Vite dev server (port 5173 / 5174), Vite proxies /api to port 8000.
  // - If running directly on FastAPI backend (port 8000), origin is http://127.0.0.1:8000.
  // Using window.location.origin guarantees same-origin proxy compatibility and zero CORS issues.
  if (window.location.origin && window.location.origin !== 'null') {
    return window.location.origin;
  }

  return 'http://127.0.0.1:8000';
};

const CONFIG = {
  // Point to FastAPI Backend (or empty for offline demo)
  API_BASE_URL: getApiBaseUrl(),
  
  // Storage Keys
  STORAGE_TOKEN_KEY: "arogya_lens_jwt_token",
  STORAGE_USER_KEY: "arogya_lens_user",
  STORAGE_LANG_KEY: "arogya_lens_lang",
  STORAGE_API_URL_KEY: "arogya_api_base_url",
  STORAGE_DEMO_MODE_KEY: "arogya_demo_mode",

  // Clinical Reference Ranges (for UI representation)
  ADULT_NORMAL_MIN: 12.0,
  ADULT_NORMAL_MAX: 16.5
};

window.CONFIG = CONFIG;

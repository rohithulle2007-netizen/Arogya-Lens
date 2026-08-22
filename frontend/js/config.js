/**
 * Arogya Lens — Frontend Configuration
 * Centralized API base URL and application defaults
 */

const getApiBaseUrl = () => {
  if (window.__API_BASE_URL__) return window.__API_BASE_URL__;
  const storedUrl = localStorage.getItem('arogya_api_base_url');
  if (storedUrl) return storedUrl;

  const hostname = window.location.hostname || '127.0.0.1';
  // If backend is serving frontend directly on port 8000
  if (window.location.port === '8000') {
    return window.location.origin;
  }
  // If running locally
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://${hostname}:8000`;
  }
  // Default to relative or current host on port 8000
  return `http://${hostname}:8000`;
};

const CONFIG = {
  // Point to FastAPI Backend on port 8000
  API_BASE_URL: getApiBaseUrl(),
  
  // Storage Keys
  STORAGE_TOKEN_KEY: "arogya_lens_jwt_token",
  STORAGE_USER_KEY: "arogya_lens_user",
  STORAGE_LANG_KEY: "arogya_lens_lang",

  // Clinical Reference Ranges (for UI representation)
  ADULT_NORMAL_MIN: 12.0,
  ADULT_NORMAL_MAX: 16.5
};

window.CONFIG = CONFIG;

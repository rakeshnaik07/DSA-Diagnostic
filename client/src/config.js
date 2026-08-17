const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

if (import.meta.env.PROD && !configuredApiBaseUrl) {
  throw new Error('VITE_API_BASE_URL must be configured for production builds.');
}

export const API_BASE_URL = configuredApiBaseUrl || 'http://localhost:5000';

export function apiFetch(url, options = {}) {
  return fetch(url, { credentials: 'include', ...options });
}

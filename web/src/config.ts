/**
 * Get the backend URL from localStorage or fallback to default.
 * Users can configure the backend URL via the Backend Configuration screen.
 * In production (Vercel), uses relative /api path. In development, uses localhost:8000.
 */
export const getBackendUrl = (): string => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('backendUrl');
    if (stored) {
      return stored;
    }
  }
  // In production, use relative path. In development, use localhost.
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:8000';
  }
  return '';
};

export const POLL_INTERVAL_MS = 1500;
export const MIN_IMAGES = 3;
export const MAX_IMAGES = 24;

/**
 * Get the backend URL from localStorage or fallback to default.
 * Users can configure the backend URL via the Backend Configuration screen.
 */
export const getBackendUrl = (): string => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('backendUrl');
    if (stored) {
      return stored;
    }
  }
  return 'http://localhost:8000';
};

export const POLL_INTERVAL_MS = 1500;
export const MIN_IMAGES = 3;
export const MAX_IMAGES = 24;

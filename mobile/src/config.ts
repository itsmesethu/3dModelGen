import { Platform } from 'react-native';
import { useBackendStore } from './store/useBackendStore';

/**
 * Get the backend URL from the store or fallback to default.
 * - Android emulator reaches the host machine via 10.0.2.2
 * - iOS simulator can use localhost
 * - On a physical device, configure via Backend Configuration screen.
 */
export const getBackendUrl = (): string => {
  const { backendUrl } = useBackendStore.getState();
  if (backendUrl) {
    return backendUrl;
  }
  // Fallback to default
  return Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
};

// Legacy export for compatibility
export const BACKEND_URL = getBackendUrl();

export const POLL_INTERVAL_MS = 1500;
export const MIN_IMAGES = 3;
export const MAX_IMAGES = 24;

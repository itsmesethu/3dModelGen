import { Platform } from 'react-native';

/**
 * Local reconstruction service URL.
 * - Android emulator reaches the host machine via 10.0.2.2
 * - iOS simulator can use localhost
 * - On a physical device, set this to your computer's LAN IP.
 */
export const BACKEND_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

export const POLL_INTERVAL_MS = 1500;
export const MIN_IMAGES = 3;
export const MAX_IMAGES = 24;

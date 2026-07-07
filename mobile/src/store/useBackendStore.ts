import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BackendState {
  backendUrl: string | null;
  isConnected: boolean;
  setBackendUrl: (url: string) => Promise<void>;
  clearBackendUrl: () => Promise<void>;
  loadBackendUrl: () => Promise<void>;
  setConnected: (connected: boolean) => void;
}

const BACKEND_URL_KEY = '@backend_url';

export const useBackendStore = create<BackendState>((set) => ({
  backendUrl: null,
  isConnected: false,

  setBackendUrl: async (url: string) => {
    try {
      await AsyncStorage.setItem(BACKEND_URL_KEY, url);
      set({ backendUrl: url });
    } catch (error) {
      console.error('Failed to save backend URL:', error);
    }
  },

  clearBackendUrl: async () => {
    try {
      await AsyncStorage.removeItem(BACKEND_URL_KEY);
      set({ backendUrl: null, isConnected: false });
    } catch (error) {
      console.error('Failed to clear backend URL:', error);
    }
  },

  loadBackendUrl: async () => {
    try {
      const url = await AsyncStorage.getItem(BACKEND_URL_KEY);
      if (url) {
        set({ backendUrl: url });
      }
    } catch (error) {
      console.error('Failed to load backend URL:', error);
    }
  },

  setConnected: (connected: boolean) => {
    set({ isConnected: connected });
  },
}));

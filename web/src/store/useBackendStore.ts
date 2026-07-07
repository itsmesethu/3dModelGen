import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BackendState {
  backendUrl: string | null;
  isConnected: boolean;
  setBackendUrl: (url: string) => void;
  setIsConnected: (connected: boolean) => void;
  loadBackendUrl: () => void;
  testConnection: () => Promise<boolean>;
}

export const useBackendStore = create<BackendState>()(
  persist(
    (set, get) => ({
      backendUrl: null,
      isConnected: false,
      setBackendUrl: (url: string) => {
        set({ backendUrl: url });
        localStorage.setItem('backendUrl', url);
      },
      setIsConnected: (connected: boolean) => {
        set({ isConnected: connected });
      },
      loadBackendUrl: () => {
        const stored = localStorage.getItem('backendUrl');
        if (stored) {
          set({ backendUrl: stored });
        }
      },
      testConnection: async () => {
        try {
          const url = get().backendUrl || 'http://localhost:8000';
          const response = await fetch(`${url}/api/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          const connected = response.ok;
          set({ isConnected: connected });
          return connected;
        } catch {
          set({ isConnected: false });
          return false;
        }
      },
    }),
    {
      name: 'backend-store',
    },
  ),
);

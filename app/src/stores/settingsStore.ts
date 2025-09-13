import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
    serverUrl: string;
    setServerUrl: (url: string) => void;
    loadSettings: () => Promise<void>;
}

const DEFAULT_SERVER_URL = 'http://192.168.178.34:8080';
const STORAGE_KEY = 'settings';

export {DEFAULT_SERVER_URL};

export const useSettingsStore = create<SettingsState>((set, get) => ({
    serverUrl: DEFAULT_SERVER_URL,

    setServerUrl: async (url: string) => {
        const trimmedUrl = url.trim();
        set({serverUrl: trimmedUrl});
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({serverUrl: trimmedUrl}));

            const {apiService} = await import('../services/api/api');
            apiService.refreshConfig();

            return trimmedUrl;
        } catch (error) {
            console.error('Failed to save settings:', error);
            throw error;
        }
    },

    loadSettings: async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                const settings = JSON.parse(stored);
                set({serverUrl: settings.serverUrl || DEFAULT_SERVER_URL});
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    },
}));

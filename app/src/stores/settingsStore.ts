import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
    serverUrl: string;
    cameraQuality: number;
    cameraSkipProcessing: boolean;
    cameraMaxWidth: number;
    cameraMaxHeight: number;
    cameraFps: number;
    cameraDefaultZoom: number;
    setServerUrl: (url: string) => void;
    setCameraQuality: (quality: number) => void;
    setCameraSkipProcessing: (skip: boolean) => void;
    setCameraMaxWidth: (width: number) => void;
    setCameraMaxHeight: (height: number) => void;
    setCameraFps: (fps: number) => void;
    setCameraDefaultZoom: (zoom: number) => void;
    resetCameraSettings: () => void;
    loadSettings: () => Promise<void>;
}

const DEFAULT_SERVER_URL = 'http://192.168.178.34:8080';
const DEFAULT_CAMERA_QUALITY = 0.9;
const DEFAULT_CAMERA_SKIP_PROCESSING = true;
const DEFAULT_CAMERA_MAX_WIDTH = 1280;
const DEFAULT_CAMERA_MAX_HEIGHT = 720;
const DEFAULT_CAMERA_FPS = 1;
const DEFAULT_CAMERA_DEFAULT_ZOOM = 1.8;
const STORAGE_KEY = 'settings';

export {DEFAULT_SERVER_URL};

export const useSettingsStore = create<SettingsState>((set, get) => ({
    serverUrl: DEFAULT_SERVER_URL,
    cameraQuality: DEFAULT_CAMERA_QUALITY,
    cameraSkipProcessing: DEFAULT_CAMERA_SKIP_PROCESSING,
    cameraMaxWidth: DEFAULT_CAMERA_MAX_WIDTH,
    cameraMaxHeight: DEFAULT_CAMERA_MAX_HEIGHT,
    cameraFps: DEFAULT_CAMERA_FPS,
    cameraDefaultZoom: DEFAULT_CAMERA_DEFAULT_ZOOM,

    setServerUrl: async (url: string) => {
        const trimmedUrl = url.trim();
        set({serverUrl: trimmedUrl});
        try {
            const settings = get();
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                serverUrl: trimmedUrl,
                cameraQuality: settings.cameraQuality,
                cameraSkipProcessing: settings.cameraSkipProcessing,
                cameraMaxWidth: settings.cameraMaxWidth,
                cameraMaxHeight: settings.cameraMaxHeight,
                cameraFps: settings.cameraFps,
                cameraDefaultZoom: settings.cameraDefaultZoom,
            }));

            const {apiService} = await import('../services/api/api');
            apiService.refreshConfig();

            return trimmedUrl;
        } catch (error) {
            console.error('Failed to save settings:', error);
            throw error;
        }
    },

    setCameraQuality: async (quality: number) => {
        set({cameraQuality: quality});
        try {
            const settings = get();
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                serverUrl: settings.serverUrl,
                cameraQuality: quality,
                cameraSkipProcessing: settings.cameraSkipProcessing,
                cameraMaxWidth: settings.cameraMaxWidth,
                cameraMaxHeight: settings.cameraMaxHeight,
                cameraFps: settings.cameraFps,
                cameraDefaultZoom: settings.cameraDefaultZoom,
            }));
        } catch (error) {
            console.error('Failed to save camera quality:', error);
            throw error;
        }
    },

    setCameraSkipProcessing: async (skip: boolean) => {
        set({cameraSkipProcessing: skip});
        try {
            const settings = get();
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                serverUrl: settings.serverUrl,
                cameraQuality: settings.cameraQuality,
                cameraSkipProcessing: skip,
                cameraMaxWidth: settings.cameraMaxWidth,
                cameraMaxHeight: settings.cameraMaxHeight,
                cameraFps: settings.cameraFps,
                cameraDefaultZoom: settings.cameraDefaultZoom,
            }));
        } catch (error) {
            console.error('Failed to save camera skip processing:', error);
            throw error;
        }
    },

    setCameraMaxWidth: async (width: number) => {
        set({cameraMaxWidth: width});
        try {
            const settings = get();
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                serverUrl: settings.serverUrl,
                cameraQuality: settings.cameraQuality,
                cameraSkipProcessing: settings.cameraSkipProcessing,
                cameraMaxWidth: width,
                cameraMaxHeight: settings.cameraMaxHeight,
                cameraFps: settings.cameraFps,
                cameraDefaultZoom: settings.cameraDefaultZoom,
            }));
        } catch (error) {
            console.error('Failed to save camera max width:', error);
            throw error;
        }
    },

    setCameraMaxHeight: async (height: number) => {
        set({cameraMaxHeight: height});
        try {
            const settings = get();
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                serverUrl: settings.serverUrl,
                cameraQuality: settings.cameraQuality,
                cameraSkipProcessing: settings.cameraSkipProcessing,
                cameraMaxWidth: settings.cameraMaxWidth,
                cameraMaxHeight: height,
                cameraFps: settings.cameraFps,
                cameraDefaultZoom: settings.cameraDefaultZoom,
            }));
        } catch (error) {
            console.error('Failed to save camera max height:', error);
            throw error;
        }
    },

    setCameraFps: async (fps: number) => {
        set({cameraFps: fps});
        try {
            const settings = get();
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                serverUrl: settings.serverUrl,
                cameraQuality: settings.cameraQuality,
                cameraSkipProcessing: settings.cameraSkipProcessing,
                cameraMaxWidth: settings.cameraMaxWidth,
                cameraMaxHeight: settings.cameraMaxHeight,
                cameraFps: fps,
                cameraDefaultZoom: settings.cameraDefaultZoom,
            }));
        } catch (error) {
            console.error('Failed to save camera fps:', error);
            throw error;
        }
    },

    setCameraDefaultZoom: async (zoom: number) => {
        set({cameraDefaultZoom: zoom});
        try {
            const settings = get();
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                serverUrl: settings.serverUrl,
                cameraQuality: settings.cameraQuality,
                cameraSkipProcessing: settings.cameraSkipProcessing,
                cameraMaxWidth: settings.cameraMaxWidth,
                cameraMaxHeight: settings.cameraMaxHeight,
                cameraFps: settings.cameraFps,
                cameraDefaultZoom: zoom,
            }));
        } catch (error) {
            console.error('Failed to save camera default zoom:', error);
            throw error;
        }
    },

    resetCameraSettings: async () => {
        set({
            cameraQuality: DEFAULT_CAMERA_QUALITY,
            cameraSkipProcessing: DEFAULT_CAMERA_SKIP_PROCESSING,
            cameraMaxWidth: DEFAULT_CAMERA_MAX_WIDTH,
            cameraMaxHeight: DEFAULT_CAMERA_MAX_HEIGHT,
            cameraFps: DEFAULT_CAMERA_FPS,
            cameraDefaultZoom: DEFAULT_CAMERA_DEFAULT_ZOOM,
        });
        try {
            const settings = get();
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                serverUrl: settings.serverUrl,
                cameraQuality: DEFAULT_CAMERA_QUALITY,
                cameraSkipProcessing: DEFAULT_CAMERA_SKIP_PROCESSING,
                cameraMaxWidth: DEFAULT_CAMERA_MAX_WIDTH,
                cameraMaxHeight: DEFAULT_CAMERA_MAX_HEIGHT,
                cameraFps: DEFAULT_CAMERA_FPS,
                cameraDefaultZoom: DEFAULT_CAMERA_DEFAULT_ZOOM,
            }));
        } catch (error) {
            console.error('Failed to reset camera settings:', error);
            throw error;
        }
    },

    loadSettings: async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                const settings = JSON.parse(stored);
                set({
                    serverUrl: settings.serverUrl || DEFAULT_SERVER_URL,
                    cameraQuality: settings.cameraQuality ?? DEFAULT_CAMERA_QUALITY,
                    cameraSkipProcessing: settings.cameraSkipProcessing ?? DEFAULT_CAMERA_SKIP_PROCESSING,
                    cameraMaxWidth: settings.cameraMaxWidth ?? DEFAULT_CAMERA_MAX_WIDTH,
                    cameraMaxHeight: settings.cameraMaxHeight ?? DEFAULT_CAMERA_MAX_HEIGHT,
                    cameraFps: settings.cameraFps ?? DEFAULT_CAMERA_FPS,
                    cameraDefaultZoom: settings.cameraDefaultZoom ?? DEFAULT_CAMERA_DEFAULT_ZOOM,
                });
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    },
}));

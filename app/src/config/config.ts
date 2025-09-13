import Constants from 'expo-constants';
import {useSettingsStore} from '@/src/stores/settingsStore';

const getBaseUrl = () => {
    const {expoConfig} = Constants;
    const {serverUrl} = useSettingsStore.getState();

    if (__DEV__) {
        return `${serverUrl}/app`;
    }

    return `${serverUrl}/app`;
};

export const getApiConfig = () => {
    const baseURL = getBaseUrl();

    return {
        baseURL,
        timeout: 10000,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        withCredentials: false,
    };
};

export const REST_BASE_URL = getBaseUrl();

export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        REFRESH: '/auth/refresh',
        LOGOUT: '/auth/logout',
    },

    GAMES: {
        CREATE: '/game',
        THROW: '/game/gameId/playerId/dart',
        REVERT: '/game/gameId/playerId/dart/dartId',
        GET_STATE: '/game/gameId/state'
    },
};

export const getWebSocketConfig = () => {
    const {serverUrl} = useSettingsStore.getState();
    const wsUrl = serverUrl.replace('http://', 'ws://').replace('https://', 'wss://');

    return {
        DEFAULT_BASE_URL: wsUrl,
        DEFAULT_FPS: 1,
        RECONNECT_ATTEMPTS: 10,
        RECONNECT_DELAY: 500,
        HEARTBEAT_INTERVAL: 15000,
    } as const;
};

export const WEBSOCKET_CONFIG = {
    DEFAULT_BASE_URL: 'ws://192.168.178.34:8080',
    DEFAULT_FPS: 1,
    RECONNECT_ATTEMPTS: 10,
    RECONNECT_DELAY: 500,
    HEARTBEAT_INTERVAL: 15000,
} as const;

export const CAMERA_CONFIG = {
    DEFAULT_QUALITY: 0.9,
    SKIP_PROCESSING: true,
    MAX_WIDTH: 1280,
    MAX_HEIGHT: 720,
} as const;
import Constants from 'expo-constants';

const getBaseUrl = () => {
    const {expoConfig} = Constants;

    if (__DEV__) {
        return "http://192.168.178.34:8080/app";
    }

    return "https://your-production-server.com/app";
};

export const REST_BASE_URL = getBaseUrl();

export const API_CONFIG = {
    baseURL: REST_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
};

export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        REFRESH: '/auth/refresh',
        LOGOUT: '/auth/logout',
    },

    GAMES: {
        CREATE: '/games',
        GET_ALL: '/games',
        GET_BY_ID: (id: string) => `/games/${id}`,
        UPDATE: (id: string) => `/games/${id}`,
        DELETE: (id: string) => `/games/${id}`,
    },

    USERS: {
        PROFILE: '/users/profile',
        UPDATE_PROFILE: '/users/profile',
        GET_STATS: '/users/stats',
    },
};
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
        'Accept': 'application/json',
    },
    withCredentials: false,
};

export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        REFRESH: '/auth/refresh',
        LOGOUT: '/auth/logout',
    },

    GAMES: {
        CREATE: '/game',
    },
};
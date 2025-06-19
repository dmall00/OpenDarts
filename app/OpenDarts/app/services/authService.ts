import {apiService} from './api';
import {API_ENDPOINTS} from '../config/config';
import {LoginRequest, LoginResponse, User} from '../types/api';

export class AuthService {
    async login(credentials: LoginRequest): Promise<LoginResponse> {
        return apiService.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
    }

    async register(userData: LoginRequest & { username: string }): Promise<LoginResponse> {
        return apiService.post<LoginResponse>(API_ENDPOINTS.AUTH.REGISTER, userData);
    }

    async refreshToken(refreshToken: string): Promise<{ token: string }> {
        return apiService.post<{ token: string }>(API_ENDPOINTS.AUTH.REFRESH, {refreshToken});
    }

    async logout(): Promise<void> {
        return apiService.post<void>(API_ENDPOINTS.AUTH.LOGOUT);
    }

    async getProfile(): Promise<User> {
        return apiService.get<User>(API_ENDPOINTS.USERS.PROFILE);
    }

    async updateProfile(userData: Partial<User>): Promise<User> {
        return apiService.put<User>(API_ENDPOINTS.USERS.UPDATE_PROFILE, userData);
    }
}

export const authService = new AuthService();

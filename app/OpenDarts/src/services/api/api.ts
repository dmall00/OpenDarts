import axios from 'axios';
import {API_CONFIG} from "../../config/config";

class ApiService {
    private axiosInstance: any;

    constructor() {
        this.axiosInstance = axios.create(API_CONFIG);
        this.setupInterceptors();
    }

    async get<T>(url: string, config?: any): Promise<T> {
        const response = await this.axiosInstance.get(url, config);
        return response.data;
    }

    async post<T>(url: string, data?: any, config?: any): Promise<T> {
        const response = await this.axiosInstance.post(url, data, config);
        return response.data;
    }

    async put<T>(url: string, data?: any, config?: any): Promise<T> {
        const response = await this.axiosInstance.put(url, data, config);
        return response.data;
    }

    async delete<T>(url: string, config?: any): Promise<T> {
        const response = await this.axiosInstance.delete(url, config);
        return response.data;
    }
    private setupInterceptors() {
        this.axiosInstance.interceptors.request.use(
            async (config: any) => {
                const token = await this.getAuthToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }

                console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error: any) => {
                console.error('Request Error:', error);
                return Promise.reject(error);
            }
        );
        this.axiosInstance.interceptors.response.use(
            (response: any) => {
                console.log(`API Response: ${response.status} ${response.config.url}`);
                return response;
            },
            (error: any) => {
                console.error('Response Error:', error.response?.status, error.response?.data);

                if (error.response?.status === 401) {
                    this.handleUnauthorized();
                }

                return Promise.reject(error);
            }
        );
    }

    private async getAuthToken(): Promise<string | null> {
        const {TokenStorage} = await import('../../utils/tokenStorage');
        return TokenStorage.getToken();
    }

    private async handleUnauthorized() {
        const {TokenStorage} = await import('../../utils/tokenStorage');
        await TokenStorage.clearTokens();
        console.log('User unauthorized - tokens cleared');
    }
}

export const apiService = new ApiService();
export default apiService;

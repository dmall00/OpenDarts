import axios from 'axios';
import {getApiConfig} from "../../config/config";

class ApiService {
    private axiosInstance: any;

    constructor() {
        this.updateConfig();
    }

    async delete<T>(url: string, config?: any): Promise<T> {
        this.updateConfig();
        const response = await this.axiosInstance.delete(url, config);
        return response.data;
    }

    async get<T>(url: string, config?: any): Promise<T> {
        this.updateConfig();
        const response = await this.axiosInstance.get(url, config);
        return response.data;
    }

    async post<T>(url: string, data?: any, config?: any): Promise<T> {
        this.updateConfig();
        const response = await this.axiosInstance.post(url, data, config);
        return response.data;
    }

    async put<T>(url: string, data?: any, config?: any): Promise<T> {
        this.updateConfig();
        const response = await this.axiosInstance.put(url, data, config);
        return response.data;
    }

    refreshConfig() {
        this.updateConfig();
    }

    private updateConfig() {
        const config = getApiConfig();
        const axiosConfig = {
            ...config,
            validateStatus: (status: number) => status < 500,
        };

        this.axiosInstance = axios.create(axiosConfig);

        this.axiosInstance.interceptors.request.use(
            (config: any) => {
                console.log('API Request:', {
                    url: config.url,
                    baseURL: config.baseURL,
                    method: config.method,
                    fullUrl: `${config.baseURL}${config.url}`
                });
                return config;
            },
            (error: any) => {
                console.error('API Request Error:', error);
                return Promise.reject(error);
            }
        );

        this.axiosInstance.interceptors.response.use(
            (response: any) => {
                console.log('API Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.config.url
                });
                return response;
            },
            (error: any) => {
                console.error('API Response Error:', {
                    message: error.message,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    url: error.config?.url,
                    baseURL: error.config?.baseURL
                });
                return Promise.reject(error);
            }
        );
    }
}

export const apiService = new ApiService();
export default apiService;

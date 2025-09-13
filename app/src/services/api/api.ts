import axios from 'axios';
import {getApiConfig} from "../../config/config";

class ApiService {
    private axiosInstance: any;

    constructor() {
        this.axiosInstance = axios.create(getApiConfig());
    }

    async delete<T>(url: string, config?: any): Promise<T> {
        const response = await this.axiosInstance.delete(url, config);
        return response.data;
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

    refreshConfig() {
        this.updateConfig();
    }

    private updateConfig() {
        this.axiosInstance = axios.create(getApiConfig());
    }
}

export const apiService = new ApiService();
export default apiService;

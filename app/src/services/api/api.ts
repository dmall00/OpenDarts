import axios from 'axios';
import {API_CONFIG} from "../../config/config";

class ApiService {
    private axiosInstance: any;

    constructor() {
        this.axiosInstance = axios.create(API_CONFIG);
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
}

export const apiService = new ApiService();
export default apiService;

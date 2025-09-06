import {Alert} from 'react-native';
import {ApiError} from '../types/api';

export class ErrorHandler {
    static handle(error: any, showAlert: boolean = true): ApiError {
        console.error('Error Handler:', error);

        let apiError: ApiError;

        if (error.response) {
            apiError = {
                message: error.response.data?.message || 'Server error occurred',
                status: error.response.status,
                code: error.response.data?.code,
                details: error.response.data,
            };
        } else if (error.request) {
            apiError = {
                message: 'Network error. Please check your connection.',
                status: 0,
                code: 'NETWORK_ERROR',
            };
        } else {
            apiError = {
                message: error.message || 'An unexpected error occurred',
                status: -1,
                code: 'UNKNOWN_ERROR',
            };
        }

        if (showAlert) {
            this.showErrorAlert(apiError);
        }

        return apiError;
    }

    static showErrorAlert(error: ApiError) {
        Alert.alert(
            'Error',
            error.message,
            [{text: 'OK'}],
            {cancelable: true}
        );
    }
}

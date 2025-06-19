import {useEffect, useState} from 'react';
import {ErrorHandler, withErrorHandling} from '../utils/errorHandler';

interface UseApiOptions {
    loadOnMount?: boolean;
    showErrorAlert?: boolean;
}

export function useApi<T>(
    apiCall: () => Promise<T>,
    options: UseApiOptions = {}
) {
    const {loadOnMount = false, showErrorAlert = true} = options;

    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const execute = async () => {
        setLoading(true);
        setError(null);

        const result = await withErrorHandling(apiCall, showErrorAlert);

        if (result !== null) {
            setData(result);
        } else {
            setError('Failed to load data');
        }

        setLoading(false);
        return result;
    };

    const reset = () => {
        setData(null);
        setError(null);
        setLoading(false);
    };

    useEffect(() => {
        if (loadOnMount) {
            execute();
        }
    }, []);

    return {
        data,
        loading,
        error,
        execute,
        reset,
    };
}

export function useMutation<TData, TVariables = any>(
    mutationFn: (variables: TVariables) => Promise<TData>,
    options: { onSuccess?: (data: TData) => void; onError?: (error: any) => void } = {}
) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutate = async (variables: TVariables): Promise<TData | null> => {
        setLoading(true);
        setError(null);

        try {
            const result = await mutationFn(variables);
            options.onSuccess?.(result);
            setLoading(false);
            return result;
        } catch (err) {
            const apiError = ErrorHandler.handle(err);
            setError(apiError.message);
            options.onError?.(err);
            setLoading(false);
            return null;
        }
    };

    return {
        mutate,
        loading,
        error,
    };
}

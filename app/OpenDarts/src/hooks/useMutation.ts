import {useState} from 'react';
import {ErrorHandler} from '../utils/errorHandler';

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

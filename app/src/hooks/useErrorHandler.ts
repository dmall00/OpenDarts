import {useEffect} from 'react';
import {Alert} from 'react-native';

export const useErrorHandler = (error: string | null) => {
    useEffect(() => {
        if (error) {
            Alert.alert('Error', error);
        }
    }, [error]);
};

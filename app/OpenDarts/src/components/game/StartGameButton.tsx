import React from 'react';
import {Text, TouchableOpacity} from 'react-native';
import {GlobalStyles} from '@/src/styles/GlobalStyles';
import {ErrorStyles} from "@/src/styles/Errors";

interface StartGameButtonProps {
    onPress: () => void;
    loading: boolean;
    error: string | null;
}

export function StartGameButton({onPress, loading, error}: StartGameButtonProps) {
    return (
        <>
            <TouchableOpacity
                style={[
                    GlobalStyles.primaryButton,
                    loading && {opacity: 0.7}
                ]}
                onPress={onPress}
                disabled={loading}
            >
                <Text style={GlobalStyles.primaryButtonText}>
                    {loading ? 'Creating Game...' : 'Start Game'}
                </Text>
            </TouchableOpacity>

            {error && (
                <Text style={ErrorStyles.errorText}>
                    {error}
                </Text>
            )}
        </>
    );
}
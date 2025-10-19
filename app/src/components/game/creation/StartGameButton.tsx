import React from 'react';
import Button from '@/src/components/ui/Button';
import Typography from '@/src/components/ui/Typography';

interface StartGameButtonProps {
    onPress: () => void;
    loading: boolean;
    error: string | null;
}

export function StartGameButton(props: StartGameButtonProps) {
    const {onPress, loading, error} = props;

    return (
        <>
            <Button
                title={loading ? 'Creating Game...' : '🚀 Start Game'}
                variant="success"
                onPress={onPress}
                loading={loading}
                size="large"
            />

            {error && (
                <Typography variant="error" className="mt-2.5 text-center">
                    {error}
                </Typography>
            )}
        </>
    );
}
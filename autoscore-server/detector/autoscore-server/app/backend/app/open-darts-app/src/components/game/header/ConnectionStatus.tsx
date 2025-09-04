import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';

interface ConnectionStatusProps {
    isConnected: boolean;
    isConnecting: boolean;
    onReconnect: () => void;
}

export default function ConnectionStatus({isConnected, isConnecting, onReconnect}: ConnectionStatusProps) {
    const getStatusColor = () => {
        if (isConnecting) return '#fbbf24';
        return isConnected ? '#10b981' : '#ef4444';
    };

    const handlePress = () => {
        if (!isConnected && !isConnecting) {
            onReconnect();
        }
    };

    return (
        <TouchableOpacity
            className="w-6 h-6 justify-center items-center"
            onPress={handlePress}
            disabled={isConnected || isConnecting}
            activeOpacity={0.7}
        >
            <View
                className="w-3 h-3 rounded-full shadow-sm"
                style={{
                    backgroundColor: getStatusColor(),
                    shadowColor: '#000',
                    shadowOffset: {
                        width: 0,
                        height: 2,
                    },
                    shadowOpacity: 0.25,
                    shadowRadius: 3,
                    elevation: 4,
                }}
            />
            {isConnecting && (
                <View
                    className="absolute w-5 h-5 rounded-full border-2 opacity-60"
                    style={{borderColor: getStatusColor()}}
                />
            )}
        </TouchableOpacity>
    );
}
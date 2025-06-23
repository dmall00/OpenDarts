import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {Colors} from '../../styles/Colors';

interface ConnectionStatusProps {
    isConnected: boolean;
    isConnecting: boolean;
    onReconnect: () => void;
}

export default function ConnectionStatus({isConnected, isConnecting, onReconnect}: ConnectionStatusProps) {
    const getStatusColor = () => {
        if (isConnecting) return '#fbbf24';
        return isConnected ? Colors.emerald[500] : '#ef4444';
    };

    const handlePress = () => {
        if (!isConnected && !isConnecting) {
            onReconnect();
        }
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={handlePress}
            disabled={isConnected || isConnecting}
            activeOpacity={0.7}
        >
            <View style={[styles.dot, {backgroundColor: getStatusColor()}]}/>
            {isConnecting && (
                <View style={[styles.pulse, {borderColor: getStatusColor()}]}/>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3,
        elevation: 4,
    },
    pulse: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        opacity: 0.6,
    },
});

import React, {useState} from 'react';
import {Alert, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {Colors} from '../../styles/Colors';
import {BorderRadius, Spacing} from '../../styles/Layout';
import {WEBSOCKET_CONFIG} from '../../config/config';

interface WebSocketConfigProps {
    onConfigSave: (url: string, fps: number) => void;
    currentUrl?: string;
    currentFps?: number;
}

export default function WebSocketConfig({
                                            onConfigSave,
                                            currentUrl = WEBSOCKET_CONFIG.DEFAULT_URL,
                                            currentFps = WEBSOCKET_CONFIG.DEFAULT_FPS
                                        }: WebSocketConfigProps) {
    const [url, setUrl] = useState(currentUrl);
    const [fps, setFps] = useState(currentFps.toString());

    const handleSave = () => {
        const fpsNumber = parseInt(fps, 10);

        if (!url.trim()) {
            Alert.alert('Error', 'WebSocket URL is required');
            return;
        }

        if (isNaN(fpsNumber) || fpsNumber < 0.1 || fpsNumber > 30) {
            Alert.alert('Error', 'FPS must be between 0.1 and 30');
            return;
        }

        onConfigSave(url.trim(), fpsNumber);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>WebSocket Configuration</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>WebSocket URL</Text>
                <TextInput
                    style={styles.input}
                    value={url}
                    onChangeText={setUrl}
                    placeholder="ws://localhost:8080/ws"
                    placeholderTextColor={Colors.slate[400]}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>FPS (Frames Per Second)</Text>
                <TextInput
                    style={styles.input}
                    value={fps}
                    onChangeText={setFps}
                    placeholder="1"
                    placeholderTextColor={Colors.slate[400]}
                    keyboardType="numeric"
                />
                <Text style={styles.helperText}>
                    Recommended: 1-5 FPS for optimal performance
                </Text>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save Configuration</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: Spacing.lg,
        backgroundColor: 'white',
        borderRadius: BorderRadius.xl,
        margin: Spacing.base,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.slate[800],
        marginBottom: Spacing.lg,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.slate[700],
        marginBottom: Spacing.sm,
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.slate[300],
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.base,
        fontSize: 16,
        color: Colors.slate[800],
        backgroundColor: Colors.slate[50],
    }, helperText: {
        fontSize: 12,
        color: Colors.slate[400],
        marginTop: Spacing.xs,
        fontStyle: 'italic',
    },
    saveButton: {
        backgroundColor: Colors.emerald[500],
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.lg,
        shadowColor: Colors.emerald[500],
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});

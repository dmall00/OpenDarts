import React from 'react';
import {StatusBar, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {router} from 'expo-router';

export default function FullScreenWindow() {
    const goBack = () => {
        router.back();
    };

    return (
        <View style={styles.container}>
            <StatusBar hidden={false} backgroundColor="#000" barStyle="light-content"/>
            <Text style={styles.title}>Full Screen Window</Text>
            <Text style={styles.subtitle}>This is a dedicated full-screen route</Text>

            <TouchableOpacity style={styles.backButton} onPress={goBack}>
                <Text style={styles.buttonText}>Go Back</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        color: 'white',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        color: '#ccc',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 30,
    },
    backButton: {
        backgroundColor: '#FF3B30',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        minWidth: 120,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

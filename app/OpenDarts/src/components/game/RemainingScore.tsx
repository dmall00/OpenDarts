import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface RemainingScoreProps {
    score: number | null;
    playerId: string;
    isGameActive: boolean;
}

export const RemainingScore: React.FC<RemainingScoreProps> = ({ 
    score, 
    playerId, 
    isGameActive 
}) => {
    const getScoreColor = (score: number | null) => {
        if (score === null) return '#6c757d';
        if (score === 0) return '#28a745'; // Green for finished
        if (score <= 50) return '#ffc107'; // Yellow for close
        if (score <= 170) return '#fd7e14'; // Orange for medium
        return '#007bff'; // Blue for high scores
    };

    const getStatusMessage = (score: number | null, isActive: boolean) => {
        if (score === null) return 'Waiting for first dart...';
        if (score === 0) return '🎉 Game Finished!';
        if (!isActive) return 'Game paused';
        if (score <= 32) return 'Finish available!';
        if (score <= 100) return 'Getting close!';
        return 'Keep throwing!';
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.playerLabel}>{playerId}</Text>
                <Text style={styles.statusText}>
                    {getStatusMessage(score, isGameActive)}
                </Text>
            </View>
            
            <View style={styles.scoreContainer}>
                <Text style={styles.scoreLabel}>Remaining Score</Text>
                <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>
                    {score !== null ? score : '--'}
                </Text>
            </View>

            {score !== null && score > 0 && (
                <View style={styles.gameInfo}>
                    <Text style={styles.gameInfoText}>
                        Game Status: {isGameActive ? '🟢 Active' : '🟡 Waiting'}
                    </Text>
                </View>
            )}

            {score === 0 && (
                <View style={styles.winnerContainer}>
                    <Text style={styles.winnerText}>🏆 Winner! 🏆</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        padding: 20,
        margin: 10,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#e9ecef',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 8,
    },
    header: {
        alignItems: 'center',
        marginBottom: 15,
    },
    playerLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#495057',
        marginBottom: 4,
    },
    statusText: {
        fontSize: 14,
        color: '#6c757d',
        fontStyle: 'italic',
    },
    scoreContainer: {
        alignItems: 'center',
        marginBottom: 15,
    },
    scoreLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#495057',
        marginBottom: 8,
    },
    scoreValue: {
        fontSize: 48,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    gameInfo: {
        backgroundColor: '#f8f9fa',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    gameInfoText: {
        fontSize: 14,
        color: '#495057',
        fontWeight: '500',
    },
    winnerContainer: {
        backgroundColor: '#d4edda',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#28a745',
    },
    winnerText: {
        fontSize: 18,
        color: '#155724',
        fontWeight: 'bold',
    },
});

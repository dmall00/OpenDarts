import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DartTrackedTo } from '../../types/api';

interface DartHistoryProps {
    dartHistory: DartTrackedTo[];
    maxDarts?: number;
}

export const DartHistory: React.FC<DartHistoryProps> = ({ 
    dartHistory, 
    maxDarts = 3 
}) => {
    const displayDarts = dartHistory.slice(0, maxDarts);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Last {maxDarts} Darts:</Text>
            {displayDarts.length > 0 ? (
                <View style={styles.dartsList}>
                    {displayDarts.map((dartData, index) => (
                        <View key={index} style={[styles.dartItem, index === 0 && styles.mostRecentDart]}>
                            <View style={styles.dartInfo}>
                                <Text style={styles.dartScore}>
                                    {dartData.trackedDart.score}
                                </Text>
                                <Text style={styles.dartMultiplier}>
                                    ×{dartData.trackedDart.multiplier}
                                </Text>
                                <Text style={styles.dartSegment}>
                                    S{dartData.trackedDart.segment}
                                </Text>
                            </View>
                            <Text style={styles.dartRemaining}>
                                {dartData.remainingScore} left
                            </Text>
                            {index === 0 && (
                                <View style={styles.recentIndicator}>
                                    <Text style={styles.recentText}>Latest</Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <Text style={styles.noDartsText}>🎯 No darts thrown yet</Text>
                    <Text style={styles.instructionText}>Start throwing darts to see them here!</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        padding: 16,
        margin: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e1e5e9',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2c3e50',
        marginBottom: 12,
        textAlign: 'center',
    },
    dartsList: {
        gap: 10,
    },
    dartItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e9ecef',
        position: 'relative',
    },
    mostRecentDart: {
        backgroundColor: '#e8f5e8',
        borderColor: '#28a745',
        borderWidth: 2,
    },
    dartInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dartScore: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#28a745',
        minWidth: 45,
        textAlign: 'center',
    },
    dartMultiplier: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6c757d',
        minWidth: 35,
        textAlign: 'center',
    },
    dartSegment: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fd7e14',
        minWidth: 40,
        textAlign: 'center',
        backgroundColor: '#fff3cd',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    dartRemaining: {
        fontSize: 14,
        color: '#495057',
        fontWeight: '500',
        textAlign: 'right',
    },
    recentIndicator: {
        position: 'absolute',
        top: -8,
        right: 8,
        backgroundColor: '#28a745',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    recentText: {
        fontSize: 10,
        color: '#ffffff',
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    noDartsText: {
        fontSize: 18,
        color: '#6c757d',
        textAlign: 'center',
        marginBottom: 8,
    },
    instructionText: {
        fontSize: 14,
        color: '#adb5bd',
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

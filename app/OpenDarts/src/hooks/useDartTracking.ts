import { useState, useCallback } from 'react';
import { useGameWebSocket } from './useGameWebSocket';
import { DartTrackedTo, DartThrow } from '../types/api';

interface UseDartTrackingProps {
    gameId: string;
    playerId: string;
    websocketUrl?: string;
}

interface DartTrackingState {
    currentScore: number | null;
    lastDart: DartThrow | null;
    dartHistory: DartTrackedTo[];
    isGameActive: boolean;
}

export const useDartTracking = ({ gameId, playerId, websocketUrl }: UseDartTrackingProps) => {
    const [trackingState, setTrackingState] = useState<DartTrackingState>({
        currentScore: null,
        lastDart: null,
        dartHistory: [],
        isGameActive: false,
    });

    const handleDartTracked = useCallback((dartData: DartTrackedTo) => {
        setTrackingState(prev => ({
            ...prev,
            currentScore: dartData.remainingScore,
            lastDart: dartData.trackedDart,
            dartHistory: [dartData, ...prev.dartHistory.slice(0, 19)],
            isGameActive: true,
        }));
    }, []);

    const handleScoreUpdate = useCallback((updatedPlayerId: string, remainingScore: number) => {
        if (updatedPlayerId === playerId) {
            setTrackingState(prev => ({
                ...prev,
                currentScore: remainingScore,
            }));
        }
    }, [playerId]);

    const webSocket = useGameWebSocket({
        gameId,
        playerId,
        websocketUrl,
        onDartTracked: handleDartTracked,
        onScoreUpdate: handleScoreUpdate,
    });

    // Clear tracking data
    const clearTrackingData = useCallback(() => {
        setTrackingState({
            currentScore: null,
            lastDart: null,
            dartHistory: [],
            isGameActive: false,
        });
    }, []);

    // Send camera image for dart detection
    const sendCameraFrame = useCallback((imageData: string | ArrayBuffer | Blob) => {
        return webSocket.sendImageData(imageData);
    }, [webSocket]);

    return {
        // WebSocket connection info
        isConnected: webSocket.isConnected,
        isConnecting: webSocket.isConnecting,
        connectionError: webSocket.error,
        
        // Dart tracking data
        currentScore: trackingState.currentScore,
        lastDart: trackingState.lastDart,
        dartHistory: trackingState.dartHistory,
        isGameActive: trackingState.isGameActive,
        
        // Actions
        connect: webSocket.connect,
        disconnect: webSocket.disconnect,
        sendCameraFrame,
        clearTrackingData,
        
        // Camera capture control
        startCapture: webSocket.startCapture,
        stopCapture: webSocket.stopCapture,
    };
};

import { useCallback, useEffect } from 'react';
import { useWebSocketMessages } from './useWebSocketMessages';
import { WEBSOCKET_CONFIG } from '../config/config';
import { DartTrackedTo } from '../types/api';

interface UseGameWebSocketProps {
    gameId: string;
    playerId: string;
    websocketUrl?: string;
    fps?: number;
    onDartTracked?: (dartData: DartTrackedTo) => void;
    onScoreUpdate?: (playerId: string, remainingScore: number) => void;
    onGameEvent?: (event: any) => void;
}

export const useGameWebSocket = ({
    gameId,
    playerId,
    websocketUrl,
    fps = WEBSOCKET_CONFIG.DEFAULT_FPS,
    onDartTracked,
    onScoreUpdate,
    onGameEvent,
}: UseGameWebSocketProps) => {
    let wsUrl: string;
    if (websocketUrl) {
        wsUrl = websocketUrl;
    } else {
        wsUrl = `${WEBSOCKET_CONFIG.DEFAULT_BASE_URL}/ws/app/${playerId}/${gameId}`;
    }

    const webSocketMessages = useWebSocketMessages({
        url: wsUrl,
        fps,
        autoConnect: true,
        reconnectAttempts: WEBSOCKET_CONFIG.RECONNECT_ATTEMPTS,
        reconnectDelay: WEBSOCKET_CONFIG.RECONNECT_DELAY,
        heartbeatInterval: WEBSOCKET_CONFIG.HEARTBEAT_INTERVAL,
    });

    // Handle DartTrackedTo messages
    useEffect(() => {
        const unsubscribe = webSocketMessages.onMessage<DartTrackedTo>('dartTracked', (dartData) => {
            console.log('Dart tracked:', dartData);
            
            // Call specific handlers
            onDartTracked?.(dartData);
            onScoreUpdate?.(dartData.currentPlayer, dartData.remainingScore);
        });

        return unsubscribe;
    }, [webSocketMessages, onDartTracked, onScoreUpdate]);

    // Handle heartbeat/ping messages
    useEffect(() => {
        const unsubscribe = webSocketMessages.onMessage('ping', (data) => {
            console.log('Received ping:', data);
            // Optionally send pong back
            webSocketMessages.sendMessage({ type: 'pong', timestamp: Date.now() });
        });

        return unsubscribe;
    }, [webSocketMessages]);

    // Handle any other game events
    useEffect(() => {
        if (!onGameEvent) return;

        const unsubscribe = webSocketMessages.onAnyMessage((message) => {
            onGameEvent(message);
        });

        return unsubscribe;
    }, [webSocketMessages, onGameEvent]);

    // Send image data to server
    const sendImageData = useCallback((imageData: string | ArrayBuffer | Blob) => {
        return webSocketMessages.sendBinary(imageData);
    }, [webSocketMessages]);

    // Send JSON message
    const sendMessage = useCallback((message: any) => {
        return webSocketMessages.sendMessage(message);
    }, [webSocketMessages]);

    return {
        ...webSocketMessages,
        sendImageData,
        sendMessage,
    };
};

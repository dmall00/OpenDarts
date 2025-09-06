import {useCallback, useEffect, useRef, useState} from 'react';
import useWebSocketLib, {ReadyState} from 'react-use-websocket';

export interface WebSocketConfig {
    url: string;
    fps?: number;
    autoConnect?: boolean;
    reconnectAttempts?: number;
    reconnectDelay?: number;
    heartbeatInterval?: number;
}

export const useWebSocket = (config: WebSocketConfig) => {
    const {
        url,
        fps = 1,
        autoConnect = true,
        reconnectAttempts = 10,
        reconnectDelay = 1000,
        heartbeatInterval = 30000,
    } = config;

    const [error, setError] = useState<string | null>(null);
    const captureIntervalRef = useRef<number | null>(null);
    const heartbeatIntervalRef = useRef<number | null>(null);
    const onCaptureRef = useRef<(() => Promise<void>) | null>(null);
    const reconnectTimeoutRef = useRef<number | null>(null);
    const {
        sendMessage: sendMessageLib,
        sendJsonMessage,
        lastMessage,
        readyState,
        getWebSocket,
    } = useWebSocketLib(
        url,
        {
            onOpen: () => {
                console.log('WebSocket connected successfully');
                setError(null);
                startHeartbeat();
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = null;
                }
            }, onClose: (event) => {
                console.log('WebSocket disconnected - Code:', event.code, 'Reason:', event.reason);
                console.log('Close event details:', {
                    code: event.code,
                    reason: event.reason,
                    wasClean: event.wasClean,
                    timestamp: new Date().toISOString()
                });
                stopHeartbeat();
                if (event.code !== 1000 && event.code !== 1001) {
                    setError(`Connection lost: ${event.reason || 'Unknown error'}`);
                }
            },
            onError: (event) => {
                console.error('WebSocket error:', event);
                setError('WebSocket connection failed');
                stopHeartbeat();
            }, shouldReconnect: (closeEvent) => {
                return closeEvent.code !== 1000;
            },
            reconnectAttempts,
            reconnectInterval: (attemptNumber) => {
                return Math.min(reconnectDelay * Math.pow(1.5, attemptNumber), 30000);
            },
        },
        autoConnect
    );
    const isConnected = readyState === ReadyState.OPEN;
    const isConnecting = readyState === ReadyState.CONNECTING;

    const startHeartbeat = useCallback(() => {
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
        }

        heartbeatIntervalRef.current = setInterval(() => {
            if (readyState === ReadyState.OPEN) {
                try {
                    sendJsonMessage({type: 'ping', timestamp: Date.now()});
                } catch (error) {
                    console.error('Failed to send heartbeat:', error);
                }
            }
        }, heartbeatInterval);
    }, [readyState, sendJsonMessage, heartbeatInterval]);

    const stopHeartbeat = useCallback(() => {
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
        }
    }, []);
    const connect = useCallback(() => {
        if (readyState !== ReadyState.OPEN && readyState !== ReadyState.CONNECTING) {
            const ws = getWebSocket();
            if (ws && ws.readyState !== WebSocket.CLOSED) {
                ws.close();
            }
            setError(null);
        }
    }, [readyState, getWebSocket]);
    const disconnect = useCallback(() => {
        if (captureIntervalRef.current) {
            clearInterval(captureIntervalRef.current);
            captureIntervalRef.current = null;
        }

        stopHeartbeat();

        const ws = getWebSocket();
        if (ws) {
            try {
                (ws as WebSocket).close(1000, 'Manual disconnect');
            } catch (error) {
                console.error('Error during manual disconnect:', error);
            }
        }
    }, [getWebSocket, stopHeartbeat]);

    const sendMessage = useCallback((message: any) => {
        if (readyState === ReadyState.OPEN) {
            try {
                sendJsonMessage(message);
                return true;
            } catch (error) {
                console.error('Failed to send WebSocket message:', error);
                return false;
            }
        }
        return false;
    }, [readyState, sendJsonMessage]);
    const sendBinary = useCallback((data: string | ArrayBuffer | Blob) => {
        const ws = getWebSocket();
        if (ws && readyState === ReadyState.OPEN) {
            try {
                (ws as WebSocket).send(data);
                return true;
            } catch (error) {
                setError('Failed to send data');
                return false;
            }
        } else {
            console.warn('WebSocket not ready for sending binary data, state:', readyState);
            if (readyState === ReadyState.CLOSED || readyState === ReadyState.CLOSING) {
                setError('Connection lost');
            }
        }
        return false;
    }, [readyState, getWebSocket]);

    const startCapture = useCallback((captureFunction: () => Promise<void>) => {
        onCaptureRef.current = captureFunction;

        if (captureIntervalRef.current) {
            clearInterval(captureIntervalRef.current);
        }
        const intervalMs = 1000 / fps;
        captureIntervalRef.current = setInterval(async () => {
            const isConnectedNow = readyState === ReadyState.OPEN;
            if (isConnectedNow && onCaptureRef.current) {
                try {
                    await onCaptureRef.current();
                } catch (error) {
                    console.error('Capture failed:', error);
                }
            }
        }, intervalMs);
    }, [fps, readyState]);
    const stopCapture = useCallback(() => {
        if (captureIntervalRef.current) {
            clearInterval(captureIntervalRef.current);
            captureIntervalRef.current = null;
        }
        onCaptureRef.current = null;
    }, []);

    useEffect(() => {
        return () => {
            stopCapture();
            stopHeartbeat();
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [stopCapture, stopHeartbeat]);

    return {
        isConnected,
        isConnecting,
        error,
        lastMessage,
        connect,
        disconnect,
        sendMessage,
        sendBinary,
        startCapture,
        stopCapture,
    };
};

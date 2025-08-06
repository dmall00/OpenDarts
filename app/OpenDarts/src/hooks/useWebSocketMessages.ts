import { useEffect, useRef, useCallback } from 'react';
import { useWebSocket, WebSocketConfig } from './useWebSocket';
import { WebSocketMessageService } from '../services/websocket/messageService';
import { MessageHandler } from '../types/api';

export interface UseWebSocketMessagesConfig extends WebSocketConfig {
}

export const useWebSocketMessages = (config: UseWebSocketMessagesConfig) => {
    const messageServiceRef = useRef<WebSocketMessageService>(new WebSocketMessageService());
    const webSocket = useWebSocket(config);

    useEffect(() => {
        if (webSocket.lastMessage) {
            messageServiceRef.current.handleMessage(webSocket.lastMessage);
        }
    }, [webSocket.lastMessage]);

    const onMessage = useCallback(<T>(messageType: string, handler: MessageHandler<T>) => {
        return messageServiceRef.current.onMessage(messageType, handler);
    }, []);

    const onAnyMessage = useCallback((handler: MessageHandler<any>) => {
        return messageServiceRef.current.onAnyMessage(handler);
    }, []);

    useEffect(() => {
        return () => {
            messageServiceRef.current.clearHandlers();
        };
    }, []);

    return {
        ...webSocket,
        onMessage,
        onAnyMessage,
        messageService: messageServiceRef.current,
    };
};

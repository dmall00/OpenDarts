import {useCallback, useEffect, useRef} from 'react';
import {useWebSocket, WebSocketConfig} from './useWebSocket';
import {WebSocketMessageService} from '../services/websocket/messageService';
import {MessageHandler} from '../types/api';

export interface UseWebSocketMessagesConfig extends WebSocketConfig {
}

export const useWebSocketMessages = (config: UseWebSocketMessagesConfig) => {
    const messageServiceRef = useRef<WebSocketMessageService | null>(null);
    
    if (!messageServiceRef.current) {
        messageServiceRef.current = new WebSocketMessageService();
    }
    
    const messageService = messageServiceRef.current;
    const webSocket = useWebSocket(config);

    useEffect(() => {
        if (webSocket.lastMessage) {
            messageService.handleMessage(webSocket.lastMessage);
        }
    }, [webSocket.lastMessage, messageService]);

    const onMessage = useCallback(<T>(messageType: string, handler: MessageHandler<T>) => {
        return messageService.onMessage(messageType, handler);
    }, [messageService]);

    useEffect(() => {
        return () => {
            messageService.clearHandlers();
        };
    }, [messageService]);

    return {
        ...webSocket,
        onMessage,
        messageService: messageService,
    };
};

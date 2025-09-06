import {useCallback} from 'react';
import {useWebSocketMessages, UseWebSocketMessagesConfig} from './useWebSocketMessages';
import {MessageHandler} from '../types/api';

export interface UseGameMessagesConfig extends UseWebSocketMessagesConfig {
}

export const useGameMessages = (config: UseGameMessagesConfig) => {
    const webSocketMessages = useWebSocketMessages(config);

    const onMessage = useCallback(<T>(messageType: string, handler: MessageHandler<T>) => {
        return webSocketMessages.onMessage(messageType, handler);
    }, [webSocketMessages]);

    return {
        ...webSocketMessages,
        onMessage,
    };
};
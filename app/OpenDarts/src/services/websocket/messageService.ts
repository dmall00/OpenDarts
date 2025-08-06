import { WebSocketMessage, MessageHandler, MessageHandlers } from '../../types/api';

/**
 * Generic WebSocket message service for handling different types of messages
 */
export class WebSocketMessageService {
    private handlers: MessageHandlers = {};
    private globalHandlers: MessageHandler[] = [];

    /**
     * Register a handler for a specific message type
     */
    onMessage<T>(messageType: string, handler: MessageHandler<T>): () => void {
        this.handlers[messageType] = handler;
        
        // Return unsubscribe function
        return () => {
            delete this.handlers[messageType];
        };
    }

    /**
     * Register a global handler that receives all messages
     */
    onAnyMessage(handler: MessageHandler<any>): () => void {
        this.globalHandlers.push(handler);
        
        // Return unsubscribe function
        return () => {
            const index = this.globalHandlers.indexOf(handler);
            if (index > -1) {
                this.globalHandlers.splice(index, 1);
            }
        };
    }

    /**
     * Process incoming WebSocket message
     */
    handleMessage(message: MessageEvent): void {
        try {
            let parsedMessage: any;

            // Try to parse as JSON first
            try {
                parsedMessage = JSON.parse(message.data);
            } catch {
                // If parsing fails, treat as plain text or handle differently
                console.warn('Received non-JSON message:', message.data);
                this.notifyGlobalHandlers(message.data);
                return;
            }

            // Handle structured messages with type field
            if (parsedMessage.type) {
                this.handleTypedMessage(parsedMessage);
            } else {
                // Handle direct object messages (like DartTrackedTo)
                this.handleDirectMessage(parsedMessage);
            }

            // Notify global handlers
            this.notifyGlobalHandlers(parsedMessage);

        } catch (error) {
            console.error('Error processing WebSocket message:', error);
        }
    }

    private handleTypedMessage(message: WebSocketMessage): void {
        const handler = this.handlers[message.type];
        if (handler) {
            handler(message.data);
        } else {
            console.debug(`No handler registered for message type: ${message.type}`);
        }
    }

    private handleDirectMessage(message: any): void {
        // Try to infer message type from object structure
        const messageType = this.inferMessageType(message);
        if (messageType) {
            const handler = this.handlers[messageType];
            if (handler) {
                handler(message);
            }
        }
    }

    private inferMessageType(message: any): string | null {
        // Infer DartTrackedTo messages
        if (message.currentPlayer && 
            typeof message.remainingScore === 'number' && 
            message.trackedDart) {
            return 'dartTracked';
        }

        // Infer heartbeat/ping messages
        if (message.type === 'ping' || message.type === 'pong') {
            return message.type;
        }

        // Add more inference logic here for other message types
        return null;
    }

    private notifyGlobalHandlers(message: any): void {
        this.globalHandlers.forEach(handler => {
            try {
                handler(message);
            } catch (error) {
                console.error('Error in global message handler:', error);
            }
        });
    }

    /**
     * Clear all handlers
     */
    clearHandlers(): void {
        this.handlers = {};
        this.globalHandlers = [];
    }
}

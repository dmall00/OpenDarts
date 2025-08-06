import { WebSocketMessage, MessageHandler, MessageHandlers } from '../../types/api';

/**
 * Generic WebSocket message service for handling different types of messages
 */
export class WebSocketMessageService {
    private handlers: MessageHandlers = {};
    private globalHandlers: MessageHandler[] = [];
    private readonly instanceId: string;
    private messageQueue: any[] = [];

    constructor() {
        this.instanceId = Math.random().toString(36).substr(2, 9);
        console.log('🏗️ WebSocketMessageService instance created:', this.instanceId);
    }

    /**
     * Register a handler for a specific message type
     */
    onMessage<T>(messageType: string, handler: MessageHandler<T>): () => void {
        console.log('📝 Instance', this.instanceId, '- Registering handler for message type:', messageType);
        this.handlers[messageType] = handler;
        console.log('📝 Instance', this.instanceId, '- Current registered handlers:', Object.keys(this.handlers));

        this.processQueuedMessages(messageType);
        
        return () => {
            console.log('🗑️ Instance', this.instanceId, '- Unregistering handler for message type:', messageType);
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
        console.log('📥 Instance', this.instanceId, '- WebSocket message received:', message.data);
        try {
            let parsedMessage: any;

            // Try to parse as JSON first
            try {
                parsedMessage = JSON.parse(message.data);
                console.log('📋 Instance', this.instanceId, '- Parsed message:', parsedMessage);
            } catch {
                // If parsing fails, treat as plain text or handle differently
                console.warn('Instance', this.instanceId, '- Received non-JSON message:', message.data);
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
        const messageType = this.inferMessageType(message);

        if (messageType) {
            const handler = this.handlers[messageType];
            if (handler) {
                handler(message);
            } else {
                this.messageQueue.push({ type: messageType, message: message, timestamp: Date.now() });
            }
        } else {
            console.warn('Instance', this.instanceId, '- Could not infer message type for:', message);
        }
    }

    private processQueuedMessages(messageType: string): void {
        const handler = this.handlers[messageType];
        if (!handler) return;

        const messagesToProcess = this.messageQueue.filter(item => item.type === messageType);
        if (messagesToProcess.length > 0) {
            messagesToProcess.forEach(item => {
                handler(item.message);
            });
            
            this.messageQueue = this.messageQueue.filter(item => item.type !== messageType);
        }
    }

    private inferMessageType(message: any): string | null {
        if (message.currentPlayer &&
            typeof message.remainingScore === 'number' && 
            message.trackedDart) {
            return 'dartTracked';
        }
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

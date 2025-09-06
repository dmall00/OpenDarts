import {MessageHandler, MessageHandlers, WebSocketMessage} from '../../types/api';

export class WebSocketMessageService {
    private handlers: MessageHandlers = {};
    private readonly instanceId: string;
    private messageQueue: any[] = [];

    constructor() {
        this.instanceId = Math.random().toString(36).substr(2, 9);
    }

    onMessage<T>(messageType: string, handler: MessageHandler<T>): () => void {
        this.handlers[messageType] = handler;
        this.processQueuedMessages(messageType);
        
        return () => {
            delete this.handlers[messageType];
        };
    }

    handleMessage(message: MessageEvent): void {
        try {
            let parsedMessage: any;

            try {
                parsedMessage = JSON.parse(message.data);
            } catch {
                return;
            }

            if (parsedMessage.type) {
                this.handleTypedMessage(parsedMessage);
            } else {
                console.warn('Received message without type field:', parsedMessage);
            }

        } catch (error) {
            console.error('Error processing WebSocket message:', error);
        }
    }

    private handleTypedMessage(message: WebSocketMessage): void {
        const handler = this.handlers[message.type];
        if (handler) {
            handler(message.data);
        } else {
            this.messageQueue.push({type: message.type, message: message, timestamp: Date.now()});
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

    clearHandlers(): void {
        this.handlers = {};
    }
}

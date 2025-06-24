import {useWebSocket} from './useWebSocket';
import {WEBSOCKET_CONFIG} from '../config/config';

interface UseGameWebSocketProps {
    gameId: string;
    websocketUrl?: string;
    fps?: number;
}

export const useGameWebSocket = ({
                                     gameId,
                                     websocketUrl,
                                     fps = WEBSOCKET_CONFIG.DEFAULT_FPS
                                 }: UseGameWebSocketProps) => {
    const baseWsUrl = websocketUrl || WEBSOCKET_CONFIG.DEFAULT_URL;
    const wsUrl = `${baseWsUrl}/${gameId}`;

    const webSocket = useWebSocket({
        url: wsUrl,
        fps,
        autoConnect: true,
        reconnectAttempts: WEBSOCKET_CONFIG.RECONNECT_ATTEMPTS,
        reconnectDelay: WEBSOCKET_CONFIG.RECONNECT_DELAY,
        heartbeatInterval: WEBSOCKET_CONFIG.HEARTBEAT_INTERVAL,
    });

    return webSocket;
};

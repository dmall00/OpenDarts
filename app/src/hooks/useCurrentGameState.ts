import {useEffect, useRef, useState} from 'react';
import {useGameMessages} from './useGameMessages';
import {CalibrationResponse, CurrentGameStateResponse} from '../types/api';
import {getCameraConfig, getWebSocketConfig} from "@/src/config/config";
import {AutoScoreMessage, generateTraceId} from '@/src/utils/binaryProtocol';

interface UseCurrentGameStateProps {
    gameId: string;
    playerId: string;
    websocketUrl?: string;
    fps?: number;
    currentGameStatePartial: Partial<CurrentGameStateResponse>;
    setCurrentGameState: (currentGameState: Partial<CurrentGameStateResponse>) => void;
    autoConnect?: boolean;
}

export const useCurrentGameState = ({
                                           gameId,
                                           playerId,
                                           websocketUrl,
                                        fps = getCameraConfig().DEFAULT_FPS,
                                        currentGameStatePartial,
                                        setCurrentGameState,
                                           autoConnect = true
                                    }: UseCurrentGameStateProps) => {


    const [calibrated, setCalibrated] = useState(false);
    const frameCounterRef = useRef(0);

    let wsUrl: string;
    if (websocketUrl) {
        wsUrl = websocketUrl;
    } else {
        wsUrl = `${getWebSocketConfig().DEFAULT_BASE_URL}/ws/app/${gameId}`;
    }

    const gameMessages = useGameMessages({
        url: wsUrl,
        fps,
        autoConnect,
        reconnectAttempts: getWebSocketConfig().RECONNECT_ATTEMPTS,
        reconnectDelay: getWebSocketConfig().RECONNECT_DELAY,
        heartbeatInterval: getWebSocketConfig().HEARTBEAT_INTERVAL,
    });

    useEffect(() => {
        return gameMessages.onMessage<CurrentGameStateResponse>('dartProcessedResult', (data) => {
            console.log('Dart processed:', data);
            setCurrentGameState(data);
        });
    }, [gameMessages]);

    useEffect(() => {
        return gameMessages.onMessage<CurrentGameStateResponse>('turnSwitch', (data) => {
            console.log('Turn switch received');
            setCurrentGameState(data);
        });
    }, [gameMessages]);

    useEffect(() => {
        return gameMessages.onMessage<CalibrationResponse>('calibration', (data) => {
            console.log('Calibration:', data);
            setCalibrated(data.calibrated);
        })
    })

    const sendCameraFrame = async (imageData: string | ArrayBuffer | Blob) => {
        let data = imageData;
        
        if (imageData instanceof Blob) {
            data = await new Promise<ArrayBuffer>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (reader.result instanceof ArrayBuffer) {
                        resolve(reader.result);
                    } else {
                        reject(new Error('Failed to convert Blob to ArrayBuffer'));
                    }
                };
                reader.onerror = reject;
                reader.readAsArrayBuffer(imageData);
            });
        }
        
        if (data instanceof ArrayBuffer) {
            const traceId = generateTraceId();
            const autoScoreMessage: AutoScoreMessage = {
                timestamp: Date.now(),
                playerId: playerId,
                traceId: traceId
            };

            console.log('Sending image frame to websocket server', {
                timestamp: new Date().toISOString(),
                imageSize: data.byteLength,
                traceId: traceId
            });
            
            return gameMessages.sendBinary(data, autoScoreMessage);
        }
        return gameMessages.sendBinary(data);
    };

    return {
        ...gameMessages,
        calibrated,
        sendCameraFrame,
    };
};
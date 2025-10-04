import {useEffect, useRef, useState} from 'react';
import {useGameMessages} from './useGameMessages';
import {CalibrationState, CurrentGameState} from '../types/api';
import {getCameraConfig, getWebSocketConfig} from "@/src/config/config";
import {AutoScoreMessage} from '@/src/utils/binaryProtocol';

interface UseCurrentGameStateProps {
    gameId: string;
    playerId: string;
    websocketUrl?: string;
    fps?: number;
    currentGameStatePartial: Partial<CurrentGameState>;
    setCurrentGameState: (currentGameState: Partial<CurrentGameState>) => void;
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
        wsUrl = `${getWebSocketConfig().DEFAULT_BASE_URL}/ws/app/${playerId}/${gameId}`;
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
        return gameMessages.onMessage<CurrentGameState>('dartProcessedResult', (data) => {
            console.log('Dart processed:', data);
            setCurrentGameState(data);
        });
    }, [gameMessages]);

    useEffect(() => {
        return gameMessages.onMessage<CurrentGameState>('turnSwitch', (data) => {
            console.log('Turn switch received');
            setCurrentGameState(data);
        });
    }, [gameMessages]);

    useEffect(() => {
        return gameMessages.onMessage<CalibrationState>('calibration', (data) => {
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
            const autoScoreMessage: AutoScoreMessage = {
                timestamp: Date.now(),
            };
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
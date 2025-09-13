import {useEffect, useState} from 'react';
import {useGameMessages} from './useGameMessages';
import {CalibrationState, CurrentGameState} from '../types/api';
import {getCameraConfig, getWebSocketConfig} from "@/src/config/config";

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

    const sendCameraFrame = (imageData: string | ArrayBuffer | Blob) => {
        return gameMessages.sendBinary(imageData);
    };

    return {
        ...gameMessages,
        calibrated,
        sendCameraFrame,
    };
};
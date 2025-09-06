import {useEffect, useState} from 'react';
import {useGameMessages} from './useGameMessages';
import {CalibrationState, DartProcessedResult} from '../types/api';
import {WEBSOCKET_CONFIG} from '../config/config';

interface UseDartProcessedResultProps {
    gameId: string;
    playerId: string;
    websocketUrl?: string;
    fps?: number;
}

export const useDartProcessedResult = ({
                                           gameId,
                                           playerId,
                                           websocketUrl,
                                           fps = WEBSOCKET_CONFIG.DEFAULT_FPS,
                                       }: UseDartProcessedResultProps) => {
    const [dartProcessedResult, setDartProcessedResult] = useState<Partial<DartProcessedResult>>({
        remainingScore: 0,
        currentTurnDarts: [],
    });

    const [calibrated, setCalibrated] = useState(false);

    let wsUrl: string;
    if (websocketUrl) {
        wsUrl = websocketUrl;
    } else {
        wsUrl = `${WEBSOCKET_CONFIG.DEFAULT_BASE_URL}/ws/app/${playerId}/${gameId}`;
    }

    const gameMessages = useGameMessages({
        url: wsUrl,
        fps,
        autoConnect: true,
        reconnectAttempts: WEBSOCKET_CONFIG.RECONNECT_ATTEMPTS,
        reconnectDelay: WEBSOCKET_CONFIG.RECONNECT_DELAY,
        heartbeatInterval: WEBSOCKET_CONFIG.HEARTBEAT_INTERVAL,
    });

    useEffect(() => {
        return gameMessages.onMessage<DartProcessedResult>('dartProcessedResult', (data) => {
            console.log('Dart processed:', data);
            setDartProcessedResult(data);
        });
    }, [gameMessages]);

    useEffect(() => {
        return gameMessages.onMessage<any>('turnSwitch', (newData) => {
            console.log('Turn switch received');
            setDartProcessedResult({
                currentTurnDarts: [],
                remainingScore: dartProcessedResult.remainingScore
            });
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
        dartProcessedResult,
        calibrated,
        sendCameraFrame,
    };
};
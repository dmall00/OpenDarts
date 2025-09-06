import {useCallback, useEffect, useRef, useState} from 'react';
import {AppState, Platform} from 'react-native';
import {CameraService} from '../services/camera/cameraService';
import {CAMERA_CONFIG} from '../config/config';
import {useGameStore} from "@/src/stores/gameStore";
import {isWeb} from "@/src/utils/platform";

interface UseGameCaptureProps {
    isConnected: boolean;
    sendBinary: (data: string | ArrayBuffer | Blob) => boolean;
    startCapture: (callback: () => Promise<void>) => void;
    stopCapture: () => void;
    isCameraActive?: boolean;
}

export const useGameCapture = ({
                                   isConnected,
                                   sendBinary,
                                   startCapture,
                                   stopCapture,
                                   isCameraActive
                               }: UseGameCaptureProps) => {
    const [isCapturing, setIsCapturing] = useState(false);
    const isAutoScoreEnabled = useGameStore((state) => state.isAutoScoreEnabled);
    const hasStartedRecording = useRef(false);

    const cameraService = CameraService.getInstance();

    const shouldCapture = isCameraActive !== undefined ? isCameraActive : isAutoScoreEnabled;

    const handleCameraCapture = useCallback(async () => {
        try {
            await cameraService.captureAndSend(
                sendBinary,
                {
                    quality: CAMERA_CONFIG.DEFAULT_QUALITY,
                    skipProcessing: CAMERA_CONFIG.SKIP_PROCESSING,
                }
            );
        } catch (error) {
            console.error('Camera capture error:', error);
        }
    }, [sendBinary, cameraService]);

    const startCaptureWhenReady = useCallback(() => {
        if (cameraService.isCameraReady()) {
            console.log('Camera is ready, starting video stream capture...');
            if (!hasStartedRecording.current) {
                cameraService.startVideoRecording();
                hasStartedRecording.current = true;
            }
            startCapture(handleCameraCapture);
        } else {
            if (shouldCapture) {
                setTimeout(startCaptureWhenReady, 500);
            }
        }
    }, [cameraService, startCapture, handleCameraCapture, shouldCapture]);

    const stopCaptureAndRecording = useCallback(() => {
        console.log('Stopping capture and recording...');
        setIsCapturing(false);
        cameraService.stopVideoRecording();
        hasStartedRecording.current = false;
        stopCapture();
    }, [cameraService, stopCapture]);

    useEffect(() => {
        if (isConnected && shouldCapture && !isWeb()) {
            if (!isCapturing) {
                console.log('Starting capture process...');
                setIsCapturing(true);
                setTimeout(startCaptureWhenReady, 1000);
            }
        } else if ((!shouldCapture || isWeb() || !isConnected) && isCapturing) {
            console.log('Stopping capture process...', {shouldCapture, isWeb: isWeb(), isConnected, isCapturing});
            stopCaptureAndRecording();
        }

        return () => {
            console.log('Cleaning up capture process...');
            stopCapture();
            cameraService.stopVideoRecording();
        };
    }, [isConnected, isCapturing, shouldCapture]);

    useEffect(() => {
        const handleAppStateChange = (nextAppState: string) => {
            const isWebPlatform = Platform.OS === 'web';
            
            if (nextAppState === 'background') {
                console.log('App going to background, pausing capture...');
                stopCaptureAndRecording();
            } else if (nextAppState === 'active' && isConnected && shouldCapture && !isWebPlatform) {
                console.log('App became active, resuming capture...');
                setTimeout(() => {
                    if (cameraService.isCameraReady()) {
                        startCaptureWhenReady();
                        setIsCapturing(true);
                    }
                }, 1000);
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, [isConnected, shouldCapture, startCaptureWhenReady, cameraService, stopCaptureAndRecording]);

    return {
        isCapturing,
        handleCameraCapture
    };
};

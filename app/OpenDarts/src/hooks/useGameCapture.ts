import {useCallback, useEffect, useState} from 'react';
import {AppState} from 'react-native';
import {CameraService} from '../services/camera/cameraService';
import {CAMERA_CONFIG} from '../config/config';

interface UseGameCaptureProps {
    isConnected: boolean;
    sendBinary: (data: string | ArrayBuffer | Blob) => boolean;
    startCapture: (callback: () => Promise<void>) => void;
    stopCapture: () => void;
}

export const useGameCapture = ({
                                   isConnected,
                                   sendBinary,
                                   startCapture,
                                   stopCapture
                               }: UseGameCaptureProps) => {
    const [isCapturing, setIsCapturing] = useState(false);
    const cameraService = CameraService.getInstance();

    const handleCameraCapture = useCallback(async () => {
        try {
            console.log('Camera frame capture starting...');
            const success = await cameraService.captureAndSend(
                sendBinary,
                {
                    quality: CAMERA_CONFIG.DEFAULT_QUALITY,
                    skipProcessing: CAMERA_CONFIG.SKIP_PROCESSING,
                }
            );

            if (!success) {
                console.warn('Failed to capture and send camera frame');
            } else {
                console.log('Camera frame captured and sent successfully');
            }
        } catch (error) {
            console.error('Camera capture error:', error);
        }
    }, [sendBinary, cameraService]);

    const startCaptureWhenReady = useCallback(() => {
        if (cameraService.isCameraReady()) {
            console.log('Camera is ready, starting video stream capture...');
            cameraService.startVideoRecording();
            startCapture(handleCameraCapture);
        } else {
            console.log('Camera not ready yet, waiting...');
            setTimeout(startCaptureWhenReady, 500);
        }
    }, [cameraService, startCapture, handleCameraCapture]);

    const stopCaptureAndRecording = useCallback(() => {
        console.log('Stopping capture...');
        setIsCapturing(false);
        cameraService.stopVideoRecording();
        stopCapture();
    }, [cameraService, stopCapture]);

    useEffect(() => {
        console.log('GameCapture useEffect - isConnected:', isConnected, 'isCapturing:', isCapturing);

        if (isConnected && !isCapturing) {
            console.log('Starting capture with delay...');
            setIsCapturing(true);
            setTimeout(startCaptureWhenReady, 1000);
        } else if (!isConnected && isCapturing) {
            stopCaptureAndRecording();
        }

        return () => {
            stopCapture();
            cameraService.stopVideoRecording();
        };
    }, [isConnected, isCapturing, startCaptureWhenReady, stopCaptureAndRecording]);

    useEffect(() => {
        const handleAppStateChange = (nextAppState: string) => {
            console.log('App state changed to:', nextAppState);

            if (nextAppState === 'background') {
                console.log('App going to background, pausing capture...');
                stopCaptureAndRecording();
            } else if (nextAppState === 'active' && isConnected) {
                console.log('App became active, resuming capture...');
                setTimeout(() => {
                    if (cameraService.isCameraReady()) {
                        cameraService.startVideoRecording();
                        startCapture(handleCameraCapture);
                        setIsCapturing(true);
                    }
                }, 1000);
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, [isConnected, startCapture, handleCameraCapture, cameraService, stopCaptureAndRecording]);

    return {
        isCapturing,
        handleCameraCapture
    };
};

import React, {useCallback, useEffect, useState} from "react";
import {Alert, AppState, View} from "react-native";
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import ZoomCameraView from "./ZoomCameraView";
import ConnectionStatus from "./ConnectionStatus";
import Header from "../common/Header";
import {GameViewStyles} from "../../styles/GameViewStyles";
import {GlobalStyles} from "../../styles/GlobalStyles";
import {useWebSocket} from "../../hooks/useWebSocket";
import {CameraService} from "../../services/camera/cameraService";
import {CAMERA_CONFIG, WEBSOCKET_CONFIG} from "../../config/config";
import HeaderText from "@/src/components/common/HeaderText";

interface GameViewProps {
    gameId: string;
    websocketUrl?: string;
    fps?: number;
}

export default function GameView({gameId, websocketUrl, fps = WEBSOCKET_CONFIG.DEFAULT_FPS}: GameViewProps) {
    const [isCameraExpanded, setIsCameraExpanded] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const insets = useSafeAreaInsets();
    const cameraService = CameraService.getInstance();

    const wsUrl = websocketUrl || WEBSOCKET_CONFIG.DEFAULT_URL;
    const webSocket = useWebSocket({
        url: wsUrl,
        fps,
        autoConnect: true,
        reconnectAttempts: WEBSOCKET_CONFIG.RECONNECT_ATTEMPTS,
        reconnectDelay: WEBSOCKET_CONFIG.RECONNECT_DELAY,
        heartbeatInterval: WEBSOCKET_CONFIG.HEARTBEAT_INTERVAL,
    });
    const handleCameraCapture = useCallback(async () => {
        try {
            console.log('Camera frame capture starting...');
            const success = await cameraService.captureAndSend(
                webSocket.sendBinary,
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
    }, [webSocket.sendBinary, cameraService]);
    useEffect(() => {
        console.log('GameView useEffect - isConnected:', webSocket.isConnected, 'isCapturing:', isCapturing);
        if (webSocket.isConnected && !isCapturing) {
            console.log('Starting capture with delay...');
            setIsCapturing(true);

            const startCaptureWhenReady = () => {
                if (cameraService.isCameraReady()) {
                    console.log('Camera is ready, starting video stream capture...');
                    cameraService.startVideoRecording();
                    webSocket.startCapture(handleCameraCapture);
                } else {
                    console.log('Camera not ready yet, waiting...');
                    setTimeout(startCaptureWhenReady, 500);
                }
            };

            setTimeout(startCaptureWhenReady, 1000);
        } else if (!webSocket.isConnected && isCapturing) {
            console.log('Stopping capture...');
            setIsCapturing(false);
            cameraService.stopVideoRecording();
            webSocket.stopCapture();
        }

        return () => {
            webSocket.stopCapture();
            cameraService.stopVideoRecording();
        };
    }, [webSocket.isConnected, isCapturing, webSocket.startCapture, webSocket.stopCapture, handleCameraCapture, cameraService]);

    useEffect(() => {
        const handleAppStateChange = (nextAppState: string) => {
            console.log('App state changed to:', nextAppState);
            if (nextAppState === 'background') {
                console.log('App going to background, pausing capture...');
                setIsCapturing(false);
                cameraService.stopVideoRecording();
                webSocket.stopCapture();
            } else if (nextAppState === 'active' && webSocket.isConnected) {
                console.log('App became active, resuming capture...');
                setTimeout(() => {
                    if (cameraService.isCameraReady()) {
                        cameraService.startVideoRecording();
                        webSocket.startCapture(handleCameraCapture);
                        setIsCapturing(true);
                    }
                }, 1000);
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, [webSocket.isConnected, webSocket.startCapture, webSocket.stopCapture, handleCameraCapture, cameraService]);

    useEffect(() => {
        if (webSocket.error) {
            Alert.alert('Connection Error', webSocket.error);
        }
    }, [webSocket.error]);

    const handleToggleCamera = () => {
        setIsCameraExpanded(!isCameraExpanded);
    };
    const handleReconnect = () => {
        webSocket.connect();
    };
    return (
        <View style={GlobalStyles.containerWithHeader}>
            <Header>
                <HeaderText title="OpenDarts"></HeaderText>
            </Header>

            <View style={GlobalStyles.headerContentContainer}>
                <ConnectionStatus
                    isConnected={webSocket.isConnected}
                    isConnecting={webSocket.isConnecting}
                    onReconnect={handleReconnect}
                />

                <View style={GameViewStyles.cameraContainer}>
                    {isCameraExpanded && (
                        <ZoomCameraView
                            isExpanded={isCameraExpanded}
                            onToggleExpand={handleToggleCamera}
                        />
                    )}
                </View> {!isCameraExpanded && (
                <ZoomCameraView
                    isExpanded={isCameraExpanded} onToggleExpand={handleToggleCamera}
                />
            )}
            </View>
        </View>
    );
}

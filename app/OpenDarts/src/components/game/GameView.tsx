import React from "react";
import {View} from "react-native";
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import CameraSection from "./CameraSection";
import {GlobalStyles} from "../../styles/GlobalStyles";
import {useGameWebSocket} from "../../hooks/useGameWebSocket";
import {useGameCapture} from "../../hooks/useGameCapture";
import {useCameraUI} from "../../hooks/useCameraUI";
import {useErrorHandler} from "../../hooks/useErrorHandler";
import InGameHeader from "@/src/components/game/InGameHeader";

interface GameViewProps {
    gameId: string;
    websocketUrl?: string;
    fps?: number;
}

export default function GameView({gameId, websocketUrl, fps}: GameViewProps) {
    const insets = useSafeAreaInsets();

    const webSocket = useGameWebSocket({gameId, websocketUrl, fps});
    const {isCameraExpanded, handleToggleCamera} = useCameraUI();
    useGameCapture({
        isConnected: webSocket.isConnected,
        sendBinary: webSocket.sendBinary,
        startCapture: webSocket.startCapture,
        stopCapture: webSocket.stopCapture
    });
    useErrorHandler(webSocket.error);
    const handleReconnect = () => {
        webSocket.connect();
    };
    return (
        <View style={GlobalStyles.containerWithHeader}>

            <InGameHeader isConnected={webSocket.isConnected} isConnecting={webSocket.isConnecting}
                          handleReconnect={handleReconnect}/>

            <View style={GlobalStyles.headerContentContainer}>
                <CameraSection
                    isCameraExpanded={isCameraExpanded}
                    onToggleCamera={handleToggleCamera}
                />
            </View>
        </View>
    );
}

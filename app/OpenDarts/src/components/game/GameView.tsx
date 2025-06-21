import React from "react";
import {View} from "react-native";
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import ConnectionStatus from "./ConnectionStatus";
import CameraSection from "./CameraSection";
import Header from "../common/Header";
import {GlobalStyles} from "../../styles/GlobalStyles";
import {HeaderStyles} from "../../styles/HeaderStyles";
import {useGameWebSocket} from "../../hooks/useGameWebSocket";
import {useGameCapture} from "../../hooks/useGameCapture";
import {useCameraUI} from "../../hooks/useCameraUI";
import {useErrorHandler} from "../../hooks/useErrorHandler";
import HeaderText from "@/src/components/common/HeaderText";

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
            <Header>
                <View style={HeaderStyles.leftContent}>
                    <ConnectionStatus
                        isConnected={webSocket.isConnected}
                        isConnecting={webSocket.isConnecting}
                        onReconnect={handleReconnect}
                    />
                </View>
                <View style={HeaderStyles.centerContent}>
                    <HeaderText title="OpenDarts"/>
                </View>
                <View style={HeaderStyles.rightContent}>
                </View>
            </Header>

            <View style={GlobalStyles.headerContentContainer}>
                <CameraSection
                    isCameraExpanded={isCameraExpanded}
                    onToggleCamera={handleToggleCamera}
                />
            </View>
        </View>
    );
}

import React from "react";
import {View} from "react-native";
import CameraSection from "./CameraSection";
import {GlobalStyles} from "../../styles/GlobalStyles";
import {useGameWebSocket} from "../../hooks/useGameWebSocket";
import {useGameCapture} from "../../hooks/useGameCapture";
import {useErrorHandler} from "../../hooks/useErrorHandler";
import InGameHeader from "@/src/components/game/InGameHeader";
import ScoreView from "@/src/components/game/ScoreView";
import {useGameStore} from "@/src/stores/gameStore";

interface GameViewProps {
    gameId: string;
    websocketUrl?: string;
    fps?: number;
}

export default function GameView({gameId, websocketUrl, fps}: GameViewProps) {
    const isAutoScoreEnabled = useGameStore((state) => state.isAutoScoreEnabled);

    const webSocket = useGameWebSocket({gameId, websocketUrl, fps});

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
                          handleReconnect={handleReconnect}/> <View style={GlobalStyles.headerContentContainer}>

            <ScoreView/>

            {isAutoScoreEnabled && <CameraSection/>}
        </View>
        </View>
    );
}

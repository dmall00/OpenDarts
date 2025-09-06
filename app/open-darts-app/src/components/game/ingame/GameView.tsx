import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { useGameStore } from "@/src/stores/gameStore";
import InGameHeader from "@/src/components/game/header/InGameHeader";
import { useErrorHandler } from "@/src/hooks/useErrorHandler";
import { useGameCapture } from "@/src/hooks/useGameCapture";
import { useDartProcessedResult } from "@/src/hooks/useDartProcessedResult";
import X01ScoreView from "@/src/components/game/ingame/score/X01ScoreView";
import { useCameraUI } from "@/src/hooks/useCameraUI";
import ZoomCameraView from "@/src/components/game/autoscore/ZoomCameraView";
import DartInput from "@/src/components/game/ingame/input/DartInput";

interface GameViewProps {
    gameId: string;
    playerId: string;
    websocketUrl?: string;
    fps?: number;
}

export default function GameView({ gameId, playerId, websocketUrl, fps }: GameViewProps) {
    const isAutoScoreEnabled = useGameStore((state) => state.isAutoScoreEnabled);
    const { isCameraExpanded, handleToggleCamera } = useCameraUI();
    const [modifier, setModifier] = useState<'single' | 'double' | 'triple'>('single');

    const {
        isConnected,
        isConnecting,
        error,
        connect,
        sendCameraFrame,
        startCapture,
        stopCapture,
        dartProcessedResult,
        calibrated
    } = useDartProcessedResult({
        gameId,
        playerId,
        websocketUrl,
    });

    useGameCapture({
        isConnected,
        sendBinary: sendCameraFrame,
        startCapture,
        stopCapture,
        isCameraActive: isAutoScoreEnabled
    });

    useErrorHandler(error);

    const handleReconnect = () => {
        connect();
    };

    // Event handlers
    const handleNumberPress = (value: number) => {
        console.log(`Number pressed: ${value} with modifier: ${modifier}`);
        // Reset modifier after use
        setModifier('single');
    };

    const handleDoublePress = () => {
        console.log("Double modifier toggled");
        setModifier(prev => prev === 'double' ? 'single' : 'double');
    };

    const handleTriplePress = () => {
        console.log("Triple modifier toggled");
        setModifier(prev => prev === 'triple' ? 'single' : 'triple');
    };

    const handleBackPress = () => {
        console.log("Back button pressed");
    };

    return (
        <View className="flex-1 bg-background">
            <InGameHeader
                isConnected={isConnected}
                isConnecting={isConnecting}
                handleReconnect={handleReconnect}
                isAutoScoreEnabled={isAutoScoreEnabled}
                isCameraExpanded={isCameraExpanded}
                onToggleCamera={handleToggleCamera}
                calibrated={calibrated}
            />

            <View className="flex-1">
                <ScrollView
                    className="flex-1"
                    contentContainerClassName="pb-5 pt-5"
                    showsVerticalScrollIndicator={false}
                >
                    <X01ScoreView dartProcessedResult={dartProcessedResult} />
                </ScrollView>

                <View className="absolute bottom-0 w-full">
                    <DartInput
                        onNumberPress={handleNumberPress}
                        onDoublePress={handleDoublePress}
                        onTriplePress={handleTriplePress}
                        onBackPress={handleBackPress}
                        modifier={modifier}
                    />
                </View>
            </View>

            {isAutoScoreEnabled && (
                <ZoomCameraView
                    onClose={handleToggleCamera}
                    isVisible={isCameraExpanded}
                />
            )}
        </View>
    );
}
import React, {useEffect, useState} from "react";
import {ScrollView, View} from "react-native";
import {useGameStore} from "@/src/stores/gameStore";
import InGameHeader from "@/src/components/game/header/InGameHeader";
import {useErrorHandler} from "@/src/hooks/useErrorHandler";
import {useGameCapture} from "@/src/hooks/useGameCapture";
import {useCurrentGameState} from "@/src/hooks/useCurrentGameState";
import X01ScoreView from "@/src/components/game/ingame/score/X01ScoreView";
import {useCameraUI} from "@/src/hooks/useCameraUI";
import ZoomCameraView from "@/src/components/game/autoscore/ZoomCameraView";
import DartInput from "@/src/components/game/ingame/input/DartInput";
import {useMutation} from "@/src/hooks/useMutation";
import {CurrentGameState, DartCorrectionRequest, DartRevertRequest, DartThrow, DartThrowResponse} from "@/src/types/api";
import {gameService} from "@/src/services/game/gameService";

interface GameViewProps {
    gameId: string;
    playerId: string;
    websocketUrl?: string;
    fps?: number;
}

export default function GameView({gameId, playerId, websocketUrl, fps}: GameViewProps) {
    const isAutoScoreEnabled = useGameStore((state) => state.isAutoScoreEnabled);
    const {isCameraExpanded, handleToggleCamera} = useCameraUI();
    const [modifier, setModifier] = useState<1 | 2 | 3>(1);
    const [selectedDartForCorrection, setSelectedDartForCorrection] = useState<DartThrowResponse | null>(null);

    const [currentGameState, setCurrentGameState] = useState<Partial<CurrentGameState>>({
        currentRemainingScores: {},
        currentTurnDarts: {},
    });

    const {
        isConnected,
        isConnecting,
        error,
        connect,
        disconnect,
        sendCameraFrame,
        startCapture,
        stopCapture,
        calibrated
    } = useCurrentGameState({
        gameId,
        playerId,
        websocketUrl,
        setCurrentGameState: setCurrentGameState,
        currentGameStatePartial: currentGameState,
        autoConnect: isAutoScoreEnabled
    });

    useGameCapture({
        isConnected,
        sendBinary: sendCameraFrame,
        startCapture,
        stopCapture,
        isCameraActive: isAutoScoreEnabled
    });

    useErrorHandler(error);

    useEffect(() => {
        if (isAutoScoreEnabled && !isConnected && !isConnecting) {
            connect();
        } else if (!isAutoScoreEnabled && (isConnected || isConnecting)) {
            disconnect();
        }
    }, [isAutoScoreEnabled, isConnected, isConnecting, connect, disconnect]);

    const handleReconnect = () => {
        connect();
    };

    const throwDartMutation = useMutation(
        (dartThrow: DartThrow) => gameService.trackDart(playerId, gameId, dartThrow),
        {
            onSuccess: (dartProcessed) => {
                setCurrentGameState(dartProcessed);
            },
            onError: (error) => {
                console.error('Failed to send dart:', error);
            }
        }
    );

    const revertDartMutation = useMutation(
        (revertRequest: DartRevertRequest) => gameService.revertDart(playerId, gameId, revertRequest),
        {
            onSuccess: (currentGameState) => {
                setCurrentGameState(currentGameState);
            },
            onError: (error) => {
                console.error('Failed to revert dart:', error);
            }
        }
    );

    const correctDartMutation = useMutation(
        (correctionRequest: DartCorrectionRequest) => gameService.correctDart(playerId, gameId, correctionRequest),
        {
            onSuccess: (currentGameState) => {
                console.log('Correction success, new darts:', currentGameState.currentTurnDarts?.[playerId]);
                setCurrentGameState(currentGameState);
                setSelectedDartForCorrection(null);
                setModifier(1);
            },
            onError: (error) => {
                console.error('Failed to correct dart:', error);
                setSelectedDartForCorrection(null);
                setModifier(1);
            }
        }
    );

    const fetchGameStateMutation = useMutation(
        () => gameService.getCurrentGameState(gameId),
        {
            onSuccess: (currentGameState) => {
                setCurrentGameState(currentGameState);
            },
            onError: (error) => {
                console.error('Failed to fetch game state:', error);
            }
        }
    );

    useEffect(() => {
        fetchGameStateMutation.mutate(undefined);
    }, [gameId]);

    const handleNumberPress = async (value: number) => {
        if (selectedDartForCorrection) {
            console.log('Correcting dart:', selectedDartForCorrection.id, 'to score:', value, 'multiplier:', modifier);
            const correctionRequest: DartCorrectionRequest = {
                dartId: selectedDartForCorrection.id,
                score: value,
                multiplier: modifier
            };
            await correctDartMutation.mutate(correctionRequest);
        } else {
            console.log(`Number pressed: ${value} with modifier: ${modifier}`);
            const dartThrow: DartThrow = {
                score: value, multiplier: modifier
            }
            await throwDartMutation.mutate(dartThrow);
            setModifier(1);
        }
    };

    const handleDoublePress = () => {
        console.log("Double modifier toggled");
        setModifier(prev => prev === 2 ? 1 : 2);
    };

    const handleTriplePress = () => {
        console.log("Triple modifier toggled");
        setModifier(prev => prev === 3 ? 1 : 3);
    };

    const handleBackPress = async () => {
        if (selectedDartForCorrection) {
            setSelectedDartForCorrection(null);
            setModifier(1);
        } else {
            console.log("Back button pressed");
            let currentPlayerDarts = currentGameState.currentTurnDarts?.[playerId];
            if (currentPlayerDarts && currentPlayerDarts.length > 0) {
                let id = currentPlayerDarts[currentPlayerDarts.length - 1].id;
                const revertRequest: DartRevertRequest = {
                    id: id
                }
                console.log("Revert request", revertRequest);
                await revertDartMutation.mutate(revertRequest)
            }
        }
    };

    const handleDartPress = (dart: DartThrowResponse) => {
        console.log('Dart pressed:', dart.id, 'selectedDartId:', selectedDartForCorrection?.id);
        if (selectedDartForCorrection?.id === dart.id) {
            console.log('Deselecting dart');
            setSelectedDartForCorrection(null);
            setModifier(1);
        } else {
            console.log('Selecting dart for correction');
            setSelectedDartForCorrection(dart);
            setModifier(dart.multiplier as 1 | 2 | 3);
        }
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
                    <X01ScoreView 
                        currentGameStatePartial={currentGameState} 
                        playerId={playerId}
                        onDartPress={handleDartPress}
                        selectedDartId={selectedDartForCorrection?.id ?? null}
                    />
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
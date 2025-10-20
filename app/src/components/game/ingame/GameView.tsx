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
import Typography from "@/src/components/ui/Typography";
import {
    CurrentGameStateResponse,
    DartCorrectionRequest,
    DartRevertRequest,
    DartThrowRequest,
    DartThrowResponse
} from "@/src/types/api";
import {gameService} from "@/src/services/game/gameService";
import {manualScoringService, PendingDart} from "@/src/services/game/manualScoringService";

interface GameViewProps {
    gameId: string;
    websocketUrl?: string;
    fps?: number;
}

export default function GameView({gameId, websocketUrl, fps}: GameViewProps) {
    const isAutoScoreEnabled = useGameStore((state) => state.isAutoScoreEnabled);
    const {isCameraExpanded, handleToggleCamera} = useCameraUI();
    const [modifier, setModifier] = useState<1 | 2 | 3>(1);
    const [selectedDartForCorrection, setSelectedDartForCorrection] = useState<DartThrowResponse | null>(null);
    const [selectedPendingDartIndex, setSelectedPendingDartIndex] = useState<number | null>(null);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [manualScoringState, setManualScoringState] = useState(manualScoringService.getState());

    const [currentGameState, setCurrentGameState] = useState<Partial<CurrentGameStateResponse>>({
        currentRemainingScores: {},
        currentTurnDarts: {},
    });

    const fetchGameStateMutation = useMutation(
        () => gameService.getCurrentGameState(gameId),
        {
            onSuccess: (gameState) => {
                setCurrentGameState(gameState);
                if (gameState.currentPlayer?.id) {
                    setPlayerId(gameState.currentPlayer.id);
                    const currentScore = gameState.currentRemainingScores?.[gameState.currentPlayer.id] ?? 0;
                    manualScoringService.syncWithBackendState(gameState, gameState.currentPlayer.id);
                    setManualScoringState(manualScoringService.getState());
                }
            },
            onError: (error) => {
                console.error('Failed to fetch game state:', error);
            }
        }
    );

    useEffect(() => {
        fetchGameStateMutation.mutate(undefined);
    }, [gameId]);

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
        playerId: playerId || '',
        websocketUrl,
        setCurrentGameState: setCurrentGameState,
        currentGameStatePartial: currentGameState,
        autoConnect: isAutoScoreEnabled && playerId !== null
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
        (dartThrow: DartThrowRequest) => {
            if (!playerId) throw new Error('Player ID not set');
            return gameService.trackDart(playerId, gameId, dartThrow);
        },
        {
            onSuccess: (dartProcessed) => {
                setCurrentGameState(dartProcessed);
                if (playerId) {
                    manualScoringService.syncWithBackendState(dartProcessed, playerId);
                    setManualScoringState(manualScoringService.getState());
                }
            },
            onError: (error) => {
                console.error('Failed to send dart:', error);
            }
        }
    );

    const revertDartMutation = useMutation(
        (revertRequest: DartRevertRequest) => {
            if (!playerId) throw new Error('Player ID not set');
            return gameService.revertDart(playerId, gameId, revertRequest);
        },
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
        (correctionRequest: DartCorrectionRequest) => {
            if (!playerId) throw new Error('Player ID not set');
            return gameService.correctDart(playerId, gameId, correctionRequest);
        },
        {
            onSuccess: (currentGameState) => {
                if (playerId) {
                    console.log('Correction success, new darts:', currentGameState.currentTurnDarts?.[playerId]);
                }
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

    const completeTurnMutation = useMutation(
        (darts: DartThrowRequest[]) => {
            if (!playerId) throw new Error('Player ID not set');
            return gameService.completeTurn(playerId, gameId, darts);
        },
        {
            onSuccess: (currentGameState) => {
                setCurrentGameState(currentGameState);
                manualScoringService.clear();
                if (currentGameState.currentPlayer?.id) {
                    setPlayerId(currentGameState.currentPlayer.id);
                    manualScoringService.syncWithBackendState(currentGameState, currentGameState.currentPlayer.id);
                }
                setManualScoringState(manualScoringService.getState());
            },
            onError: (error) => {
                console.error('Failed to complete turn:', error);
            }
        }
    );

    const handleNumberPress = async (value: number) => {
        if (selectedDartForCorrection && isAutoScoreEnabled) {
            console.log('Correcting dart:', selectedDartForCorrection.id, 'to score:', value, 'multiplier:', modifier);
            const correctionRequest: DartCorrectionRequest = {
                dartId: selectedDartForCorrection.id,
                score: value,
                multiplier: modifier
            };
            await correctDartMutation.mutate(correctionRequest);
        } else if (selectedPendingDartIndex !== null && !isAutoScoreEnabled) {
            console.log('Correcting pending dart at index:', selectedPendingDartIndex, 'to score:', value, 'multiplier:', modifier);
            const newState = manualScoringService.correctDart(selectedPendingDartIndex, value, modifier);
            setManualScoringState(newState);
            setSelectedPendingDartIndex(null);
            setModifier(1);
        } else if (isAutoScoreEnabled) {
            console.log(`Number pressed (auto): ${value} with modifier: ${modifier}`);
            const dartThrow: DartThrowRequest = {
                score: value, multiplier: modifier
            }
            await throwDartMutation.mutate(dartThrow);
            setModifier(1);
        } else {
            console.log(`Number pressed (manual): ${value} with modifier: ${modifier}`);
            const newState = manualScoringService.addDart(value, modifier);
            setManualScoringState(newState);
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
        if (selectedDartForCorrection && isAutoScoreEnabled) {
            setSelectedDartForCorrection(null);
            setModifier(1);
        } else if (selectedPendingDartIndex !== null && !isAutoScoreEnabled) {
            setSelectedPendingDartIndex(null);
            setModifier(1);
        } else if (isAutoScoreEnabled) {
            console.log("Back button pressed (auto)");
            if (!playerId) return;
            let currentPlayerDarts = currentGameState.currentTurnDarts?.[playerId];
            if (currentPlayerDarts && currentPlayerDarts.length > 0) {
                let id = currentPlayerDarts[currentPlayerDarts.length - 1].id;
                const revertRequest: DartRevertRequest = {
                    id: id
                }
                console.log("Revert request", revertRequest);
                await revertDartMutation.mutate(revertRequest)
            }
        } else {
            console.log("Back button pressed (manual)");
            const newState = manualScoringService.revertLastDart();
            setManualScoringState(newState);
        }
    };

    const handleDartPress = (dart: DartThrowResponse) => {
        if (!isAutoScoreEnabled) return;
        
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

    const handlePendingDartPress = (index: number, dart: PendingDart) => {
        if (isAutoScoreEnabled) return;
        
        console.log('Pending dart pressed at index:', index);
        if (selectedPendingDartIndex === index) {
            console.log('Deselecting pending dart');
            setSelectedPendingDartIndex(null);
            setModifier(1);
        } else {
            console.log('Selecting pending dart for correction');
            setSelectedPendingDartIndex(index);
            setModifier(dart.multiplier as 1 | 2 | 3);
        }
    };

    const handleEnterPress = async () => {
        console.log("Enter button pressed - completing turn");
        if (!playerId) return;
        
        if (isAutoScoreEnabled) {
            const currentPlayerDarts = currentGameState.currentTurnDarts?.[playerId];
            if (currentPlayerDarts && currentPlayerDarts.length > 0) {
                const dartsToSubmit: DartThrowRequest[] = currentPlayerDarts.map(dart => ({
                    score: dart.score,
                    multiplier: dart.multiplier,
                    autoScore: dart.autoScore
                }));
                console.log("Completing turn with darts (auto):", dartsToSubmit);
                await completeTurnMutation.mutate(dartsToSubmit);
            }
        } else {
            const dartsToSubmit = manualScoringService.getPendingDartsForSubmission();
            if (dartsToSubmit.length > 0) {
                console.log("Completing turn with darts (manual):", dartsToSubmit);
                await completeTurnMutation.mutate(dartsToSubmit);
            }
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
                {currentGameState.currentPlayer && (
                    <View className="px-lg py-md bg-emerald-50 border-b border-emerald-200">
                        <Typography variant="body" className="text-center text-slate-700">
                            Current Player: <Typography variant="body" className="font-semibold text-emerald-700">{currentGameState.currentPlayer.name}</Typography>
                        </Typography>
                    </View>
                )}

                <ScrollView
                    className="flex-1"
                    contentContainerClassName="pb-5 pt-5"
                    showsVerticalScrollIndicator={false}
                >
                    <X01ScoreView 
                        currentGameStatePartial={currentGameState} 
                        playerId={playerId || undefined}
                        onDartPress={handleDartPress}
                        selectedDartId={selectedDartForCorrection?.id ?? null}
                        manualPendingDarts={manualScoringState.pendingDarts}
                        manualCurrentScore={manualScoringState.currentScore}
                        onPendingDartPress={handlePendingDartPress}
                        selectedPendingDartIndex={selectedPendingDartIndex}
                        isManualScoring={!isAutoScoreEnabled}
                    />
                </ScrollView>

                <View className="absolute bottom-0 w-full">
                    <DartInput
                        onNumberPress={handleNumberPress}
                        onDoublePress={handleDoublePress}
                        onTriplePress={handleTriplePress}
                        onBackPress={handleBackPress}
                        onEnterPress={handleEnterPress}
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
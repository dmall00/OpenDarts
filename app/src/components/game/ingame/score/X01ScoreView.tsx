import {View} from "react-native";
import React from "react";
import X01CurrentScoreBoxes from "@/src/components/game/ingame/score/X01CurrentScoreBoxes";
import {CurrentGameStateResponse, DartThrowResponse} from "@/src/types/api";
import {PendingDart} from "@/src/services/game/manualScoringService";
import ScoreDisplay from "@/src/components/ui/ScoreDisplay";
import Container from "@/src/components/ui/Container";

interface X01ScoreViewProps {
    currentGameStatePartial: Partial<CurrentGameStateResponse>;
    playerId?: string;
    onDartPress?: (dart: DartThrowResponse) => void;
    selectedDartId?: number | null;
    manualPendingDarts?: PendingDart[];
    manualCurrentScore?: number;
    onPendingDartPress?: (index: number, dart: PendingDart) => void;
    selectedPendingDartIndex?: number | null;
    isManualScoring?: boolean;
}

export default function X01ScoreView(props: X01ScoreViewProps) {
    const playerId = props.playerId || props.currentGameStatePartial.currentPlayer?.id;
    if (!playerId) {
        return null;
    }
    
    const remainingScore = props.isManualScoring && props.manualCurrentScore !== undefined
        ? props.manualCurrentScore
        : props.currentGameStatePartial.currentRemainingScores?.[playerId] ?? 0;
    
    const currentTurnDarts = props.isManualScoring && props.manualPendingDarts
        ? props.manualPendingDarts.map((dart, index) => ({
            id: -1 - index,
            score: dart.score,
            multiplier: dart.multiplier,
            scoreString: dart.scoreString,
            computedScore: dart.computedScore,
            autoScore: false
        } as DartThrowResponse))
        : props.currentGameStatePartial.currentTurnDarts?.[playerId] ?? [];

    const handleDartPress = props.isManualScoring && props.onPendingDartPress
        ? (dart: DartThrowResponse) => {
            const index = currentTurnDarts.findIndex(d => d.id === dart.id);
            if (index >= 0 && props.manualPendingDarts) {
                props.onPendingDartPress!(index, props.manualPendingDarts[index]);
            }
        }
        : props.onDartPress;

    const selectedDartId = props.isManualScoring && props.selectedPendingDartIndex !== null && props.selectedPendingDartIndex !== undefined
        ? -1 - props.selectedPendingDartIndex
        : props.selectedDartId;

    return (
        <Container variant="section" className="p-base">
            <View className="mb-lg">
                <ScoreDisplay
                    value={remainingScore}
                    label="Remaining"
                    variant="large"
                    color="primary"
                />
            </View>
            <X01CurrentScoreBoxes
                dartThrows={currentTurnDarts}
                currentGameStatePartial={props.currentGameStatePartial}
                onDartPress={handleDartPress}
                selectedDartId={selectedDartId}
            />
        </Container>
    );
};
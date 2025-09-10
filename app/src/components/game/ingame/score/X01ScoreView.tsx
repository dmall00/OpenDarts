import {View} from "react-native";
import React from "react";
import X01CurrentScoreBoxes from "@/src/components/game/ingame/score/X01CurrentScoreBoxes";
import {CurrentGameState} from "@/src/types/api";
import ScoreDisplay from "@/src/components/ui/ScoreDisplay";
import Container from "@/src/components/ui/Container";

interface X01ScoreViewProps {
    currentGameStatePartial: Partial<CurrentGameState>;
    playerId?: string;
}

export default function X01ScoreView(props: X01ScoreViewProps) {
    const playerId = props.playerId || props.currentGameStatePartial.currentPlayer?.id;
    if (!playerId) {
        return null;
    }
    const remainingScore = props.currentGameStatePartial.currentRemainingScores?.[playerId] ?? 0;
    const currentTurnDarts = props.currentGameStatePartial.currentTurnDarts?.[playerId] ?? [];

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
            />
        </Container>
    );
};
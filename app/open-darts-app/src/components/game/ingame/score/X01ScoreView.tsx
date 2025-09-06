import {View} from "react-native";
import React from "react";
import X01CurrentScoreBoxes from "@/src/components/game/ingame/score/X01CurrentScoreBoxes";
import {DartProcessedResult} from "@/src/types/api";
import ScoreDisplay from "@/src/components/ui/ScoreDisplay";
import Container from "@/src/components/ui/Container";

interface X01ScoreViewProps {
    dartProcessedResult: Partial<DartProcessedResult>;
}

export default function X01ScoreView(props: X01ScoreViewProps) {
    const remainingScore = props.dartProcessedResult.remainingScore ?? 0;
    const currentTurnDarts = props.dartProcessedResult.currentTurnDarts ?? [];

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
            <X01CurrentScoreBoxes dartThrows={currentTurnDarts}/>
        </Container>
    );
};
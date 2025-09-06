import X01ScoreView from "@/src/components/game/ingame/score/X01ScoreView";

export default function ScoreView() {
    // TODO: Get dartProcessedResult from game state/context
    const mockDartResult = {
        remainingScore: 501,
        currentTurnDarts: []
    };

    return (
        <X01ScoreView dartProcessedResult={mockDartResult}/>
    );
};
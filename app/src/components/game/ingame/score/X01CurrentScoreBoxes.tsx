import {View} from "react-native";
import ScoreBox from "@/src/components/game/ingame/score/ScoreBox";
import {DartProcessedResult, DartThrowResponse} from "@/src/types/api";
import ScoreDisplay from "@/src/components/ui/ScoreDisplay";
import Container from "@/src/components/ui/Container";

interface X01CurrentScoreBoxesProps {
    dartThrows?: DartThrowResponse[]
    dartProcessedResult?: Partial<DartProcessedResult>
}

export default function X01CurrentScoreBoxes(props: X01CurrentScoreBoxesProps) {
    const dartThrows = props.dartThrows || [];
    const dartProcessedResult = props.dartProcessedResult;

    const scoreBoxes = Array(3).fill(null).map((_, index) => {
        const dartThrow = dartThrows[index];
        return (
            <View key={index} className="flex-1 mx-xs">
                <ScoreBox text={dartThrow ? dartThrow.scoreString : ""} />
            </View>
        );
    });

    const computedSum = dartThrows.reduce((sum, dartThrow) => {
        return sum + (dartThrow?.computedScore || 0);
    }, 0);

    const getScoreDisplayProps = () => {
        if (dartProcessedResult?.bust) {
            return {
                value: "BUST",
                label: "",
                variant: "medium" as const,
                color: "warning" as const
            };
        }

        if (dartProcessedResult?.gameWon) {
            return {
                value: "WON",
                label: "",
                variant: "medium" as const,
                color: "success" as const
            };
        }

        return {
            value: computedSum,
            label: "SUM",
            variant: "medium" as const,
            color: "secondary" as const
        };
    };

    const scoreDisplayProps = getScoreDisplayProps();

    return (
        <Container variant="section">
            <View className="flex-row items-center justify-between">
                <ScoreDisplay {...scoreDisplayProps} />
                <View className="flex-row flex-1 ml-lg">
                    {scoreBoxes}
                </View>
            </View>
        </Container>
    );
}
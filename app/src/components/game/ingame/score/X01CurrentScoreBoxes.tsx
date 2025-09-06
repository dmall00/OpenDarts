import {View} from "react-native";
import ScoreBox from "@/src/components/game/ingame/score/ScoreBox";
import {DartThrow} from "@/src/types/api";
import ScoreDisplay from "@/src/components/ui/ScoreDisplay";
import Container from "@/src/components/ui/Container";

interface X01CurrentScoreBoxesProps {
    dartThrows?: DartThrow[]
}

export default function X01CurrentScoreBoxes(props: X01CurrentScoreBoxesProps) {
    const dartThrows = props.dartThrows || [];

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

    return (
        <Container variant="section">
            <View className="flex-row items-center justify-between">
                <ScoreDisplay 
                    value={computedSum}
                    label="SUM"
                    variant="medium"
                    color="secondary"
                />
                <View className="flex-row flex-1 ml-lg">
                    {scoreBoxes}
                </View>
            </View>
        </Container>
    );
}
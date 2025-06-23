import {View} from "react-native";
import ScoreBox from "@/src/components/game/ScoreBox";

export default function X01CurrentScoreBoxes() {
    return (

        <View>
            <ScoreBox text={"Average"}/>
            <ScoreBox text={"Avg. to 9"}/>
            <ScoreBox text={"Checkout"}/>
        </View>


    );
};
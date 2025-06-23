import {Text, View} from "react-native";
import React from "react";
import X01CurrentScoreBoxes from "@/src/components/game/X01CurrentScoreBoxes";

export default function X01ScoreView() {

    return (

        <View>
            <View>
                <Text>501</Text>
                <Text>Remaining</Text>
            </View>

            <X01CurrentScoreBoxes/>

        </View>


    );
};
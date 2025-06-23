import {Text, View} from "react-native";
import React from "react";

interface ScoreBoxProps {
    text: String
}


export default function ScoreBox({text}: ScoreBoxProps) {
    return (

        <View>
            <Text>{text}</Text>
        </View>
    );
};
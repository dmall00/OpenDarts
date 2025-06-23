import React from "react";
import {Text, TouchableOpacity} from "react-native";
import {Feather} from "@expo/vector-icons";
import {useGameStore} from "@/src/stores/gameStore";

export default function AutoScoreToggle() {

    const {isAutoScoreEnabled, toggleAutoScore} = useGameStore();
    return (
        <TouchableOpacity
            onPress={toggleAutoScore}
        >
            {isAutoScoreEnabled ? <Feather name="camera" size={24} color="black"/> :
                <Feather name="camera-off" size={24} color="black"/>}


            <Text>
                AutoScore
            </Text>
        </TouchableOpacity>
    );
};
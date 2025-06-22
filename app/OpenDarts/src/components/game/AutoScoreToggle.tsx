import React, {useState} from "react";
import {Text, TouchableOpacity} from "react-native";
import {Feather} from "@expo/vector-icons";

interface AutoScoreToggleProps {

}


export default function AutoScoreToggle(props: AutoScoreToggleProps) {

    const [isAutoscore, setAutoscore] = useState(false);

    function toggleAutoScore() {
        setAutoscore(!isAutoscore);
    }

    return (
        <TouchableOpacity
            onPress={() => toggleAutoScore()}
        >
            {isAutoscore ? <Feather name="camera" size={24} color="black"/> :
                <Feather name="camera-off" size={24} color="black"/>}


            <Text>
                AutoScore
            </Text>
        </TouchableOpacity>
    );
};
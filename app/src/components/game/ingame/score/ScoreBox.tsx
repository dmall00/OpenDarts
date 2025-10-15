import React from "react";
import {TouchableOpacity, View} from "react-native";
import ScoreDisplay from "@/src/components/ui/ScoreDisplay";

interface ScoreBoxProps {
    text: string;
    onPress?: () => void;
    disabled?: boolean;
    isSelected?: boolean;
}

export default function ScoreBox({text, onPress, disabled, isSelected}: ScoreBoxProps) {
    const content = (
        <View className={`${isSelected ? 'bg-orange-500 rounded-lg p-xs' : ''}`}>
            <ScoreDisplay 
                value={text}
                variant="small"
                color={isSelected ? "neutral" : "neutral"}
            />
        </View>
    );

    if (!onPress || disabled) {
        return content;
    }

    return (
        <TouchableOpacity 
            onPress={onPress}
            activeOpacity={0.7}
            disabled={disabled}
        >
            {content}
        </TouchableOpacity>
    );
};
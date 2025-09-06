import React from 'react';
import {View} from 'react-native';
import {Feather} from "@expo/vector-icons";

interface CalibrationStatusProps {
    calibrated: boolean;
}

export default function CalibrationStatus({calibrated}: CalibrationStatusProps) {
    return (
        <View>
            {calibrated ? (
                <Feather name="check-circle" size={20} color="green"/>
            ) : (
                <Feather name="x-circle" size={20} color="red"/>
            )}
        </View>
    );
}
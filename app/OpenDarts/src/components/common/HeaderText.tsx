import {Text, View} from "react-native";
import {HeaderStyles} from "@/src/styles/HeaderStyles";
import React from "react";

interface HeaderPropsText {
    title?: string;
    subtitle?: string;
}


export default function HeaderText({title = "OpenDarts", subtitle}: HeaderPropsText) {
    return (
        <View style={HeaderStyles.titleContainer}>
            <Text style={HeaderStyles.title}>{title}</Text>
            {subtitle && (
                <Text style={HeaderStyles.subtitle}>{subtitle}</Text>
            )}
        </View>
    );
}

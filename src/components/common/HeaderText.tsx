import {Text, View} from "react-native";
import React from "react";
import Typography from "@/src/components/ui/Typography";

interface HeaderPropsText {
    title?: string;
    subtitle?: string;
}


export default function HeaderText({title = "OpenDarts", subtitle}: HeaderPropsText) {
    return (
        <View className="items-center justify-center">
            <Typography variant="header">{title}</Typography>
            {subtitle && (
                <Text className="text-sm font-medium text-tabBar-inactive mt-1">{subtitle}</Text>
            )}
        </View>
    );
}

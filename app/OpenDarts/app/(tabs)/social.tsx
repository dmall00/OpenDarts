import React from 'react';
import {SafeAreaView, Text, View} from 'react-native';
import {GlobalStyles} from "@/src/styles/GlobalStyles";

export default function Social() {
    return (
        <SafeAreaView style={GlobalStyles.containerWithHeader}>
            <View style={GlobalStyles.contentContainer}>
                <Text>Social</Text>
            </View>
        </SafeAreaView>
    );
}
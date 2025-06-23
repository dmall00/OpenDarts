import React from 'react';
import {SafeAreaView, Text, View} from 'react-native';
import {GlobalStyles} from "@/src/styles/GlobalStyles";

export default function Index() {
    return (
        <SafeAreaView style={GlobalStyles.containerWithHeader}>
            <View style={GlobalStyles.contentContainer}>
                <Text>Home</Text>
            </View>
        </SafeAreaView>
    );
}
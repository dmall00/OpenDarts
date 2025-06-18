import React from 'react';
import {SafeAreaView, Text, View} from 'react-native';
import {GlobalStyles} from '@/styles/GlobalStyles';

export default function Play() {
    return (
        <SafeAreaView style={GlobalStyles.safeArea}>
            <View style={GlobalStyles.contentContainer}>
                <Text>Play</Text>
            </View>
        </SafeAreaView>
    );
}
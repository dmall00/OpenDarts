import React from 'react';
import {SafeAreaView, Text, View} from 'react-native';
import {GlobalStyles} from '@/styles/GlobalStyles';

export default function Stats() {
    return (
        <SafeAreaView style={GlobalStyles.safeArea}>
            <View style={GlobalStyles.contentContainer}>
                <Text>Stats</Text>
            </View>
        </SafeAreaView>
    );
}
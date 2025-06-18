import React from 'react';
import {SafeAreaView, Text, View} from 'react-native';
import {GlobalStyles} from '@/styles/GlobalStyles';

export default function Index() {
    return (
        <SafeAreaView style={GlobalStyles.safeArea}>
            <View style={GlobalStyles.contentContainer}>
                <Text>Dashboard</Text>
            </View>
        </SafeAreaView>
    );
}
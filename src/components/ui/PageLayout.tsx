import React from 'react';
import { SafeAreaView, View } from 'react-native';
import Header from '@/src/components/common/Header';
import HeaderText from '@/src/components/common/HeaderText';

interface PageLayoutProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    headerLeft?: React.ReactNode;
    headerRight?: React.ReactNode;
}

export default function PageLayout({ 
    title, 
    subtitle, 
    children, 
    headerLeft, 
    headerRight 
}: PageLayoutProps) {
    return (
        <SafeAreaView className="flex-1 bg-background">
            <Header>
                <View className="flex-1">
                    {headerLeft}
                </View>
                <View className="flex-2 items-center">
                    <HeaderText title={"Open Darts"} subtitle={subtitle} />
                </View>
                <View className="flex-1 items-end">
                    {headerRight}
                </View>
            </Header>
            <View className="p-base pb-3xl">
                {children}
            </View>
        </SafeAreaView>
    );
}

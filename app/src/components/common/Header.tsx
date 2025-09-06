import React, {ReactNode} from 'react';
import {StatusBar, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

interface HeaderProps {
    children: ReactNode
}

export default function Header({children}: HeaderProps) {
    const insets = useSafeAreaInsets();
    
    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={true}/>
            <View className="bg-black" style={{height: insets.top}}/>
            <View
                className="bg-tabBar-background border-b border-tabBar-border shadow-sm pt-2.5 pb-3.5 px-4 flex-row items-center justify-between">
                {children}
            </View>
        </>
    );
}

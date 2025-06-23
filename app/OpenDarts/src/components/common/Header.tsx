import React, {ReactNode} from 'react';
import {StatusBar, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {HeaderStyles} from '@/src/styles/HeaderStyles';

interface HeaderProps {
    children: ReactNode
}

export default function Header({children}: HeaderProps) {
    const insets = useSafeAreaInsets();
    
    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={true}/>
            <View style={[HeaderStyles.safeAreaTop, {height: insets.top}]}/>
            <View style={HeaderStyles.container}>
                {children}
            </View>
        </>
    );
}

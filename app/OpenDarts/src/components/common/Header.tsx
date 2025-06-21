import React, {ReactNode} from 'react';
import {View} from 'react-native';
import {HeaderStyles} from '@/src/styles/HeaderStyles';

interface HeaderProps {
    children: ReactNode
}


export default function Header({children}: HeaderProps) {
    return (
        <View style={HeaderStyles.container}>
            {children}
        </View>
    );
}

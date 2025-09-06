import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { buttonStyles } from '@/src/styles/commonStyles';

interface InputButtonProps {
    value: string | number;
    onPress: () => void;
    variant?: 'number' | 'action' | 'submit' | 'double' | 'triple' | 'back';
    selected?: boolean;
}

export default function InputButton({ 
    value, 
    onPress,
    variant = 'number',
    selected = false
}: InputButtonProps) {

    const styleConfig = buttonStyles.variants[variant] || buttonStyles.variants.number;
    const buttonClass = `${buttonStyles.base} ${
        selected ? `${styleConfig.base} ${styleConfig.selected}` : styleConfig.base
    }`;
    const textClass = `${buttonStyles.text.base} ${
        selected ? styleConfig.textSelected : styleConfig.text
    }`;

    return (
        <TouchableOpacity 
            className={buttonClass}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Text className={textClass}>
                {value}
            </Text>
        </TouchableOpacity>
    );
}
import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, View } from 'react-native';

interface SelectableOptionProps extends TouchableOpacityProps {
    label: string;
    isSelected: boolean;
    isDisabled?: boolean;
}

export default function SelectableOption({ 
    label, 
    isSelected, 
    isDisabled = false,
    ...props 
}: SelectableOptionProps) {
    const getButtonStyles = () => {
        const baseStyles = "border-2 rounded-xl py-md px-lg items-center justify-center";
        
        if (isDisabled) {
            return `${baseStyles} border-slate-300 bg-slate-50`;
        }
        
        return isSelected 
            ? `${baseStyles} border-emerald-500 bg-emerald-50 shadow-sm`
            : `${baseStyles} border-slate-300 bg-white shadow-sm`;
    };
    
    const getTextStyles = () => {
        const baseStyles = "text-base font-medium";
        
        if (isDisabled) {
            return `${baseStyles} text-slate-500`;
        }
        
        return isSelected 
            ? `${baseStyles} text-emerald-700 font-bold`
            : `${baseStyles} text-slate-700`;
    };
    
    return (
        <TouchableOpacity
            className={getButtonStyles()}
            disabled={isDisabled}
            activeOpacity={0.8}
            {...props}
        >
            <Text className={getTextStyles()}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

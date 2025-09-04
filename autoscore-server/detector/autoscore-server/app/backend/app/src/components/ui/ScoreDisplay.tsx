import React from 'react';
import { View, Text } from 'react-native';

interface ScoreDisplayProps {
    value: string | number;
    label?: string;
    variant?: 'large' | 'medium' | 'small';
    color?: 'primary' | 'secondary' | 'neutral' | 'success' | 'warning';
}

export default function ScoreDisplay({ 
    value, 
    label, 
    variant = 'medium',
    color = 'primary' 
}: ScoreDisplayProps) {
    const getContainerStyles = () => {
        const baseStyles = "items-center justify-center";
        
        const variantStyles = {
            large: "rounded-xl p-xl shadow-lg",
            medium: "rounded-lg px-lg py-base min-h-[80px] min-w-[80px] shadow-md", 
            small: "rounded-lg py-md px-sm min-h-[70px] shadow-sm"
        };
        
        const colorStyles = {
            primary: "bg-emerald-500",
            secondary: "bg-emerald-600", 
            neutral: "bg-white border border-slate-200",
            success: "bg-green-500",
            warning: "bg-amber-500"
        };
        
        return `${baseStyles} ${variantStyles[variant]} ${colorStyles[color]}`;
    };
    
    const getValueStyles = () => {
        const variantStyles = {
            large: "text-3xl font-bold",
            medium: "text-xl font-bold",
            small: "text-base font-bold"
        };
        
        const colorStyles = {
            primary: "text-white",
            secondary: "text-white",
            neutral: "text-slate-800",
            success: "text-white",
            warning: "text-white"
        };
        
        return `${variantStyles[variant]} ${colorStyles[color]}`;
    };
    
    const getLabelStyles = () => {
        const variantStyles = {
            large: "text-lg font-medium mt-xs",
            medium: "text-xs font-medium mt-0.5",
            small: "text-xs font-medium mt-0.5"
        };
        
        const colorStyles = {
            primary: "text-white opacity-90",
            secondary: "text-white opacity-90",
            neutral: "text-slate-600",
            success: "text-white opacity-90",
            warning: "text-white opacity-90"
        };
        
        return `${variantStyles[variant]} ${colorStyles[color]}`;
    };
    
    const displayValue = value === "" || value === null || value === undefined ? "-" : value;
    const isEmpty = displayValue === "-";
    
    return (
        <View className={getContainerStyles()}>
            <Text className={`${getValueStyles()} ${isEmpty && color === 'neutral' ? 'text-slate-400' : ''}`}>
                {displayValue}
            </Text>
            {label && (
                <Text className={getLabelStyles()}>
                    {label}
                </Text>
            )}
        </View>
    );
}

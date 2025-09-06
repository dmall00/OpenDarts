import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
    children: React.ReactNode;
    padding?: 'none' | 'small' | 'medium' | 'large';
    margin?: 'none' | 'small' | 'medium' | 'large';
    variant?: 'default' | 'elevated' | 'bordered' | 'minimal';
}

export default function Card({ 
    children, 
    padding = 'medium',
    margin = 'medium',
    variant = 'default',
    className = '',
    ...props 
}: CardProps) {
    const getPaddingStyles = () => {
        const paddingStyles = {
            none: '',
            small: 'p-sm',
            medium: 'p-lg',
            large: 'p-xl'
        };
        return paddingStyles[padding];
    };
    
    const getMarginStyles = () => {
        const marginStyles = {
            none: '',
            small: 'mb-sm',
            medium: 'mb-base',
            large: 'mb-lg'
        };
        return marginStyles[margin];
    };
    
    const getVariantStyles = () => {
        const variantStyles = {
            default: 'bg-white rounded-xl shadow-md',
            elevated: 'bg-white rounded-xl shadow-lg',
            bordered: 'bg-white rounded-xl border-2 border-slate-200 shadow-sm',
            minimal: 'bg-slate-50 rounded-lg'
        };
        return variantStyles[variant];
    };
    
    const cardStyles = `${getVariantStyles()} ${getPaddingStyles()} ${getMarginStyles()} ${className}`;
    
    return (
        <View className={cardStyles} {...props}>
            {children}
        </View>
    );
}

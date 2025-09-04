import React from 'react';
import { Text, TextProps } from 'react-native';

interface TypographyProps extends TextProps {
    variant?: 'title' | 'subtitle' | 'body' | 'caption' | 'header' | 'label' | 'success' | 'error' | 'warning';
    children: React.ReactNode;
}

export default function Typography({ 
    variant = 'body', 
    children, 
    className = '',
    ...props 
}: TypographyProps) {
    const getTextStyles = () => {
        const variants = {
            title: "text-slate-900 text-2xl font-bold",
            subtitle: "text-slate-600 text-base leading-relaxed",
            body: "text-slate-700 text-base leading-6",
            caption: "text-slate-500 text-sm",
            header: "text-lg font-bold text-emerald-600 tracking-wider",
            label: "text-lg font-semibold text-slate-800",
            success: "text-emerald-600 text-base font-medium",
            error: "text-red-500 text-base font-medium",
            warning: "text-amber-600 text-base font-medium"
        };
        
        return `${variants[variant]} ${className}`;
    };
    
    return (
        <Text className={getTextStyles()} {...props}>
            {children}
        </Text>
    );
}

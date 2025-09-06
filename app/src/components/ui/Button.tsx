import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
}

export default function Button({ 
    title, 
    variant = 'primary', 
    size = 'medium', 
    loading = false,
    disabled,
    style,
    ...props 
}: ButtonProps) {
    const getButtonStyles = () => {
        const baseStyles = "rounded-xl items-center justify-center shadow-md";
        
        const variantStyles = {
            primary: "bg-emerald-500",
            secondary: "bg-slate-200 border-2 border-slate-300",
            success: "bg-green-500",
            warning: "bg-amber-500", 
            danger: "bg-red-500"
        };
        
        const sizeStyles = {
            small: "px-md py-sm",
            medium: "px-lg py-md", 
            large: "px-xl py-lg"
        };
        
        return `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]}`;
    };
    
    const getTextStyles = () => {
        const baseStyles = "font-semibold text-center";
        
        const variantStyles = {
            primary: "text-white",
            secondary: "text-slate-700",
            success: "text-white",
            warning: "text-white",
            danger: "text-white"
        };
        
        const sizeStyles = {
            small: "text-sm",
            medium: "text-base",
            large: "text-lg"
        };
        
        return `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]}`;
    };
    
    return (
        <TouchableOpacity
            className={getButtonStyles()}
            style={[loading || disabled ? { opacity: 0.7 } : {}, style]}
            disabled={loading || disabled}
            activeOpacity={0.8}
            {...props}
        >
            <Text className={getTextStyles()}>
                {loading ? 'Loading...' : title}
            </Text>
        </TouchableOpacity>
    );
}

import React from 'react';
import { View, ViewProps } from 'react-native';

interface ContainerProps extends ViewProps {
    children: React.ReactNode;
    variant?: 'page' | 'content' | 'section';
}

export default function Container({ 
    children, 
    variant = 'content',
    className = '',
    ...props 
}: ContainerProps) {
    const getContainerStyles = () => {
        const variants = {
            page: "flex-1 bg-background",
            content: "p-base pb-3xl", 
            section: "mb-base"
        };
        
        return `${variants[variant]} ${className}`;
    };
    
    return (
        <View className={getContainerStyles()} {...props}>
            {children}
        </View>
    );
}

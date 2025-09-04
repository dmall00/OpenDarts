import React from 'react';
import { View } from 'react-native';
import InputButton from '@/src/components/game/ingame/input/InputButton';

interface DartInputProps {
    onNumberPress: (value: number) => void;
    onDoublePress: () => void;
    onTriplePress: () => void;
    onBackPress: () => void;
    modifier?: 'single' | 'double' | 'triple';
}

const DartInputRow = ({
    row,
    onNumberPress,
    onDoublePress,
    onTriplePress,
    onBackPress,
    modifier
}: {
    row: (number | string)[];
    onNumberPress: (value: number) => void;
    onDoublePress: () => void;
    onTriplePress: () => void;
    onBackPress: () => void;
    modifier: 'single' | 'double' | 'triple';
}) => {
    const renderButton = (item: number | string, index: number) => {
        if (typeof item === 'number') {
            return (
                <View key={index} className="flex-1">
                    <InputButton
                        value={item}
                        onPress={() => onNumberPress(item)}
                        variant="number"
                    />
                </View>
            );
        }

        switch (item) {
            case "DOUBLE":
                return (
                    <View key={index} className="flex-1">
                        <InputButton
                            value="2x"
                            onPress={onDoublePress}
                            variant="double"
                            selected={modifier === 'double'}
                        />
                    </View>
                );
            case "TRIPLE":
                return (
                    <View key={index} className="flex-1">
                        <InputButton
                            value="3x"
                            onPress={onTriplePress}
                            variant="triple"
                            selected={modifier === 'triple'}
                        />
                    </View>
                );
            case "BACK":
                return (
                    <View key={index} className="flex-1">
                        <InputButton
                            value="←"
                            onPress={onBackPress}
                            variant="back"
                        />
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <View className="flex-row gap-md">
            {row.map(renderButton)}
        </View>
    );
};

export default function DartInput({
    onNumberPress,
    onDoublePress,
    onTriplePress,
    onBackPress,
    modifier = 'single'
}: DartInputProps) {
    const rows = [
        [1, 2, 3, 4, 5, 6, 7],
        [8, 9, 10, 11, 12, 13, 14],
        [15, 16, 17, 18, 19, 20, 25],
        [0, "DOUBLE", "TRIPLE", "BACK"]
    ];

    return (
        <View className="p-base">
            <View className="gap-md">
                {rows.map((row, rowIndex) => (
                    <DartInputRow
                        key={rowIndex}
                        row={row}
                        onNumberPress={onNumberPress}
                        onDoublePress={onDoublePress}
                        onTriplePress={onTriplePress}
                        onBackPress={onBackPress}
                        modifier={modifier}
                    />
                ))}
            </View>
        </View>
    );
}
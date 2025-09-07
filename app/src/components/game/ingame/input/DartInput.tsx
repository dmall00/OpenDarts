import React from 'react';
import {View} from 'react-native';
import InputButton from '@/src/components/game/ingame/input/InputButton';
import {isWeb} from '@/src/utils/platform';

interface DartInputProps {
    onNumberPress: (value: number) => void;
    onDoublePress: () => void;
    onTriplePress: () => void;
    onBackPress: () => void;
    modifier?: 1 | 2 | 3;
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
    modifier: 1 | 2 | 3;
}) => {
    const renderButton = (item: number | string, index: number) => {
        const buttonWrapperClass = isWeb() ? "w-20" : "flex-1 max-w-[56px]";
        
        if (typeof item === 'number') {
            return (
                <View key={index} className={buttonWrapperClass}>
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
                    <View key={index} className={buttonWrapperClass}>
                        <InputButton
                            value="2x"
                            onPress={onDoublePress}
                            variant="double"
                            selected={modifier === 2}
                        />
                    </View>
                );
            case "TRIPLE":
                return (
                    <View key={index} className={buttonWrapperClass}>
                        <InputButton
                            value="3x"
                            onPress={onTriplePress}
                            variant="triple"
                            selected={modifier === 3}
                        />
                    </View>
                );
            case "BACK":
                return (
                    <View key={index} className={buttonWrapperClass}>
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
        <View className={`flex-row ${isWeb() ? "gap-2" : "gap-1"} justify-center`}>
            {row.map(renderButton)}
        </View>
    );
};

export default function DartInput({
    onNumberPress,
    onDoublePress,
    onTriplePress,
    onBackPress,
                                      modifier = 1
}: DartInputProps) {
    const rows = [
        [1, 2, 3, 4, 5, 6, 7],
        [8, 9, 10, 11, 12, 13, 14],
        [15, 16, 17, 18, 19, 20, 25],
        [0, "DOUBLE", "TRIPLE", "BACK"]
    ];

    return (
        <View className={`p-base ${isWeb() ? "max-w-lg mx-auto" : ""}`}>
            <View className={`${isWeb() ? "gap-2" : "gap-1"}`}>
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
import React, {useState} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {GlobalStyles} from '@/src/styles/GlobalStyles';
import {GamePickerStyles} from '@/src/styles/GamePickerStyles';

interface GamePickerProps {
    onGameConfigChange?: (config: GameConfig) => void;
}

export interface GameConfig {
    gameMode: 'X01';
    score: 301 | 501;
    players: string[];
}

export default function GamePicker({onGameConfigChange}: GamePickerProps) {
    const [selectedScore, setSelectedScore] = useState<301 | 501>(301);
    const [selectedMode] = useState<'X01'>('X01');
    const [selectedPlayers] = useState<string[]>(["test"]);

    const handleScoreChange = (score: 301 | 501) => {
        setSelectedScore(score);
        const config: GameConfig = {
            gameMode: selectedMode,
            score,
            players: selectedPlayers,
        };
        onGameConfigChange?.(config);
    };

    return (
        <View style={GlobalStyles.card}>
            <Text style={GlobalStyles.title}>New Game</Text>
            <Text style={GlobalStyles.subtitle}>Configure your dart game settings</Text>
            <View style={GamePickerStyles.section}>
                <Text style={GamePickerStyles.sectionTitle}>Game Mode</Text>
                <TouchableOpacity style={[GamePickerStyles.optionButton, GamePickerStyles.selectedOption]} disabled>
                    <Text style={[GamePickerStyles.optionText, GamePickerStyles.selectedOptionText]}>X01</Text>
                </TouchableOpacity>
            </View>

            <View style={GamePickerStyles.section}>
                <Text style={GamePickerStyles.sectionTitle}>Starting Score</Text>
                <View style={GamePickerStyles.optionsRow}>
                    <TouchableOpacity
                        style={[
                            GamePickerStyles.optionButton,
                            GamePickerStyles.scoreOption,
                            selectedScore === 301 && GamePickerStyles.selectedOption,
                        ]}
                        onPress={() => handleScoreChange(301)}
                    >
                        <Text
                            style={[
                                GamePickerStyles.optionText,
                                selectedScore === 301 && GamePickerStyles.selectedOptionText,
                            ]}
                        >
                            301
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            GamePickerStyles.optionButton,
                            GamePickerStyles.scoreOption,
                            selectedScore === 501 && GamePickerStyles.selectedOption,
                        ]}
                        onPress={() => handleScoreChange(501)}
                    >
                        <Text
                            style={[
                                GamePickerStyles.optionText,
                                selectedScore === 501 && GamePickerStyles.selectedOptionText,
                            ]}
                        >
                            501
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={GamePickerStyles.section}>
                <Text style={GamePickerStyles.sectionTitle}>Players</Text>
                <TouchableOpacity style={[GamePickerStyles.optionButton, GamePickerStyles.selectedOption]} disabled>
                    <Text style={[GamePickerStyles.optionText, GamePickerStyles.selectedOptionText]}>Single
                        Player</Text>
                </TouchableOpacity>
            </View>

            <View style={GamePickerStyles.summaryCard}>
                <Text style={GamePickerStyles.summaryTitle}>Game Summary</Text>
                <Text style={GamePickerStyles.summaryText}>
                    {selectedMode.toUpperCase()} • {selectedScore} points • Single Player
                </Text>
            </View>
        </View>
    );
}

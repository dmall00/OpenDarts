import React, {useState} from 'react';
import {Alert, SafeAreaView, Text, TouchableOpacity, View} from 'react-native';
import {GlobalStyles} from '@/app/styles/GlobalStyles';
import GamePicker, {GameConfig} from '../components/play/GamePicker';

export default function Play() {
    const [gameConfig, setGameConfig] = useState<GameConfig>({
        mode: 'x01',
        score: 301,
        players: ["test"],
    });

    const handleStartGame = () => {
        Alert.alert(
            'Start Game',
            `Starting ${gameConfig.mode.toUpperCase()} game with ${gameConfig.score} points for single player`,
            [{text: 'OK'}]
        );
    };

    return (
        <SafeAreaView style={GlobalStyles.safeArea}>
            <View style={GlobalStyles.contentContainer}>
                <GamePicker onGameConfigChange={setGameConfig}/>

                <TouchableOpacity
                    style={GlobalStyles.primaryButton}
                    onPress={handleStartGame}
                >
                    <Text style={GlobalStyles.primaryButtonText}>
                        Start Game
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
import React, {useState} from 'react';
import {Alert, SafeAreaView, Text, TouchableOpacity, View} from 'react-native';
import {GlobalStyles} from '@/app/styles/GlobalStyles';
import GamePicker, {GameConfig} from '../components/play/GamePicker';
import {gameService} from '@/app/services';
import {useMutation} from '../hooks/useMutation';
import {CreateGameRequest} from '../types/api';

export default function Play() {
    const [gameConfig, setGameConfig] = useState<GameConfig>({
        gameMode: 'X01',
        score: 301,
        players: ["test"],
    });
    const createGameMutation = useMutation(
        (gameData: CreateGameRequest) => gameService.createGame(gameData),
        {
            onSuccess: (game) => {
                Alert.alert(
                    'Game Created!',
                    `Successfully created game with id ${game.gameId}`,
                    [{text: 'OK'}]
                );
            },
            onError: (error) => {
                console.error('Failed to create game:', error);
            }
        }
    );

    const handleStartGame = async () => {
        const gameData: CreateGameRequest = {
            gameMode: gameConfig.gameMode,
            score: gameConfig.score,
            players: gameConfig.players,
        };

        await createGameMutation.mutate(gameData);
    };

    return (
        <SafeAreaView style={GlobalStyles.safeArea}>
            <View style={GlobalStyles.contentContainer}>
                <GamePicker onGameConfigChange={setGameConfig}/>

                <TouchableOpacity
                    style={[
                        GlobalStyles.primaryButton,
                        createGameMutation.loading && {opacity: 0.7}
                    ]}
                    onPress={handleStartGame}
                    disabled={createGameMutation.loading}
                >
                    <Text style={GlobalStyles.primaryButtonText}>
                        {createGameMutation.loading ? 'Creating Game...' : 'Start Game'}
                    </Text>
                </TouchableOpacity>

                {createGameMutation.error && (
                    <Text style={{color: 'red', marginTop: 10, textAlign: 'center'}}>
                        {createGameMutation.error}
                    </Text>
                )}
            </View>
        </SafeAreaView>
    );
}
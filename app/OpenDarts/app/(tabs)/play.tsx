import React, {useState} from 'react';
import {SafeAreaView, View} from 'react-native';
import {GlobalStyles} from '@/app/styles/GlobalStyles';
import GamePicker, {GameConfig} from '../components/play/GamePicker';
import {gameService} from '@/app/services';
import {useMutation} from '../hooks/useMutation';
import {CreateGameRequest} from '../types/api';
import {StartGameButton} from "@/app/components/play/StartGameButton";
import {router} from "expo-router";

export default function Play() {

    const [gameConfig, setGameConfig] = useState<GameConfig>({
        gameMode: 'X01',
        score: 301,
        players: ["test"],
    });

    const openGameView = (gameId: String) => {
        // @ts-ignore
        router.push(`/game/${gameId}`);
    };


    const createGameMutation = useMutation(
        (gameData: CreateGameRequest) => gameService.createGame(gameData),
        {
            onSuccess: (game) => {
                openGameView(game.gameId);
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

                <StartGameButton onPress={handleStartGame} loading={createGameMutation.loading}
                                 error={createGameMutation.error}></StartGameButton>
            </View>
        </SafeAreaView>
    );
}
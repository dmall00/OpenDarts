import React, {useState} from 'react';
import {SafeAreaView, View} from 'react-native';
import {router} from "expo-router";
import {CreateGameRequest} from '@/src/types/api';
import {useMutation} from '@/src/hooks/useMutation';
import {GlobalStyles} from "@/src/styles/GlobalStyles";
import GamePicker, {GameConfig} from "@/src/components/game/GamePicker";
import {StartGameButton} from "@/src/components/game/StartGameButton";
import {gameService} from "@/src/services/game/gameService";

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
        <SafeAreaView style={GlobalStyles.containerWithHeader}>
            <View style={GlobalStyles.contentContainer}>
                <GamePicker onGameConfigChange={setGameConfig}/>

                <StartGameButton onPress={handleStartGame} loading={createGameMutation.loading}
                                 error={createGameMutation.error}></StartGameButton>
            </View>
        </SafeAreaView>
    );
}
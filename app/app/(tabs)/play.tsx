import {useState} from 'react';
import {router} from "expo-router";
import {CreateGameRequest, GameSessionResponse} from '@/src/types/api';
import {useMutation} from '@/src/hooks/useMutation';
import {gameService} from "@/src/services/game/gameService";
import GamePicker from "@/src/components/game/creation/GamePicker";
import {StartGameButton} from "@/src/components/game/creation/StartGameButton";
import PageLayout from '@/src/components/ui/PageLayout';

export default function Play() {

    const [gameConfig, setGameConfig] = useState<CreateGameRequest>({
        gameMode: 'X01',
        score: 301,
        players: [{name: 'David'}], // Default player
    });

    const openGameView = (game: GameSessionResponse) => {
        router.push(`/game/${game.gameId}`);
    };


    const createGameMutation = useMutation(
        (gameData: CreateGameRequest) => gameService.createGame(gameData),
        {
            onSuccess: (game) => {
                openGameView(game);
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
        <PageLayout 
            title="Play"
            bottomContent={
                <StartGameButton
                    onPress={handleStartGame}
                    loading={createGameMutation.loading}
                    error={createGameMutation.error}
                />
            }
        >
            <GamePicker
                onGameConfigChange={setGameConfig}
            />
        </PageLayout>
    );
}
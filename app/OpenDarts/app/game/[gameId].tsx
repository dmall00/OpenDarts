import React from 'react';
import {useLocalSearchParams} from 'expo-router';
import GameView from "@/src/components/game/GameView";

export default function Game() {
    const {gameId, websocketUrl, fps, playerId} = useLocalSearchParams();

    return (
        <GameView
            gameId={gameId as string}
            playerId={playerId as string || 'default-player'}
            websocketUrl={websocketUrl as string}
            fps={fps ? parseInt(fps as string, 10) : undefined}
        />
    );
}

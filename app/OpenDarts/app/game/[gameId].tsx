import React from 'react';
import {useLocalSearchParams} from 'expo-router';
import GameView from "@/src/components/game/GameView";

export default function Game() {
    const {gameId, websocketUrl, fps, playerId} = useLocalSearchParams();

    return (
        <GameView
            gameId={gameId as string}
            playerId={playerId as string || '6466fa44-a5e3-4b34-b7d1-217e6c211025'}
            websocketUrl={websocketUrl as string}
            fps={fps ? parseInt(fps as string, 10) : undefined}
        />
    );
}

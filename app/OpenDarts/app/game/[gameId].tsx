import React from 'react';
import {useLocalSearchParams} from 'expo-router';
import GameView from "@/src/components/game/GameView";

export default function Game() {
    const {gameId, websocketUrl, fps} = useLocalSearchParams();

    return (
        <GameView
            gameId={gameId as string}
            websocketUrl={websocketUrl as string}
            fps={fps ? parseInt(fps as string, 10) : undefined}
        />
    );
}

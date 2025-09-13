import React from 'react';
import {useLocalSearchParams} from 'expo-router';
import GameView from "@/src/components/game/ingame/GameView";

export default function Game() {
    const {gameId, websocketUrl, fps, playerId} = useLocalSearchParams();

    return (
        <GameView
            gameId={gameId as string}
            playerId={playerId as string || '68cea790-920f-4e88-bf84-8b00031d86ac'}
            websocketUrl={websocketUrl as string}
            fps={fps ? parseInt(fps as string, 10) : undefined}
        />
    );
}

import React from 'react';
import {useLocalSearchParams} from 'expo-router';
import GameView from "@/src/components/game/ingame/GameView";

export default function Game() {
    const {playerId, gameId, websocketUrl, fps} = useLocalSearchParams();

    return (
        <GameView
            gameId={gameId as string}
            playerId={playerId as string}
            websocketUrl={websocketUrl as string}
            fps={fps ? parseInt(fps as string, 10) : undefined}
        />
    );
}

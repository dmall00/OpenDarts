import React from 'react';
import {useLocalSearchParams} from 'expo-router';
import GameView from "@/src/components/game/ingame/GameView";

export default function Game() {
    const {gameId, websocketUrl, fps, playerId} = useLocalSearchParams();

    return (
        <GameView
            gameId={gameId as string}
            playerId={playerId as string || 'a2d764bd-af37-4291-ab56-003873f8cf01'}
            websocketUrl={websocketUrl as string}
            fps={fps ? parseInt(fps as string, 10) : undefined}
        />
    );
}

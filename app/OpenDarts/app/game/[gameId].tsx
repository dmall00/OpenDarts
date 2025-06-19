import React from 'react';
import {useLocalSearchParams} from 'expo-router';
import GameView from "@/src/components/game/GameView";

export default function Game() {
    const {gameId} = useLocalSearchParams();

    return <GameView gameId={gameId as string}/>;
}

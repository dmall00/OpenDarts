import React from 'react';
import {Text, View} from 'react-native';

interface GameViewProps {
    gameId: string;
}

export default function GameView({gameId}: GameViewProps) {
    return (
        <View>
            <Text>Game View</Text>
            <Text>Game ID: {gameId}</Text>
            <Text>This is the game screen</Text>
        </View>
    );
}
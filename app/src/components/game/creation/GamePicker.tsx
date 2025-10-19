import React, {useState} from 'react';
import {Text, View} from 'react-native';
import Card from '@/src/components/ui/Card';
import Typography from '@/src/components/ui/Typography';
import SelectableOption from '@/src/components/ui/SelectableOption';
import PlayerInputPicker from './PlayerInputPicker';
import {CreateGameRequest, PlayerRequest} from "@/src/types/api";

interface GamePickerProps {
    onGameConfigChange?: (config: CreateGameRequest) => void;
}

export default function GamePicker(props: GamePickerProps) {

    const {onGameConfigChange} = props;
    const [selectedScore, setSelectedScore] = useState<301 | 501>(301);
    const [selectedMode] = useState<'X01'>('X01');
    const [players, setPlayers] = useState<PlayerRequest[]>([
        {name: 'David'} // default player
    ]);

    const handleScoreChange = (score: 301 | 501) => {
        setSelectedScore(score);
        const config: CreateGameRequest = {
            gameMode: selectedMode,
            score,
            players: players,
        };
        onGameConfigChange?.(config);
    };

    const handlePlayersChange = (updatedPlayers: PlayerRequest[]) => {
        setPlayers(updatedPlayers);
        const config: CreateGameRequest = {
            gameMode: selectedMode,
            score: selectedScore,
            players: updatedPlayers,
        };
        onGameConfigChange?.(config);
    };

    return (
        <Card variant="elevated">
            <View className="mb-lg">
                <Typography variant="title" className="text-slate-900 mb-2">🎯 New Game</Typography>
                <Typography variant="subtitle" className="text-slate-600">
                    Configure your dart game settings and start playing
                </Typography>
            </View>

            {/* Game Mode Section */}
            <View className="mb-lg">
                <Typography variant="label" className="mb-sm">Game Mode</Typography>
                <SelectableOption
                    label="X01 Classic"
                    isSelected={true}
                    isDisabled={true}
                />
            </View>

            {/* Starting Score Section */}
            <View className="mb-lg">
                <Typography variant="label" className="mb-sm">Starting Score</Typography>
                <View className="flex-row gap-sm">
                    <View className="flex-1">
                        <SelectableOption
                            label="301"
                            isSelected={selectedScore === 301}
                            onPress={() => handleScoreChange(301)}
                        />
                    </View>
                    <View className="flex-1">
                        <SelectableOption
                            label="501"
                            isSelected={selectedScore === 501}
                            onPress={() => handleScoreChange(501)}
                        />
                    </View>
                </View>
            </View>

            {/* Players Section */}
            <View className="mb-lg">
                <Typography variant="label" className="mb-sm">Players</Typography>
                <PlayerInputPicker
                    players={players}
                    onPlayersChange={handlePlayersChange}
                />
            </View>

            {/* Game Summary */}
            <View className="bg-emerald-50 border border-emerald-200 rounded-lg p-base mt-sm">
                <View className="flex-row items-center mb-xs">
                    <Text className="text-emerald-600 text-base font-bold mr-2">🎮</Text>
                    <Typography variant="label" className="text-emerald-700 text-sm">Game Summary</Typography>
                </View>
                <Typography variant="body" className="text-slate-800 font-semibold">
                    {selectedMode.toUpperCase()} • {selectedScore} points
                    • {players.length} {players.length === 1 ? 'PlayerRequest' : 'Players'}
                </Typography>
            </View>
        </Card>
    );
}

import React, {useState} from 'react';
import {Alert, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {useAnimatedStyle, useSharedValue, withSpring} from 'react-native-reanimated';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import Typography from '@/src/components/ui/Typography';

interface Player {
    name: string;
}

interface PlayerInputPickerProps {
    players: Player[];
    onPlayersChange: (players: Player[]) => void;
}

const PlayerInputPicker: React.FC<PlayerInputPickerProps> = ({players, onPlayersChange}) => {
    const [newPlayerName, setNewPlayerName] = useState('');

    const addPlayer = () => {
        if (!newPlayerName.trim()) {
            Alert.alert('Error', 'Please enter a player name');
            return;
        }

        const newPlayer: Player = {
            name: newPlayerName.trim()
        };

        onPlayersChange([...players, newPlayer]);
        setNewPlayerName('');
    };

    const removePlayer = (name: string) => {
        if (players.length <= 1) {
            Alert.alert('Error', 'At least one player is required');
            return;
        }
        onPlayersChange(players.filter(player => player.name !== name));
    };

    const movePlayer = (fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return;

        const newPlayers = [...players];
        const [movedPlayer] = newPlayers.splice(fromIndex, 1);
        newPlayers.splice(toIndex, 0, movedPlayer);
        onPlayersChange(newPlayers);
    };

    const shufflePlayers = () => {
        const shuffledPlayers = [...players];
        for (let i = shuffledPlayers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
        }
        onPlayersChange(shuffledPlayers);
    };

    // Render a draggable player item
    const DraggablePlayerItem = ({player, index}: { player: Player, index: number }) => {
        const translateY = useSharedValue(0);
        const scale = useSharedValue(1);
        const active = useSharedValue(false);
        const startPosition = useSharedValue(index * 60); // Assuming each item is about 60px tall

        // Pan gesture handler
        const panGesture = Gesture.Pan()
            .onBegin(() => {
                active.value = true;
                scale.value = withSpring(1.02);
            })
            .onUpdate((event) => {
                translateY.value = event.translationY;
            })
            .onEnd(() => {
                scale.value = withSpring(1);
                active.value = false;

                // Calculate the target position based on the final Y position
                const finalPosition = startPosition.value + translateY.value;
                const targetIndex = Math.max(
                    0,
                    Math.min(players.length - 1,
                        Math.round(finalPosition / 60)
                    )
                );

                if (targetIndex !== index) {
                    movePlayer(index, targetIndex);
                }

                translateY.value = withSpring(0);
                startPosition.value = targetIndex * 60;
            });

        // Long press gesture handler
        const longPressGesture = Gesture.LongPress()
            .minDuration(200)
            .onBegin(() => {
                active.value = true;
                scale.value = withSpring(1.02);
            });

        const composedGesture = Gesture.Simultaneous(panGesture, longPressGesture);

        const animatedStyle = useAnimatedStyle(() => {
            return {
                transform: [
                    {translateY: translateY.value},
                    {scale: scale.value},
                ],
                zIndex: active.value ? 1 : 0,
                opacity: active.value ? 0.9 : 1,
            };
        });

        return (
            <GestureDetector gesture={composedGesture}>
                <Animated.View
                    className={`bg-white rounded-lg border border-slate-200 p-3 mb-2 flex-row items-center`}
                    style={animatedStyle}
                >
                    <View className="mr-3 opacity-70">
                        <MaterialCommunityIcons name="drag" size={20} color="#94a3b8"/>
                    </View>
                    <View className="flex-1">
                        <Typography variant="body">{player.name}</Typography>
                    </View>
                    <TouchableOpacity
                        className="ml-2 p-1"
                        onPress={() => removePlayer(player.name)}
                    >
                        <MaterialCommunityIcons name="close" size={20} color="#ef4444"/>
                    </TouchableOpacity>
                </Animated.View>
            </GestureDetector>
        );
    };

    return (
        <View>
            <View className="flex-row items-center mb-3">
                <TextInput
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-4 py-3 mr-2"
                    placeholder="Enter player name"
                    value={newPlayerName}
                    onChangeText={setNewPlayerName}
                    onSubmitEditing={addPlayer}
                />
                <TouchableOpacity
                    className="bg-slate-200 rounded-lg px-3 py-3 mr-2"
                    onPress={shufflePlayers}
                >
                    <MaterialCommunityIcons name="shuffle" size={24} color="#475569"/>
                </TouchableOpacity>
                <TouchableOpacity
                    className="bg-emerald-500 rounded-lg px-4 py-3"
                    onPress={addPlayer}
                >
                    <Text className="text-white font-semibold">Add</Text>
                </TouchableOpacity>
            </View>

            {players.length > 0 ? (
                <View className="mt-2">
                    {players.map((player, index) => (
                        <DraggablePlayerItem
                            key={player.name}
                            player={player}
                            index={index}
                        />
                    ))}
                </View>
            ) : (
                <View
                    className="bg-slate-100 border border-dashed border-slate-300 rounded-lg p-4 items-center justify-center">
                    <Typography variant="body" className="text-slate-500">No players added yet</Typography>
                </View>
            )}
        </View>
    );
};

export default PlayerInputPicker;
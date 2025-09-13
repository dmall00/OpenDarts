import {useEffect} from 'react';
import {Stack} from 'expo-router';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {useSettingsStore} from '@/src/stores/settingsStore';
import '../global.css';

export default function RootLayout() {
    const loadSettings = useSettingsStore(state => state.loadSettings);

    useEffect(() => {
        loadSettings();
    }, []);

    return (
        <SafeAreaProvider>
            <Stack screenOptions={{
                headerShown: false,
            }}>
                <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
                <Stack.Screen name="game/[playerId]/[gameId]" options={{headerShown: false}}/>
                <Stack.Screen name="+not-found"/>
            </Stack>
        </SafeAreaProvider>
    );
}

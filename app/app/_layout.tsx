import {useEffect} from 'react';
import {Stack} from 'expo-router';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {LogBox} from 'react-native';
import {useSettingsStore} from '@/src/stores/settingsStore';
import {initializeModels} from '@/src/services/ml';
import '../global.css';

LogBox.ignoreLogs([
    'You are setting the style `{ %s: ... }` as a prop',
    'shadowOffset'
]);

export default function RootLayout() {
    const loadSettings = useSettingsStore(state => state.loadSettings);

    useEffect(() => {
        const initializeApp = async () => {
            await loadSettings();
            const {apiService} = await import('@/src/services/api/api');
            apiService.refreshConfig();

            // Initialize ML models
            console.log('🤖 Initializing ML models...');
            const modelResult = await initializeModels();
            if (modelResult.error) {
                console.error('❌ Failed to load ML models:', modelResult.error);
            } else {
                console.log('✅ ML models loaded successfully!');
            }
        };

        initializeApp();
    }, []);

    return (
        <GestureHandlerRootView style={{flex: 1}}>
            <SafeAreaProvider>
                <Stack screenOptions={{
                    headerShown: false,
                }}>
                    <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
                    <Stack.Screen name="game/[gameId]" options={{headerShown: false}}/>
                    <Stack.Screen name="+not-found"/>
                </Stack>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

import {Stack} from 'expo-router';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Colors} from '@/src/styles/Colors';

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <Stack screenOptions={{
                headerShown: false,
                contentStyle: {backgroundColor: Colors.slate[100]}
            }}>
                <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
                <Stack.Screen name="+not-found"/>
            </Stack>
        </SafeAreaProvider>
    );
}

import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {Colors} from '@/src/styles/Colors';

export default function RootLayout() {
    return (
        <>
            <StatusBar style="dark" backgroundColor={Colors.slate[100]}/>
            <Stack screenOptions={{
                headerShown: false,
                contentStyle: {backgroundColor: Colors.slate[100]}
            }}>
                <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
                <Stack.Screen name="+not-found"/>
            </Stack>
        </>
    );
}

import {Link, Stack} from 'expo-router';
import {View} from 'react-native';

export default function NotFoundScreen() {
    return (
        <>
            <Stack.Screen options={{title: 'Oops! Not Found'}}/>
            <View className="flex-1 bg-slate-800 justify-center items-center">
                <Link href="/" className="text-xl underline text-white">
                    Not found. Go back to Home screen!
                </Link>
            </View>
        </>
    );
}
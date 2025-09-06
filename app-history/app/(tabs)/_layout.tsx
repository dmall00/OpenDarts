import {Tabs} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';

export default function TabLayout() {
    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: '#10b981',
            tabBarInactiveTintColor: '#94a3b8',
            headerShown: false,
            tabBarStyle: {
                backgroundColor: '#ffffff',
                borderTopColor: '#e5e7eb',
                borderTopWidth: 1,
                height: 65,
                paddingBottom: 8,
                paddingTop: 8,
                marginBottom: 5,
                position: 'absolute',
                shadowColor: '#000',
                shadowOffset: {
                    width: 0,
                    height: -2,
                },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 5,
            },
            tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: '500',
                marginTop: 2,
                textAlign: 'center',
            },
            tabBarIconStyle: {
                alignSelf: 'center',
            },
            tabBarItemStyle: {
                paddingVertical: 4,
                paddingHorizontal: 4,
                minHeight: 45,
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignContent: 'center',
            },
        }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({color, size, focused}) => (
                        <Ionicons
                            name={focused ? "home" : "home"}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="stats"
                options={{
                    title: 'Stats',
                    tabBarIcon: ({color, size, focused}) => (
                        <Ionicons
                            name={focused ? "bar-chart" : "bar-chart-outline"}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="play"
                options={{
                    title: 'Play',
                    tabBarIcon: ({color, size, focused}) => (
                        <Ionicons
                            name={focused ? "play" : "play-outline"}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="social"
                options={{
                    title: 'Social',
                    tabBarIcon: ({color, size, focused}) => (
                        <Ionicons
                            name={focused ? "people" : "people-outline"}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({color, size, focused}) => (
                        <Ionicons
                            name={focused ? "person" : "person-outline"}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}

import {Tabs} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {Colors} from '@/src/styles/Colors';
import {Layout} from '@/src/styles/Layout';
import Header from '@/src/components/common/Header';
import HeaderText from '@/src/components/common/HeaderText';

export default function TabLayout() {
    return (
        <>
            <Header>
                <HeaderText title="OpenDarts"/>
            </Header>
            <Tabs screenOptions={{
                tabBarActiveTintColor: Colors.tabBar.active,
                tabBarInactiveTintColor: Colors.tabBar.inactive, headerShown: false,
                tabBarStyle: {
                    backgroundColor: Colors.tabBar.background,
                    borderTopColor: Colors.tabBar.border,
                    borderTopWidth: 1,
                    height: Layout.tabBar.height,
                    paddingBottom: Layout.tabBar.paddingBottom,
                    paddingTop: Layout.tabBar.paddingTop,
                    marginBottom: Layout.tabBar.marginBottom,
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
        </>);
}

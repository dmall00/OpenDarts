import {StyleSheet} from 'react-native';
import {Colors} from './Colors';

export const HeaderStyles = StyleSheet.create({
    safeAreaTop: {
        backgroundColor: '#000000',
    }, container: {
        backgroundColor: Colors.tabBar.background,
        borderBottomColor: Colors.tabBar.border,
        borderBottomWidth: 1,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        paddingTop: 10,
        paddingBottom: 15,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftContent: {
        flex: 1,
        alignItems: 'flex-start',
    },
    centerContent: {
        flex: 2,
        alignItems: 'center',
    },
    rightContent: {
        flex: 1,
        alignItems: 'flex-end',
    },
    titleContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.tabBar.active,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.tabBar.inactive,
        marginTop: 4,
    },
});

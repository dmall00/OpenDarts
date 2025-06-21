import {StyleSheet} from 'react-native';
import {Colors} from './Colors';
import {BorderRadius, Spacing, Typography} from './Layout';

export const GlobalStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    }, containerWithHeader: {
        flex: 1,
        backgroundColor: Colors.background,
        padding: 0,
    },
    safeAreaBottom: {
        backgroundColor: Colors.background,
    },
    headerContentContainer: {
        flex: 1,
        padding: Spacing.base,
    },
    contentContainer: {
        padding: Spacing.base,
        paddingBottom: Spacing['3xl'],
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: BorderRadius.xl,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        padding: Spacing.lg,
        marginBottom: Spacing.base,
    },

    title: {
        fontSize: Typography.sizes['2xl'],
        fontWeight: Typography.weights.bold,
        color: Colors.slate[800],
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: Typography.sizes.base,
        color: Colors.slate[600],
        marginBottom: Spacing.lg,
    },
    bodyText: {
        fontSize: Typography.sizes.base,
        color: Colors.slate[700],
        lineHeight: 24,
    },

    primaryButton: {
        backgroundColor: Colors.emerald[500],
        borderRadius: BorderRadius.xl,
        paddingVertical: Spacing.base,
        paddingHorizontal: Spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: Typography.sizes.lg,
        fontWeight: Typography.weights.semibold,
    },

    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -Spacing.sm,
    },
    gridItem: {
        width: '50%',
        paddingHorizontal: Spacing.sm,
        marginBottom: Spacing.base,
    },
});

import {StyleSheet} from 'react-native';
import {Colors} from './Colors';
import {BorderRadius, Spacing, Typography} from './Layout';

export const GamePickerStyles = StyleSheet.create({
    section: {
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: Typography.sizes.lg,
        fontWeight: Typography.weights.semibold,
        color: Colors.slate[800],
        marginBottom: Spacing.sm,
    },
    optionsRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    optionButton: {
        borderWidth: 2,
        borderColor: Colors.slate[300],
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
    },
    scoreOption: {
        flex: 1,
    },
    selectedOption: {
        borderColor: Colors.emerald[500],
        backgroundColor: Colors.emerald[50],
    },
    optionText: {
        fontSize: Typography.sizes.base,
        fontWeight: Typography.weights.medium,
        color: Colors.slate[700],
    },
    selectedOptionText: {
        color: Colors.emerald[600],
        fontWeight: Typography.weights.semibold,
    },
    summaryCard: {
        backgroundColor: Colors.slate[50],
        borderRadius: BorderRadius.md,
        padding: Spacing.base,
        marginTop: Spacing.sm,
    },
    summaryTitle: {
        fontSize: Typography.sizes.sm,
        fontWeight: Typography.weights.semibold,
        color: Colors.slate[600],
        marginBottom: Spacing.xs,
    },
    summaryText: {
        fontSize: Typography.sizes.base,
        color: Colors.slate[800],
        fontWeight: Typography.weights.medium,
    },
});

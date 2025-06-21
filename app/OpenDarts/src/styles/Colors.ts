export const Colors = {
    emerald: {
        50: '#ecfdf5',
        100: '#d1fae5',
        500: '#10b981',
        600: '#059669',
    },
    orange: {
        50: '#fff7ed',
        100: '#ffedd5',
        500: '#f97316',
        600: '#ea580c',
    },
    slate: {
        50: '#f8fafc',
        100: '#f1f5f9',
        300: '#cbd5e1',
        400: '#94a3b8',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
    },
    tabBar: {
        background: '#ffffff',
        border: '#e5e7eb',
        active: '#10b981',
        inactive: '#94a3b8',
        inactiveBackground: 'transparent',
        activeBackground: '#ecfdf5',
    },
    background: '#ffffff',
};

export const Gradients = {
    emerald: ['#10b981', '#059669'] as const,
    orange: ['#f97316', '#ea580c'] as const,
    emeraldToOrange: ['#10b981', '#f97316'] as const,
    slate: ['#334155', '#1e293b'] as const,
};

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,jsx,ts,tsx}",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                enpmerald: {
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
            },
            spacing: {
                xs: 4,
                sm: 8,
                md: 12,
                base: 16,
                lg: 20,
                xl: 24,
                '2xl': 32,
                '3xl': 48,
            },
            borderRadius: {
                sm: 8,
                md: 12,
                lg: 16,
                xl: 20,
                '2xl': 24,
                full: 9999,
            },
            fontSize: {
                xs: 12,
                sm: 14,
                base: 16,
                lg: 18,
                xl: 20,
                '2xl': 24,
                '3xl': 30,
            },
        },
    },
    plugins: [],
}


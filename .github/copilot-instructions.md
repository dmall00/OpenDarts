OpenDarts is a comprehensive dart application for playing, practicing, and socializing with fellow dart enthusiasts. The app provides everything you need for a complete dart experience, from game management and score tracking to social features and automated scoring capabilities.

It consists of a react native expo app in /app, a kotlin spring boot backend in /backend, and a python autoscore server in /autoscore-server.

## Code Standards 

Never add any comments that are not necessary. The code should be self-explanatory. If you find yourself adding comments to explain what the code does, consider refactoring the code to make it clearer.

### Kotlin

For kotlin code, we follow the [Kotlin Coding Conventions](https://kotlinlang.org/docs/coding-conventions.html). It is always a goal to keep the code clean and readable. Please use meaningful names for variables, functions, and classes. Avoid using magic numbers and hard-coded values. Use constants or enums instead.
Use proper indentation and spacing to enhance readability. Follow the standard formatting rules for Kotlin code. Try to be kotlin idiomatic as much as possible. Prefer using Kotlin's standard library functions and features over Java-style code.

### Python

For python code, we follow the [PEP 8](https://peps.python.org/pep-0008/) style guide. Use meaningful names for variables, functions, and classes. Avoid using magic numbers and hard-coded values. Use constants or enums instead. 

### React Native / TypeScript

Write code that is easy to read and understand. Use meaningful names for variables, functions, and components. When writing components try to keep them small and focused on a single responsibility. Avoid large components that do too many things. Use hooks and functional components instead of class components whenever possible. Follow the style guide of this app.

#### Component Style Guide

**Component Structure & Organization**
- Organize components in a clear hierarchy: `ui/` for reusable components, `game/`, `auth/`, `common/` for domain-specific components
- Export reusable UI components from `src/components/ui/index.ts` for easy imports
- Use descriptive file and component names that clearly indicate their purpose

**Component Architecture**
```tsx
// ✅ Good: Functional component with clear interface
interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
}

export default function Button({ 
    title, 
    variant = 'primary', 
    size = 'medium', 
    loading = false,
    disabled,
    style,
    ...props 
}: ButtonProps) {
    // Component logic here
}
```

**Styling Conventions**
- Use NativeWind (Tailwind CSS) for styling with semantic class names
- Define custom colors and spacing in `tailwind.config.js` for consistent design system
- Use conditional styling functions for dynamic styles:
```tsx
const getButtonStyles = () => {
    const baseStyles = "rounded-xl py-md px-lg items-center justify-center";
    const variantStyles = {
        primary: "bg-emerald-500 active:bg-emerald-600",
        secondary: "bg-slate-200 active:bg-slate-300"
    };
    return `${baseStyles} ${variantStyles[variant]}`;
};
```

**Props & Interface Design**
- Always define TypeScript interfaces for component props
- Extend React Native component props when appropriate (`extends TouchableOpacityProps`, `extends ViewProps`)
- Use optional props with sensible defaults
- Destructure props with defaults in the function signature
- Use descriptive boolean prop names: `isSelected`, `isDisabled`, `isConnected`

**Component Patterns**
- **Layout Components**: Use `PageLayout`, `Container`, `Card` for consistent spacing and structure
- **UI Components**: Create reusable components like `Button`, `Typography`, `SelectableOption` with variant systems
- **Compound Components**: Break complex components into smaller, focused sub-components
- **Platform Handling**: Use platform-specific files (`.web.tsx`) and `isWeb()` utility for cross-platform compatibility

**State Management**
- Use React hooks (`useState`, `useEffect`, `useCallback`) for local state
- Prefer custom hooks for complex logic: `useWebSocket`, `useGameCapture`, `useCameraUI`
- Use Zustand stores for global state management
- Keep component state minimal and focused

**Styling Best Practices**
- Use semantic spacing values: `xs`, `sm`, `md`, `base`, `lg`, `xl`, `2xl`, `3xl`
- Consistent color palette: emerald for primary actions, slate for neutral elements, orange/red for warnings
- Use `activeOpacity={0.7}` for touchable elements
- Apply shadows and elevation consistently: `shadow-sm`, `shadow-md`, `shadow-lg`

**Color Palette & Usage**
Follow the defined color system in `tailwind.config.js` for consistent branding:

*Primary Colors (Emerald):*
- `emerald-500` (#10b981) - Primary buttons, active states, success indicators
- `emerald-600` (#059669) - Hover/pressed states for primary actions
- `emerald-50` (#ecfdf5) - Light backgrounds for selected states
- `emerald-700` - Text for selected/active elements

*Neutral Colors (Slate):*
- `slate-50` (#f8fafc) - Light backgrounds, disabled states
- `slate-100` (#f1f5f9) - Subtle backgrounds
- `slate-200` (#e2e8f0) - Borders, dividers
- `slate-300` (#cbd5e1) - Default borders, inactive elements
- `slate-400` (#94a3b8) - Placeholder text, inactive icons
- `slate-700` (#334155) - Body text
- `slate-800` (#1e293b) - Dark text, headings

*Accent Colors:*
- `orange-500` (#f97316) - Warning states, double multipliers
- `orange-50` (#fff7ed) - Warning backgrounds
- `red-500` - Error states, danger actions
- `green-500` - Success states (alternative to emerald)
- `amber-500` - Caution, connecting states

*Special Colors:*
- `tabBar-active` (#10b981) - Active tab indicators
- `tabBar-inactive` (#94a3b8) - Inactive tab text/icons
- `background` (#ffffff) - Main app background

*Usage Examples:*
```tsx
// ✅ Primary action button
<Button variant="primary" /> // bg-emerald-500

// ✅ Selected option
<SelectableOption isSelected={true} /> // border-emerald-500 bg-emerald-50

// ✅ Neutral card
<Card variant="default" /> // bg-white border-slate-200

// ✅ Warning state
<Typography variant="warning" /> // text-amber-600

// ✅ Error feedback
<Typography variant="error" /> // text-red-500
```

**Component Composition**
```tsx
// ✅ Good: Composable, reusable components
<Card variant="elevated" padding="large">
    <Typography variant="title">Game Settings</Typography>
    <View className="mt-base">
        <SelectableOption 
            label="501 Points"
            isSelected={score === 501}
            onPress={() => setScore(501)}
        />
    </View>
    <Button 
        title="Start Game"
        variant="success"
        onPress={handleStart}
        loading={isLoading}
    />
</Card>
```

**Error Handling**
- Use `useErrorHandler` hook for consistent error display
- Show loading states with `loading` props
- Provide user feedback for async operations

**Accessibility & UX**
- Use semantic component names and proper TouchableOpacity usage
- Provide visual feedback for interactions (active states, disabled states)
- Keep touch targets appropriately sized (minimum 44pt)
- Use consistent icons from `@expo/vector-icons` 

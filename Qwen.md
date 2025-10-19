OpenDarts is a comprehensive dart application for playing, practicing, and socializing with fellow dart enthusiasts. The app provides everything you need for a complete dart experience, from game management and score tracking to social features and automated scoring capabilities.

## Architecture Overview

### Three-Tier System
1. **React Native App** (`/app`) - Mobile client with camera-based autoscoring
2. **Kotlin Backend** (`/backend`) - Spring Boot server for game orchestration and autoscore stabilization
3. **Python AutoScore Server** (`/autoscore-server`) - WebSocket server for YOLO-based dart detection

### Critical Data Flow (AutoScore Pipeline)
```
Mobile Camera → Binary WS (App→Backend) → Backend forwards → Python AutoScore Server
                                              ↓
Mobile App ← Game State Updates ← Backend Stabilizer ← Detection Results
```

**Key Insight**: The backend acts as a **stabilizer** between noisy YOLO detections and confirmed game state. The `AutoScoreStabilizer` service uses a frame-based tracking system with pending/confirmed dart states to prevent false positives from camera jitter or lighting changes.

### WebSocket Architecture
- **App ↔ Backend**: `/ws/app/{playerId}/{gameId}` - Bidirectional binary protocol for images + JSON for game state
- **Backend ↔ Python**: Separate WebSocket client (`AutoscoreWebSocketClient`) forwards images to Python server
- **Binary Protocol**: Custom format with metadata header + image data (see `app/src/utils/binaryProtocol.ts`)

## Developer Workflows

### Running the Full Stack
```bash
# 1. Backend (from /backend)
./mvnw --pl core -amd clean compile spring-boot:run

# 2. AutoScore Server (from /autoscore-server)
uv sync
autoscore-server

# 3. Mobile App (from /app)
npm ci
npx expo start
```

### Backend Development
- **Maven Multi-Module**: Parent POM in `/backend`, main code in `/backend/core`
- **Run Tests**: `./mvnw test`
- **Build**: `./mvnw clean package`
- **Active Profiles**: `application.yml` (prod), `application-dev.yml` (dev)
- **HTTPS by default**: Uses self-signed cert in `keystore/opendarts.p12`

### Python Development
- **Package Manager**: Use `uv` (not pip) for dependency management
- **CLI Tools**: `dart-image-scorer`, `dart-calibration-visualizer` for testing detection
- **Run Server**: `autoscore-server` (entry point in `pyproject.toml`)

### Mobile App Development
- **Start Dev Server**: `npx expo start`
- **Run on Android**: `npx expo run:android`
- **Run on iOS**: `npx expo run:ios`
- **Web Preview**: `npx expo start --web`

## Code Standards

Never add unnecessary comments. The code should be self-explanatory. If you find yourself adding comments to explain what the code does, consider refactoring the code to make it clearer.

### Kotlin (Backend)

Follow [Kotlin Coding Conventions](https://kotlinlang.org/docs/coding-conventions.html). Use meaningful names, avoid magic numbers, prefer constants/enums. Be idiomatic - use Kotlin stdlib over Java-style code.

**Key Patterns**:
- **Game Mode Registry Pattern**: `GameModeRegistry` uses auto-discovery of `DartGameModeHandler` implementations (e.g., `X01Game`). Add new game modes by implementing the interface and annotating with `@Service`.
- **Event-Driven Architecture**: Spring's `ApplicationEventPublisher` for cross-service communication (e.g., `TurnSwitchDetectedEvent`, `ManualDartAdjustment`).
- **Stabilization State Machine**: `AutoScoreStabilizer` maintains per-player `DetectionState` with pending/confirmed/reverted dart tracking. Key constants: `REQUIRED_APPEARANCES = 2`, `MAX_FRAMES_WITHOUT_APPEARANCE = 3`.
- **WebSocket Handlers**: Extend `TextWebSocketHandler` for custom WS logic (see `AutoscoreWebSocketReceiver`).

**Service Layer Structure**:
```
GameOrchestrator (orchestrates game flow)
  ↓
GameModeRegistry → DartGameModeHandler (X01Game, etc.)
  ↓
AutoScoreStabilizer (frame-based dart tracking)
  ↓
TurnSwitchDetector (miss detection, turn logic)
```

### Python (AutoScore Server)

Follow [PEP 8](https://peps.python.org/pep-0008/). Use meaningful names, avoid magic numbers, prefer constants/enums.

**Key Patterns**:
- **Handler Pattern**: `BaseHandler[REQ, RES]` with generic request/response types. Handlers registered in `MessageRouter`.
- **WebSocket Server**: Uses `websockets` library with async/await. Main server in `DartWebSocketServer`.
- **YOLO Pipeline**: Image → Preprocessing → YOLO Detection → Calibration → Scoring (details in dart-sense docs).
- **Settings**: Pydantic `Settings` classes with environment variable support (see `autoscore/config/settings.py`).

**Testing**: Use `pytest` with async support. Example: `tests/test_server_it.py` for integration tests.

### React Native / TypeScript (Mobile App)

Write clean, readable code. Use meaningful names. Keep components small and focused. Use hooks and functional components.

**State Management**:
- **Zustand**: Global state stores in `/src/stores` (e.g., `gameStore`, `settingsStore`).
- **Custom Hooks**: Encapsulate complex logic (`useWebSocket`, `useGameCapture`, `useGameMessages`).

**Service Layer**:
- **Singleton Pattern**: `CameraService.getInstance()` for camera management across screens.
- **WebSocket Abstraction**: `useWebSocket` hook wraps `react-use-websocket` with autoreconnect, heartbeat, and binary message support.
- **Binary Protocol**: Custom format for sending images with metadata (see `utils/binaryProtocol.ts`).

**Platform Handling**:
- Use `isWeb()` utility to conditionally load native modules.
- Platform-specific files: `.web.tsx` suffix for web-only implementations.
- Camera features disabled on web (autoscoring requires native camera).

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

# AutoScore Client-Side Migration - Quick Summary

## What We're Doing

Moving YOLO dart detection from Python server to React Native client using TensorFlow Lite.

## Why

1. **Faster**: No network latency, instant feedback
2. **Cheaper**: No Python server hosting costs
3. **Offline**: Works without internet
4. **Scalable**: Server load independent of FPS

## Architecture Change

### Before
```
Camera → Backend → Python YOLO → Backend Stabilizer → Game State
         (Binary WS)              (30 msgs/sec)
```

### After
```
Camera → TFLite YOLO → Client Stabilizer → Backend → Game State
         (on-device)    (2-3 msgs/turn)    (verification)
```

## Core Components to Build

### 1. ML Pipeline (Phase 1-3)
- Load TFLite models in React Native
- Preprocess camera images
- Run YOLO inference
- Parse detections
- Calculate calibration (homography matrix)
- Score darts based on board position

### 2. Stabilization (Phase 4)
- Port Kotlin `AutoScoreStabilizer` to TypeScript
- Track pending darts (must appear 2+ times)
- Track confirmed darts
- Handle reverted darts (corrections)
- Detect missed darts and turn switches

### 3. Backend Changes (Phase 5)
- Accept confirmed darts instead of raw images
- Light validation (score range, max 3 darts)
- Remove Python server dependency (eventually)

### 4. Settings & UI (Phase 6)
- Calibration screen
- Settings toggle for modes
- Performance monitoring

## Implementation Order

**Week 1-2: ML Foundation**
1. TFLite integration (Step 1.1)
2. Image preprocessing (Step 1.2)
3. YOLO parser (Step 1.3)
4. Calibration pipeline (Steps 2.1-2.3)
5. Scoring logic (Steps 3.1-3.2)

**Week 2-3: Stabilization & Integration**
6. Dart stabilizer (Step 4.1)
7. Turn detector (Step 4.2)
8. Wire into camera flow (Step 4.3)
9. Backend API changes (Step 5.1)

**Week 3-4: Polish & Testing**
10. Settings UI (Step 6.1-6.2)
11. Testing (Phase 7)
12. Performance optimization

## Key Files to Create

```
app/src/services/ml/
├── modelLoader.ts                    # Load TFLite models
├── imagePreprocessor.ts             # Resize, normalize images
├── yoloParser.ts                    # Parse model outputs
├── dartDetectionPipeline.ts         # Orchestrate full pipeline
├── calibration/
│   ├── boardCalibrationService.ts   # Detect calibration points
│   ├── homographyCalculator.ts      # Calculate transformation matrix
│   └── coordinateTransformer.ts     # Transform coords
└── scoring/
    ├── dartScoreCalculator.ts       # Map position → score
    └── dartScoringService.ts        # Orchestrate scoring

app/src/services/autoscore/
├── dartStabilizer.ts                # Port of Kotlin stabilizer
└── turnSwitchDetector.ts            # Detect misses, turn end
```

## Key Interfaces

```typescript
// Detection result from YOLO
interface DartDetection {
    originalPosition: { x: number; y: number; confidence: number };
    transformedPosition: { x: number; y: number };
    dartScore: {
        multiplier: number;  // 0-3
        singleValue: number; // 0-20, 25, 50
    };
}

// Stabilizer state
interface DetectionState {
    confirmedDarts: ConfirmedDart[];     // Sent to backend
    pendingDarts: PendingDart[];         // Need more frames
    revertedDarts: ConfirmedDart[];      // Blocked after correction
    frameIndex: number;
    isNewTurnAndBoardCleared: boolean;
}

// Backend message
interface ConfirmedDartMessage {
    type: 'CONFIRMED_DART';
    score: number;
    multiplier: number;
    confidence: number;
    timestamp: number;
    playerId: string;
    sessionId: string;
}
```

## Critical Constants (from Kotlin/Python)

```typescript
// Stabilization
const REQUIRED_APPEARANCES = 2;           // Dart must appear in 2 frames
const MAX_FRAMES_WITHOUT_APPEARANCE = 3;  // Max gap before removing pending
const DISTANCE_THRESHOLD = 0.04;          // Same dart position tolerance

// Turn detection
const EMPTY_FRAMES_THRESHOLD = 5;         // Frames with empty board = miss

// Confidence
const CONFIDENCE_THRESHOLD = 0.35;        // Min confidence for normal darts
const MISS_DART_CONFIDENCE_THRESHOLD = 0.8; // Higher threshold for misses
```

## Testing Strategy

1. **Unit tests**: Test each component in isolation
2. **Integration tests**: Run pipeline on real images from `autoscore-images/`
3. **Comparison**: Verify accuracy matches Python server
4. **Performance**: Target <100ms per frame, 1-5 FPS

## Rollout Plan

1. **Beta (Month 1)**: 10% of users with feature flag
2. **Gradual (Month 2-3)**: Increase to 50% → 100%
3. **Stable (Month 4-6)**: Monitor, optimize
4. **Deprecate Python (Month 7+)**: Remove server dependency

## Success Metrics

- ✅ <100ms inference time
- ✅ ≥90% accuracy vs Python baseline
- ✅ ≥95% calibration success rate
- ✅ <1 second perceived latency
- ✅ <10% battery usage increase

## Start Here

**First 3 Steps**:
1. Install `@tensorflow/tfjs-react-native` and verify model loads
2. Implement `imagePreprocessor.ts` 
3. Test YOLO inference with a single image

See `AUTOSCORE_CLIENT_MIGRATION_PLAN.md` for detailed step-by-step instructions.

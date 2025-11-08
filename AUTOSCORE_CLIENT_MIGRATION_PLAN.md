# AutoScore Client-Side Migration Plan

## Overview
This document outlines the step-by-step migration from a Python server-based autoscoring system to a client-side React Native implementation using TensorFlow Lite models.

### Current Architecture
```
Mobile Camera → Backend (WS) → Python Server (YOLO) → Backend Stabilizer → Game State
```

### Target Architecture
```
Mobile Camera → TFLite Model → Client Stabilizer → Backend (confirmed darts) → Game State
```

---

## Phase 1: Core Infrastructure Setup

### Step 1.1: TensorFlow Lite Integration
**Goal**: Set up TensorFlow Lite for React Native and verify model loading

**Tasks**:
- [ ] Install dependencies: `@tensorflow/tfjs`, `@tensorflow/tfjs-react-native`, `expo-gl`
- [ ] Create model loading service at `app/src/services/ml/modelLoader.ts`
- [ ] Implement model initialization with the prepared TFLite models
- [ ] Add error handling for model loading failures
- [ ] Create test to verify model loads successfully

**Files to create**:
- `app/src/services/ml/modelLoader.ts`
- `app/src/services/ml/types.ts` (for ML-related TypeScript interfaces)

**Key considerations**:
- Models should be loaded once at app startup and cached
- Handle both calibration and dart detection models
- Implement graceful fallback if models fail to load

---

### Step 1.2: Image Preprocessing Service
**Goal**: Port Python image preprocessing logic to TypeScript

**Tasks**:
- [ ] Create `app/src/services/ml/imagePreprocessor.ts`
- [ ] Implement image resizing (matching Python's `ImagePreprocessor`)
- [ ] Add cropping functionality
- [ ] Implement tensor conversion from camera frames
- [ ] Add normalization (if required by YOLO model)

**Reference Python code**:
- `detector/service/image_preprocessor.py`

**Files to create**:
- `app/src/services/ml/imagePreprocessor.ts`

**Key considerations**:
- Image preprocessing must match Python implementation exactly
- Performance optimization: use native modules if available
- Input: camera blob/frame → Output: tensor ready for model

---

### Step 1.3: YOLO Result Parser
**Goal**: Parse TFLite model outputs into dart positions and calibration points

**Tasks**:
- [ ] Create `app/src/services/ml/yoloParser.ts`
- [ ] Implement bounding box parsing from model output tensors
- [ ] Extract dart positions (class_id, confidence, center_x, center_y)
- [ ] Extract calibration points (for board detection)
- [ ] Apply confidence thresholds
- [ ] Port class mapping logic from `YoloDartClassMapping`

**Reference Python code**:
- `detector/service/parser/yolo_result_parser.py`
- `detector/model/yolo_dart_class_mapping.py`

**Files to create**:
- `app/src/services/ml/yoloParser.ts`
- `app/src/services/ml/constants.ts` (for class IDs, thresholds)

**Key interfaces** (from Python models):
```typescript
interface YoloDetection {
    classId: number;
    confidence: number;
    centerX: number;
    centerY: number;
    isDart: boolean;
}

interface CalibrationPoint {
    x: number;
    y: number;
    confidence: number;
    classId: number;
    pointType: string;
}
```

---

## Phase 2: Calibration Pipeline

### Step 2.1: Homography Matrix Calculator
**Goal**: Calculate board transformation matrix from calibration points

**Tasks**:
- [ ] Create `app/src/services/ml/calibration/homographyCalculator.ts`
- [ ] Implement perspective transformation calculation
- [ ] Use existing matrix math library or implement OpenCV-like homography
- [ ] Add validation for minimum calibration points (need 4+)
- [ ] Cache calibration result per session

**Reference Python code**:
- `detector/service/calibration/calibration_matrix_calculator.py`
- `detector/service/calibration/board_calibration_service.py`

**Files to create**:
- `app/src/services/ml/calibration/homographyCalculator.ts`

**Dependencies to consider**:
- May need `gl-matrix` or similar for matrix operations
- Or use TensorFlow.js tensor operations

---

### Step 2.2: Board Calibration Service
**Goal**: Orchestrate calibration detection from camera image

**Tasks**:
- [ ] Create `app/src/services/ml/calibration/boardCalibrationService.ts`
- [ ] Implement `calibrateFromImage(imageData)` method
- [ ] Chain: preprocess → YOLO detect → parse → calculate homography
- [ ] Store calibration result in memory/AsyncStorage
- [ ] Add recalibration trigger mechanism
- [ ] Implement calibration UI feedback

**Reference Python code**:
- `detector/service/calibration/board_calibration_service.py`

**Files to create**:
- `app/src/services/ml/calibration/boardCalibrationService.ts`

**Return type**:
```typescript
interface CalibrationResult {
    success: boolean;
    homographyMatrix?: number[][];
    calibrationPoints: CalibrationPoint[];
    processingTime: number;
    errorMessage?: string;
}
```

---

### Step 2.3: Coordinate Transformer
**Goal**: Transform dart positions from image coordinates to board coordinates

**Tasks**:
- [ ] Create `app/src/services/ml/calibration/coordinateTransformer.ts`
- [ ] Implement perspective transformation using homography matrix
- [ ] Transform (x, y) from camera space to dartboard space
- [ ] Add boundary validation (ensure points land on valid board area)

**Reference Python code**:
- `detector/service/calibration/coordinate_transformer.py`

**Files to create**:
- `app/src/services/ml/calibration/coordinateTransformer.ts`

---

## Phase 3: Dart Scoring Logic

### Step 3.1: Dart Score Calculator
**Goal**: Calculate score from transformed dart coordinates

**Tasks**:
- [ ] Create `app/src/services/ml/scoring/dartScoreCalculator.ts`
- [ ] Implement dartboard geometry (20 segments, rings for single/double/triple)
- [ ] Calculate angle and distance from center
- [ ] Map to score and multiplier
- [ ] Handle bullseye (50) and outer bull (25)

**Reference Python code**:
- `detector/service/scoring/dart_point_score_calculator.py`

**Files to create**:
- `app/src/services/ml/scoring/dartScoreCalculator.ts`

**Return type**:
```typescript
interface DartScore {
    multiplier: number; // 0 (miss), 1 (single), 2 (double), 3 (triple)
    singleValue: number; // 0-20, 25, 50
    computedScore: number; // multiplier * singleValue
}
```

---

### Step 3.2: Dart Scoring Service
**Goal**: Orchestrate end-to-end scoring from detection to final score

**Tasks**:
- [ ] Create `app/src/services/ml/scoring/dartScoringService.ts`
- [ ] Combine: YOLO detection → coordinate transform → score calculation
- [ ] Handle multiple darts in single image
- [ ] Apply confidence filtering
- [ ] Return full detection results

**Reference Python code**:
- `detector/service/scoring/dart_scoring_service.py`

**Files to create**:
- `app/src/services/ml/scoring/dartScoringService.ts`

**Return type**:
```typescript
interface DartDetection {
    originalPosition: { x: number; y: number; confidence: number };
    transformedPosition: { x: number; y: number };
    dartScore: DartScore;
}
```

---

## Phase 4: Client-Side Stabilization

### Step 4.1: Dart Stabilizer Core Logic
**Goal**: Port Kotlin `AutoScoreStabilizer` to TypeScript

**Tasks**:
- [ ] Create `app/src/services/autoscore/dartStabilizer.ts`
- [ ] Implement pending dart tracking (appearances count)
- [ ] Implement confirmed dart storage
- [ ] Implement reverted dart blocking (for corrections)
- [ ] Add frame-based tracking system
- [ ] Port constants: `REQUIRED_APPEARANCES = 2`, `MAX_FRAMES_WITHOUT_APPEARANCE = 3`, `DISTANCE_THRESHOLD = 0.04`

**Reference Kotlin code**:
- `backend/core/src/main/kotlin/io/github/dmall/opendarts/game/autoscore/service/AutoScoreStabilizer.kt`

**Files to create**:
- `app/src/services/autoscore/dartStabilizer.ts`

**Key interfaces**:
```typescript
interface PendingDart {
    position: [number, number];
    score: number;
    multiplier: number;
    appearanceCount: number;
    lastSeenFrameIndex: number;
    framesSinceLastSeen: number;
}

interface ConfirmedDart {
    position: [number, number];
    score: number;
    multiplier: number;
    origin: 'AUTO_SCORE' | 'MANUAL_SCORING' | 'AUTO_SCORE_MISS' | 'MANUAL_BUST';
    internalId?: number;
}

interface DetectionState {
    confirmedDarts: ConfirmedDart[];
    pendingDarts: PendingDart[];
    revertedDarts: ConfirmedDart[];
    frameIndex: number;
    isNewTurnAndBoardCleared: boolean;
}
```

**Core methods**:
```typescript
class DartStabilizer {
    processDartDetection(detections: DartDetection[]): ConfirmedDart | null;
    isSameDart(dart1: Dart, dart2: Dart): boolean;
    reset(): void;
}
```

---

### Step 4.2: Turn Switch Detector
**Goal**: Detect when player has finished their turn (miss detection)

**Tasks**:
- [ ] Create `app/src/services/autoscore/turnSwitchDetector.ts`
- [ ] Implement empty board frame counting
- [ ] Detect missed darts (board empty for N frames after darts were present)
- [ ] Handle 3-dart completion detection
- [ ] Port `EMPTY_FRAMES_THRESHOLD = 5` constant

**Reference Kotlin code**:
- `backend/core/src/main/kotlin/io/github/dmall/opendarts/game/autoscore/service/TurnSwitchDetector.kt`

**Files to create**:
- `app/src/services/autoscore/turnSwitchDetector.ts`

**Key methods**:
```typescript
class TurnSwitchDetector {
    detectMissedDarts(
        confirmedDartsCount: number,
        currentImageDartsCount: number,
        hasDartsOnBoardBefore: boolean
    ): { shouldRegister: boolean; missCount: number };
    
    handleThreeDartsState(
        currentImageDartsCount: number,
        detectionState: DetectionState
    ): boolean; // returns true if turn should switch
    
    reset(): void;
}
```

---

### Step 4.3: Integration with Detection Pipeline
**Goal**: Wire stabilizer into the camera capture flow

**Tasks**:
- [ ] Modify `app/src/services/ml/dartDetectionPipeline.ts` (create if needed)
- [ ] Chain: Camera → Preprocess → YOLO → Parse → Score → Stabilize
- [ ] Run at configured FPS (1-30 fps)
- [ ] Return only confirmed darts to UI/backend
- [ ] Add performance monitoring

**Files to modify**:
- `app/src/hooks/useGameCapture.ts`

**New files to create**:
- `app/src/services/ml/dartDetectionPipeline.ts`

**Pipeline flow**:
```typescript
const processCameraFrame = async (imageBlob: Blob) => {
    // 1. Preprocess
    const tensor = await preprocessImage(imageBlob);
    
    // 2. Run YOLO
    const modelOutput = await yoloModel.predict(tensor);
    
    // 3. Parse results
    const detections = parseYoloOutput(modelOutput);
    
    // 4. Score darts (if calibrated)
    const scoredDetections = await scoreDarts(detections, calibrationResult);
    
    // 5. Stabilize
    const confirmedDart = stabilizer.processDartDetection(scoredDetections);
    
    // 6. Send to backend (only if confirmed)
    if (confirmedDart) {
        await sendConfirmedDart(confirmedDart);
    }
};
```

---

## Phase 5: Backend Integration

### Step 5.1: New Backend API for Confirmed Darts
**Goal**: Modify backend to accept confirmed darts instead of raw images

**Tasks**:
- [ ] Create new DTO: `ConfirmedDartMessage` in backend
- [ ] Add WebSocket handler for confirmed dart messages
- [ ] Implement light validation (score range, max 3 darts per turn)
- [ ] Apply darts to game state via `GameOrchestrator`
- [ ] Keep existing manual scoring endpoints
- [ ] Add anti-cheat validation (optional for competitive mode)

**Files to modify (Backend)**:
- `backend/core/src/main/kotlin/io/github/dmall/opendarts/game/autoscore/model/AutoScoreModels.kt`
- `backend/core/src/main/kotlin/io/github/dmall/opendarts/game/autoscore/websocket/AutoscoreWebSocketReceiver.kt`

**New Kotlin DTO**:
```kotlin
data class ConfirmedDartMessage(
    val score: Int,
    val multiplier: Int,
    val confidence: Double,
    val position: Pair<Double, Double>,
    val timestamp: Long,
    val playerId: String,
    val sessionId: String
)
```

**Validation logic**:
```kotlin
fun isValidDart(dart: ConfirmedDartMessage): Boolean {
    return dart.score in 0..60 && 
           dart.multiplier in 0..3 &&
           dart.confidence > 0.35
}
```

---

### Step 5.2: Update WebSocket Protocol
**Goal**: Add new message type for confirmed darts

**Tasks**:
- [ ] Define `CONFIRMED_DART` message type in app
- [ ] Update binary protocol to support dart messages (or use JSON)
- [ ] Modify `useWebSocket` hook to send confirmed darts
- [ ] Keep backward compatibility with manual scoring

**Files to modify (App)**:
- `app/src/utils/binaryProtocol.ts`
- `app/src/hooks/useWebSocket.ts`

**New message type**:
```typescript
interface ConfirmedDartMessage {
    type: 'CONFIRMED_DART';
    score: number;
    multiplier: number;
    confidence: number;
    position: [number, number];
    timestamp: number;
    playerId: string;
    sessionId: string;
}
```

---

### Step 5.3: Optimistic UI Updates
**Goal**: Show darts immediately in UI while backend processes

**Tasks**:
- [ ] Add `pendingDarts` array to game store
- [ ] On confirmed dart: add to UI immediately (optimistic)
- [ ] On backend response: confirm or rollback
- [ ] Handle backend rejection gracefully
- [ ] Sync confirmed dart IDs from backend

**Files to modify**:
- `app/src/stores/gameStore.ts`

**Store updates**:
```typescript
interface GameStore {
    // ...existing
    pendingDarts: ConfirmedDart[];
    addPendingDart: (dart: ConfirmedDart) => void;
    confirmDart: (dartId: number) => void;
    rejectDart: (tempId: string) => void;
}
```

---

## Phase 6: Settings & Configuration

### Step 6.1: Autoscore Mode Settings
**Goal**: Allow users to toggle between client/server modes

**Tasks**:
- [ ] Add settings for autoscore mode:
  - `client-only` (offline practice)
  - `client-with-verification` (default multiplayer)
  - `legacy-server` (keep Python server option)
- [ ] Store in `AsyncStorage`
- [ ] Add UI toggle in settings screen
- [ ] Add calibration trigger button

**Files to modify**:
- `app/src/stores/settingsStore.ts`
- `app/src/screens/settings/SettingsScreen.tsx`

**New settings**:
```typescript
interface AutoscoreSettings {
    mode: 'client-only' | 'client-with-verification' | 'legacy-server';
    confidenceThreshold: number; // 0.35 default
    requiredAppearances: number; // 2 default
    enableCalibrationReminder: boolean;
}
```

---

### Step 6.2: Calibration UI
**Goal**: Guide users through board calibration process

**Tasks**:
- [ ] Create calibration screen/modal
- [ ] Show live camera feed with calibration point overlay
- [ ] Detect calibration points in real-time
- [ ] Show "N/4 points detected" progress
- [ ] Save calibration on success
- [ ] Allow recalibration

**Files to create**:
- `app/src/screens/calibration/CalibrationScreen.tsx`
- `app/src/components/game/CalibrationOverlay.tsx`

**UI Flow**:
1. User enters calibration mode
2. Camera shows live feed
3. Overlay shows detected calibration points (green circles)
4. When 4+ points detected → calculate homography
5. Show "Calibration successful!" → save

---

## Phase 7: Testing & Optimization

### Step 7.1: Unit Tests
**Goal**: Ensure core logic works correctly

**Tasks**:
- [ ] Test YOLO parser with sample model outputs
- [ ] Test score calculator with known dart positions
- [ ] Test stabilizer with synthetic detection sequences
- [ ] Test turn switch detector with miss scenarios
- [ ] Test coordinate transformer accuracy

**Files to create**:
- `app/src/services/ml/__tests__/yoloParser.test.ts`
- `app/src/services/ml/__tests__/dartScoreCalculator.test.ts`
- `app/src/services/autoscore/__tests__/dartStabilizer.test.ts`

---

### Step 7.2: Integration Tests
**Goal**: Test full pipeline with real images

**Tasks**:
- [ ] Use images from `autoscore-images/` folder
- [ ] Run full pipeline: load image → detect → score → stabilize
- [ ] Compare results with Python server (if available)
- [ ] Measure accuracy (% correct detections)
- [ ] Test calibration with various angles/lighting

**Files to create**:
- `app/src/services/ml/__tests__/integration.test.ts`

---

### Step 7.3: Performance Optimization
**Goal**: Achieve real-time performance on mobile devices

**Tasks**:
- [ ] Profile inference time (target: <100ms per frame)
- [ ] Optimize image preprocessing (use native resize if slow)
- [ ] Reduce FPS if needed (1-5 fps may be sufficient)
- [ ] Use `expo-gl` for GPU acceleration
- [ ] Cache calibration matrix
- [ ] Throttle backend messages

**Metrics to track**:
- Inference time per frame
- End-to-end latency (camera → confirmed dart)
- Battery usage
- Memory footprint

---

### Step 7.4: Error Handling & Fallbacks
**Goal**: Graceful degradation when ML fails

**Tasks**:
- [ ] Handle model loading failures → disable autoscore
- [ ] Handle calibration failures → show recalibration prompt
- [ ] Handle low confidence detections → require manual confirmation
- [ ] Add manual scoring fallback (already exists)
- [ ] Show helpful error messages

---

## Phase 8: Migration & Rollout

### Step 8.1: Feature Flag Implementation
**Goal**: Allow gradual rollout and A/B testing

**Tasks**:
- [ ] Add `ENABLE_CLIENT_AUTOSCORE` feature flag
- [ ] Default to disabled initially (use legacy server)
- [ ] Add remote config support (Firebase or similar)
- [ ] Allow per-user enablement for beta testing

**Files to modify**:
- `app/src/config/featureFlags.ts` (create if needed)

---

### Step 8.2: Deprecate Python Server (Optional)
**Goal**: Eventually remove Python dependency

**Tasks**:
- [ ] Monitor adoption of client-side autoscore
- [ ] Keep Python server for fallback (6+ months)
- [ ] Add deprecation warning in server logs
- [ ] Document migration path for self-hosters
- [ ] Remove Python server once 95%+ adoption

**Timeline**:
- Month 1-2: Client-side beta (10% of users)
- Month 3-4: Gradual rollout (50% → 100%)
- Month 5-6: Monitor stability
- Month 7+: Deprecate Python server

---

### Step 8.3: Documentation
**Goal**: Help users and developers understand new system

**Tasks**:
- [ ] Update README with client-side autoscore info
- [ ] Create calibration guide with photos
- [ ] Document troubleshooting steps
- [ ] Add developer guide for ML models
- [ ] Create video tutorial for calibration

**Files to create/update**:
- `app/docs/AUTOSCORE_GUIDE.md`
- `app/docs/CALIBRATION_TUTORIAL.md`
- `app/docs/ML_MODELS.md`

---

## Implementation Priority

### Critical Path (MVP)
1. **Phase 1**: Core ML infrastructure (Steps 1.1-1.3)
2. **Phase 2**: Calibration (Steps 2.1-2.3)
3. **Phase 3**: Scoring (Steps 3.1-3.2)
4. **Phase 4**: Stabilization (Steps 4.1-4.3)
5. **Phase 5.1**: Backend API changes

**Estimated time**: 2-3 weeks for experienced developer

### Nice-to-Have (Post-MVP)
- Phase 5.2-5.3: Optimistic UI, advanced sync
- Phase 6: Settings and calibration UI polish
- Phase 7: Comprehensive testing and optimization
- Phase 8: Migration planning and documentation

**Estimated time**: +1-2 weeks

---

## Success Criteria

### Technical Metrics
- ✅ Model inference time < 100ms on mid-range device
- ✅ Dart detection accuracy ≥ 90% (compared to Python baseline)
- ✅ Calibration success rate ≥ 95% in normal lighting
- ✅ No crashes due to ML pipeline
- ✅ Battery usage increase < 10% vs manual scoring

### User Experience
- ✅ First-time calibration takes < 30 seconds
- ✅ Autoscore feels "instant" (< 1 second lag)
- ✅ Clear feedback when calibration is needed
- ✅ Graceful fallback to manual scoring

### Business Goals
- ✅ Reduce backend costs (no Python server needed)
- ✅ Enable offline autoscore (practice mode)
- ✅ Improve user retention (faster, smoother experience)

---

## Risk Mitigation

### Technical Risks
1. **Model size too large**: Use model quantization, split models
2. **Inference too slow**: Reduce FPS, use GPU acceleration
3. **Poor accuracy on device**: Fallback to server, collect training data

### Product Risks
1. **Users don't trust client-side scoring**: Keep server verification option
2. **Calibration too difficult**: Improve UI, add AR guides
3. **Cheating concerns**: Add backend validation for competitive mode

---

## Next Steps

To begin implementation, start with:
1. **Step 1.1**: Install TensorFlow Lite dependencies and verify model loading
2. **Step 1.2**: Implement basic image preprocessing
3. **Step 1.3**: Parse YOLO outputs from TFLite model

Each step is designed to be independently testable. Verify each component works before moving to the next.

---

## Questions to Resolve

Before starting implementation, clarify:
1. Are TFLite models already converted and tested? (Assumed yes)
2. What is target FPS? (Suggest 1-5 fps initially)
3. Should we support offline mode? (Suggest yes for practice)
4. Keep Python server as fallback? (Suggest yes for 6 months)
5. Do we need anti-cheat validation? (Suggest light validation for competitive mode)

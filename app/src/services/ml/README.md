# Client-Side Dart Detection ML Services

This directory contains the complete machine learning pipeline for client-side dart detection using TensorFlow Lite
models.

## Overview

The ML pipeline processes camera images to detect darts and calculate scores without requiring a backend server. This
provides:

- **Faster detection**: No network latency
- **Offline capability**: Works without internet
- **Better privacy**: Images stay on device
- **Detailed logging**: See exactly what's detected

## Architecture

```
Camera Image
    ↓
[Image Preprocessor] → Resize to 800x800, normalize
    ↓
[YOLO Model] → Detect darts + calibration points
    ↓
[YOLO Parser] → Extract positions and confidence
    ↓
[Calibration Service] → Calculate homography matrix
    ↓
[Coordinate Transformer] → Transform to board space
    ↓
[Score Calculator] → Calculate dart scores
    ↓
Dart Detections with Scores
```

## Quick Start

### 1. Initialize Models

```typescript
import { initializeModels } from '@/services/ml';

// Call once at app startup
const result = await initializeModels();

if (result.error) {
  console.error('Failed to load models:', result.error);
} else {
  console.log('Models ready!');
}
```

### 2. Process Camera Frames

```typescript
import { dartDetectionPipeline } from '@/services/ml';

// Process a camera frame
const result = await dartDetectionPipeline.processFrame(imageBlob);

// Check for errors
if (result.error) {
  console.error('Detection failed:', result.error);
  return;
}

// Access detections
result.detections.forEach((detection, index) => {
  if (detection.dartScore) {
    console.log(`Dart ${index + 1}: ${detection.dartScore.computedScore} points`);
    console.log(`  Position: (${detection.originalPosition.x}, ${detection.originalPosition.y})`);
    console.log(`  Confidence: ${detection.originalPosition.confidence}`);
  }
});

// Check processing time
console.log(`Processed in ${result.processingTime}ms`);
```

## Core Components

### 1. Model Loader (`modelLoader.ts`)

Loads and caches TensorFlow Lite models.

```typescript
import { initializeModels, isModelsReady } from '@/services/ml';

// Initialize (call once)
await initializeModels();

// Check if ready
if (isModelsReady()) {
  // Models are loaded
}
```

### 2. Image Preprocessor (`imagePreprocessor.ts`)

Prepares images for model inference.

```typescript
import { imagePreprocessor } from '@/services/ml';

const { tensor, preprocessingResult } = await imagePreprocessor.preprocessBlob(blob);
// tensor is ready for model.predict()
```

### 3. YOLO Parser (`yoloParser.ts`)

Parses model outputs into detections.

```typescript
import { yoloParser } from '@/services/ml';

const modelOutput = await model.predict(tensor);
const { calibrationPoints, originalPositions } = await yoloParser.extractDetections(modelOutput);
```

### 4. Calibration Services

#### Homography Calculator (`calibration/homographyCalculator.ts`)

Calculates transformation matrix from calibration points.

```typescript
import { homographyCalculator } from '@/services/ml';

const result = homographyCalculator.calculateHomography(calibrationPoints);
if (!result.error) {
  const matrix = result.matrix; // 3x3 transformation matrix
}
```

#### Board Calibration Service (`calibration/boardCalibrationService.ts`)

Orchestrates calibration process.

```typescript
import { boardCalibrationService } from '@/services/ml';

// Calibrate from detected points
const calibration = boardCalibrationService.calibrateFromPoints(calibrationPoints);

// Check if calibrated
if (boardCalibrationService.isCalibrated()) {
  const matrix = boardCalibrationService.getHomographyMatrix();
}

// Clear calibration
boardCalibrationService.clearCalibration();
```

#### Coordinate Transformer (`calibration/coordinateTransformer.ts`)

Transforms coordinates from camera space to board space.

```typescript
import { coordinateTransformer } from '@/services/ml';

const transformed = coordinateTransformer.transformToBoardDimensions(
  homographyMatrix,
  dartPositions
);
```

### 5. Scoring Services

#### Dart Score Calculator (`scoring/dartScoreCalculator.ts`)

Calculates scores from board coordinates.

```typescript
import { dartScoreCalculator } from '@/services/ml';

const score = dartScoreCalculator.calculateScore({ x: 0.5, y: 0.3 });
console.log(`${score.multiplier}x ${score.singleValue} = ${score.computedScore} points`);
```

#### Dart Scoring Service (`scoring/dartScoringService.ts`)

Orchestrates the scoring pipeline.

```typescript
import { dartScoringService } from '@/services/ml';

const detections = dartScoringService.scoreDarts(dartPositions, homographyMatrix);
```

### 6. Detection Pipeline (`dartDetectionPipeline.ts`)

Main pipeline that ties everything together.

```typescript
import { dartDetectionPipeline } from '@/services/ml';

// Process frame with calibration
const result = await dartDetectionPipeline.processFrame(blob);

// Process frame using cached calibration
const result = await dartDetectionPipeline.processFrame(blob, true);

// Check calibration status
if (dartDetectionPipeline.isCalibrated()) {
  // Calibration is available
}

// Clear calibration
dartDetectionPipeline.clearCalibration();
```

## Logging

The pipeline provides detailed console logging at each step:

```
========================================
🎯 Starting Dart Detection Pipeline
========================================

📸 Step 1: Preprocessing image...
✓ Image preprocessed

🔍 Step 2: Running YOLO detection...
✓ Detected 2 darts, 6 calibration points

🎲 Step 3: Calibrating dartboard...
✓ Calibration successful

🎯 Step 4: Scoring darts...
Dart at (0.523, 0.412): Triple 20 = 60 points
Dart at (0.498, 0.502): Double Bull = 50 points
✓ Darts scored

========================================
✅ Pipeline Complete (145.23ms)
========================================
```

## Performance

Target metrics:

- **Inference time**: <100ms per frame
- **Total pipeline**: <200ms per frame
- **Calibration**: <50ms (cached after first detection)

## Error Handling

All services return detailed error information:

```typescript
const result = await dartDetectionPipeline.processFrame(blob);

if (result.error) {
  console.error('Pipeline error:', result.error);
  // Handle error (show message to user, fallback to manual scoring, etc.)
}
```

## Testing

See `__tests__/pipelineTest.ts` for usage examples and test utilities.

## Integration with Backend

The pipeline can optionally send detected darts to the backend for verification:

```typescript
// After getting detections
if (result.detections.length > 0) {
  // Send to backend via WebSocket
  result.detections.forEach(detection => {
    if (detection.dartScore) {
      sendDartToBackend({
        score: detection.dartScore.computedScore,
        multiplier: detection.dartScore.multiplier,
        confidence: detection.originalPosition.confidence,
        position: [detection.originalPosition.x, detection.originalPosition.y],
      });
    }
  });
}
```

## Constants

All constants are defined in `constants.ts`:

- **DART_CLASS_ID**: YOLO class ID for darts (4)
- **YOLO_CLASS_MAPPING**: Maps class IDs to names
- **Confidence thresholds**: DEFAULT_DART_CONFIDENCE_THRESHOLD (0.35)
- **Dartboard geometry**: Radii, angles, segment numbers
- **Stabilization constants**: REQUIRED_APPEARANCES, DISTANCE_THRESHOLD

## Types

All TypeScript interfaces are in `types.ts`:

- **YoloDetection**: Raw YOLO output
- **CalibrationPoint**: Detected calibration point
- **DartPosition**: Detected dart position
- **DartScore**: Calculated score
- **DartDetection**: Full detection with score
- **CalibrationResult**: Calibration result with matrix

## Troubleshooting

### Models not loading

```typescript
const result = await initializeModels();
if (result.error) {
  console.error('Model loading failed:', result.error);
  // Check that .tflite files are in app/assets/models/saved_model/
}
```

### Calibration failing

```typescript
// Check calibration points
if (result.calibrationResult && !result.calibrationResult.success) {
  console.error('Calibration failed:', result.calibrationResult.errorMessage);
  // Need at least 4 calibration points
  // Check lighting and camera angle
}
```

### Low confidence detections

```typescript
// Filter by confidence
const highConfidenceDarts = result.detections.filter(
  d => d.originalPosition.confidence > 0.5
);
```

## Future Enhancements

- [ ] Add stabilization (track darts across frames)
- [ ] Add turn detection (detect when player finishes)
- [ ] Add GPU acceleration
- [ ] Add model quantization for smaller size
- [ ] Add calibration UI with visual feedback

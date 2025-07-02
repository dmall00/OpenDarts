# Dart Detection Stabilization System

## Overview

This system needs to handle real-time dart detection from a camera feed, stabilizing noisy detections and managing dart
lifecycle (thrown → visible → removed). The core challenge is distinguishing between:
- New dart throws
- Existing darts with position noise
- Darts that become occluded by newer throws
- Complete dart removal (end of turn)

## Core Data Structures

### 1. Dart State Representation

```pseudocode
class StableDart {
    id: UUID
    position: Point2D (x, y)
    confidence: Float
    firstSeenFrame: Int
    lastSeenFrame: Int
    detectionHistory: List<DetectionRecord>
    state: DartState (CANDIDATE, STABLE, OCCLUDED, REMOVED)
    stabilityScore: Float
}

class DetectionRecord {
    frame: Int
    position: Point2D
    confidence: Float
    timestamp: Long
}

enum DartState {
    CANDIDATE,    // Newly detected, not yet stable
    STABLE,       // Confirmed dart, consistent across frames
    OCCLUDED,     // Was stable but no longer visible (likely behind new dart)
    REMOVED       // Confirmed removed from board
}
```

### 2. System State

```pseudocode
class StabilizationState {
    activeDarts: Map<UUID, StableDart>
    frameNumber: Int
    lastCalibrationFrame: Int
    boardDetected: Boolean
    turnInProgress: Boolean
}
```

## Mathematical Models

### 1. Position Similarity (Euclidean Distance with Normalization)

```math
distance(p1, p2) = √((p1.x - p2.x)² + (p1.y - p2.y)²)
similarity_score = exp(-distance² / (2 * σ²))
```

Where σ is the expected position noise standard deviation (tune based on camera/board setup).

### 2. Confidence Weighting

```math
weighted_confidence = base_confidence * temporal_weight * consistency_bonus

temporal_weight = exp(-frames_since_detection / decay_constant)
consistency_bonus = min(detection_count / stability_threshold, 1.0)
```

### 3. Stability Score Calculation

```math
stability_score = (consistency_factor * 0.4) + 
                 (confidence_factor * 0.3) + 
                 (temporal_factor * 0.3)

consistency_factor = successful_matches / total_frames_seen
confidence_factor = average_confidence_over_time
temporal_factor = min(frames_detected / min_frames_for_stability, 1.0)
```

## Core Algorithm Flow

### 1. Detection Processing Pipeline

```pseudocode
function processDetection(newDetections: List<Detection>) {
    currentFrame++
    
    // Step 1: Update board state
    updateBoardCalibration(newDetections.calibrationResult)
    
    // Step 2: Match detections to existing darts
    matches = matchDetectionsToExistingDarts(newDetections.darts)
    
    // Step 3: Update existing darts
    updateExistingDarts(matches)
    
    // Step 4: Handle unmatched detections (potential new darts)
    handleNewCandidates(matches.unmatchedDetections)
    
    // Step 5: Update dart states and detect occlusions
    updateDartStates()
    
    // Step 6: Detect turn completion
    checkForTurnCompletion()
    
    // Step 7: Forward stable events to orchestrator
    forwardStableEvents()
}
```

### 2. Detection Matching Algorithm

```pseudocode
function matchDetectionsToExistingDarts(detections: List<Detection>) -> MatchResult {
    matches = []
    unmatchedDetections = detections.copy()
    unmatchedDarts = activeDarts.values().copy()
    
    // Create distance matrix
    for each dart in unmatchedDarts {
        for each detection in unmatchedDetections {
            distance = calculateDistance(dart.position, detection.position)
            if distance < MAX_MOVEMENT_THRESHOLD {
                matches.add(Match(dart, detection, distance))
            }
        }
    }
    
    // Sort matches by distance (best matches first)
    matches.sortBy(match -> match.distance)
    
    // Greedy assignment (Hungarian algorithm could be used for optimal)
    finalMatches = []
    usedDarts = Set()
    usedDetections = Set()
    
    for match in matches {
        if not usedDarts.contains(match.dart) and 
           not usedDetections.contains(match.detection) {
            finalMatches.add(match)
            usedDarts.add(match.dart)
            usedDetections.add(match.detection)
        }
    }
    
    return MatchResult(finalMatches, 
                      unmatchedDetections - usedDetections,
                      unmatchedDarts - usedDarts)
}
```

## State Management Logic

### 1. Dart Lifecycle Management

```pseudocode
function updateDartStates() {
    for dart in activeDarts.values() {
        framesSinceLastSeen = currentFrame - dart.lastSeenFrame
        
        switch dart.state {
            case CANDIDATE:
                if dart.detectionHistory.size() >= MIN_DETECTIONS_FOR_STABILITY and
                   dart.stabilityScore > STABILITY_THRESHOLD {
                    dart.state = STABLE
                    // Forward dart throw event to orchestrator
                    orchestrator.onDartThrown(dart.toGameDart())
                }
                else if framesSinceLastSeen > CANDIDATE_TIMEOUT_FRAMES {
                    dart.state = REMOVED
                }
                break
                
            case STABLE:
                if framesSinceLastSeen > OCCLUSION_TIMEOUT_FRAMES {
                    dart.state = OCCLUDED
                }
                break
                
            case OCCLUDED:
                if framesSinceLastSeen > REMOVAL_TIMEOUT_FRAMES {
                    dart.state = REMOVED
                }
                break
        }
    }
    
    // Remove darts marked as REMOVED
    activeDarts = activeDarts.filter(dart -> dart.state != REMOVED)
}
```

### 2. Turn Completion Detection

```pseudocode
function checkForTurnCompletion() -> Boolean {
    // Method 1: Board not detected for X frames
    if not boardDetected and 
       currentFrame - lastCalibrationFrame > BOARD_LOSS_TIMEOUT {
        if turnInProgress {
            orchestrator.onTurnComplete()
            clearAllDarts()
            turnInProgress = false
        }
        return true
    }
    
    // Method 2: All stable darts suddenly gone
    stableDarts = activeDarts.values().filter(dart -> dart.state == STABLE)
    if stableDarts.isEmpty() and 
       turnInProgress and
       currentFrame - lastStableDartFrame > DART_REMOVAL_TIMEOUT {
        orchestrator.onTurnComplete()
        clearAllDarts()
        turnInProgress = false
        return true
    }
    
    return false
}
```

## Configuration Parameters

### Timing Constants
- `MIN_DETECTIONS_FOR_STABILITY`: 3-5 frames
- `CANDIDATE_TIMEOUT_FRAMES`: 10-15 frames (5-7.5 seconds)
- `OCCLUSION_TIMEOUT_FRAMES`: 20-30 frames (10-15 seconds)
- `REMOVAL_TIMEOUT_FRAMES`: 40-60 frames (20-30 seconds)
- `BOARD_LOSS_TIMEOUT`: 20 frames (10 seconds)
- `DART_REMOVAL_TIMEOUT`: 10 frames (5 seconds)

### Spatial Constants
- `MAX_MOVEMENT_THRESHOLD`: 50-100 pixels (depends on camera resolution)
- `POSITION_NOISE_SIGMA`: 10-20 pixels
- `STABILITY_THRESHOLD`: 0.7-0.8

### Confidence Constants
- `MIN_CONFIDENCE_THRESHOLD`: 0.5
- `CONFIDENCE_DECAY_RATE`: 0.1 per frame

## Advanced Features

### 1. Sliding Window Analysis

```pseudocode
function calculateSlidingWindowStability(dart: StableDart, windowSize: Int = 5) -> Float {
    recentDetections = dart.detectionHistory.takeLast(windowSize)
    
    if recentDetections.size() < 2 return 0.0
    
    // Calculate position variance within window
    avgPosition = calculateCentroid(recentDetections.positions)
    variance = calculateVariance(recentDetections.positions, avgPosition)
    
    // Calculate confidence trend
    confidenceTrend = calculateLinearTrend(recentDetections.confidences)
    
    // Combine metrics
    positionStability = exp(-variance / MAX_ACCEPTABLE_VARIANCE)
    confidenceStability = max(0, confidenceTrend) // Prefer increasing confidence
    
    return (positionStability * 0.7) + (confidenceStability * 0.3)
}
```

### 2. Occlusion Prediction

```pseudocode
function predictOcclusion(existingDart: StableDart, newDetection: Detection) -> Float {
    // Check if new detection is "in front" of existing dart
    // This depends on your camera setup and dart board geometry
    
    depthDifference = estimateDepthDifference(existingDart.position, newDetection.position)
    proximityScore = calculateProximity(existingDart.position, newDetection.position)
    
    occlusionProbability = proximityScore * depthDifference
    return occlusionProbability
}
```

## Error Handling & Edge Cases

### 1. False Positive Management
- Require minimum detection count before considering dart stable
- Use confidence thresholding
- Implement outlier detection for position jumps

### 2. Camera Shake/Movement
- Implement global motion compensation
- Use relative positioning when possible
- Increase position tolerance during detected camera movement

### 3. Lighting Changes
- Normalize confidence scores based on recent history
- Implement adaptive thresholding

### 4. Multiple Players/Rapid Fire
- Support configurable maximum darts per turn
- Implement turn timeout mechanisms
- Handle overlapping turns gracefully

## Testing Strategy

### Unit Tests
- Position matching algorithms
- State transition logic
- Mathematical calculations

### Integration Tests
- Full pipeline with synthetic data
- Known dart sequences
- Edge cases (rapid throws, occlusions)

### Performance Tests
- Real-time processing requirements
- Memory usage over time
- CPU utilization

## Implementation Phases

### Phase 1: Basic Stabilization
- Simple position matching
- Basic state management
- Turn completion detection

### Phase 2: Advanced Features
- Sliding window analysis
- Occlusion handling
- Confidence weighting

### Phase 3: Optimization
- Performance tuning
- Parameter optimization
- Real-world testing

This system provides a robust foundation for handling the complexities of real-time dart detection while maintaining
accuracy and responsiveness.

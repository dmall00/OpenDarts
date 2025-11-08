/**
 * TypeScript interfaces for ML-based dart detection.
 * Ported from Python autoscore-server/detector/model/
 */

// YOLO detection result (from detection_models.py)
export interface YoloDetection {
    classId: number;
    confidence: number;
    centerX: number; // Normalized 0-1
    centerY: number; // Normalized 0-1
}

// Calibration point (from detection_models.py)
export interface CalibrationPoint {
    x: number; // Normalized 0-1
    y: number; // Normalized 0-1
    confidence: number;
    classId: number;
    pointType: string; // e.g., "20", "3", "11", etc.
}

// Dart position (from detection_models.py)
export interface DartPosition {
    x: number; // Normalized 0-1
    y: number; // Normalized 0-1
    confidence: number;
}

// YOLO parse result (from detection_models.py)
export interface YoloDartParseResult {
    calibrationPoints: CalibrationPoint[];
    originalPositions: DartPosition[];
}

// Dart score (from scoring models)
export interface DartScore {
    multiplier: number; // 0 (miss), 1 (single), 2 (double), 3 (triple)
    singleValue: number; // 0-20, 25, 50
    computedScore: number; // multiplier * singleValue
}

// Full dart detection with scoring
export interface DartDetection {
    originalPosition: { x: number; y: number; confidence: number };
    transformedPosition?: { x: number; y: number }; // After calibration
    dartScore?: DartScore;
}

// Calibration result
export interface CalibrationResult {
    success: boolean;
    homographyMatrix?: number[][]; // 3x3 transformation matrix
    calibrationPoints: CalibrationPoint[];
    processingTime: number;
    errorMessage?: string;
}

// Crop information (from image_models.py)
export interface CropInfo {
    x: number;
    y: number;
    width: number;
    height: number;
}

// Preprocessing result (from image_models.py)
export interface PreprocessingResult {
    cropInfo?: CropInfo;
}

// Processing configuration
export interface ProcessingConfig {
    calibrationConfidenceThreshold: number;
    dartConfidenceThreshold: number;
    targetImageSize: { width: number; height: number };
    minCalibrationPoints: number;
    maxAllowedDarts: number;
    enableCroppingModel: boolean;
}

// TensorFlow.js GraphModel type (re-export for convenience)
import type * as tf from '@tensorflow/tfjs';

export type TFLiteModel = tf.GraphModel;

// Model loader result
export interface ModelLoaderResult {
    dartScorerModel: TFLiteModel | null;
    dartboardDetectorModel: TFLiteModel | null;
    error?: string;
}

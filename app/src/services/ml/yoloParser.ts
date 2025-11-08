/**
 * YOLO result parser for dart detection.
 * Ported from Python autoscore-server/detector/service/parser/yolo_result_parser.py
 */

import * as tf from '@tensorflow/tfjs';
import {
    DART_CLASS_ID,
    DEFAULT_CALIBRATION_CONFIDENCE_THRESHOLD,
    DEFAULT_DART_CONFIDENCE_THRESHOLD,
    YOLO_CLASS_MAPPING,
} from './constants';
import type {CalibrationPoint, DartPosition, YoloDartParseResult, YoloDetection,} from './types';

/**
 * Parser for YOLO detection results.
 * Extracts dart positions and calibration points from model output.
 */
export class YoloResultParser {
    private dartConfidenceThreshold: number;
    private calibrationConfidenceThreshold: number;

    constructor(
        dartConfidenceThreshold = DEFAULT_DART_CONFIDENCE_THRESHOLD,
        calibrationConfidenceThreshold = DEFAULT_CALIBRATION_CONFIDENCE_THRESHOLD
    ) {
        this.dartConfidenceThreshold = dartConfidenceThreshold;
        this.calibrationConfidenceThreshold = calibrationConfidenceThreshold;
    }

    /**
     * Extract detections from YOLO model output tensor.
     *
     * @param outputTensor - Model output tensor
     * @returns Parsed detections with calibration points and dart positions
     */
    async extractDetections(outputTensor: tf.Tensor): Promise<YoloDartParseResult> {
        try {
            // Parse raw YOLO output into detections
            const detections = await this.parseYoloOutput(outputTensor);

            // Separate darts from calibration points
            const dartPositions = this.parseDarts(detections);
            const calibrationPoints = this.parseCalibrationPoints(detections);

            console.log(
                `Extracted ${calibrationPoints.length} calibration points and ${dartPositions.length} darts`
            );

            return {
                calibrationPoints,
                originalPositions: dartPositions,
            };
        } catch (error) {
            console.error('Error extracting detections:', error);
            throw error;
        }
    }

    /**
     * Update confidence thresholds.
     */
    setThresholds(dartThreshold: number, calibrationThreshold: number): void {
        this.dartConfidenceThreshold = dartThreshold;
        this.calibrationConfidenceThreshold = calibrationThreshold;
    }

    /**
     * Parse YOLO model output tensor into detection objects.
     * Optimized to avoid full transpose - only process high-confidence detections.
     *
     * YOLO output format (for YOLOv8/v11):
     * - Shape: [1, num_features, num_detections]
     * - Features: [x, y, w, h, objectness, class_prob_0, class_prob_1, ..., class_prob_N]
     *
     * For this model with 7 classes (0-6):
     * - Shape: [1, 11, num_detections]
     * - Features: [x, y, w, h, objectness, prob_0, prob_1, prob_2, prob_3, prob_4, prob_5]
     *
     * Note: The exact format depends on the YOLO version and export settings.
     * This implementation assumes normalized coordinates (0-1 range).
     */
    private async parseYoloOutput(outputTensor: tf.Tensor): Promise<YoloDetection[]> {
        const detections: YoloDetection[] = [];

        // Get tensor data
        const outputData = await outputTensor.array();
        const shape = outputTensor.shape;

        console.log('YOLO output shape:', shape);

        if (shape.length !== 3 || shape[0] !== 1) {
            throw new Error(`Unexpected YOLO output shape: ${shape}`);
        }

        const numFeatures = shape[1];
        const numDetections = shape[2];
        const numClasses = numFeatures - 5; // Subtract bbox (4) + objectness (1)
        
        // Data is in format [1, features, detections]
        const rawData = (outputData as any)[0];
        
        // Optimized: Process detections without full transpose
        // Only extract data for detections that pass confidence threshold
        const objectnessArray = rawData[4]; // Index 4 is objectness
        
        for (let i = 0; i < numDetections; i++) {
            const objectness = objectnessArray[i];
            
            // Early skip if objectness is too low (before computing class probs)
            if (objectness < 0.01) continue;
            
            // Extract bbox coordinates
            const centerX = rawData[0][i];
            const centerY = rawData[1][i];
            
            // Find class with highest probability
            let maxClassProb = 0;
            let classId = 0;
            for (let c = 0; c < numClasses; c++) {
                const classProb = rawData[5 + c][i];
                if (classProb > maxClassProb) {
                    maxClassProb = classProb;
                    classId = c;
                }
            }
            
            // Final confidence is objectness * class_probability
            const confidence = objectness * maxClassProb;

            // Skip low-confidence detections
            if (confidence < 0.01) continue;

            detections.push({
                classId,
                confidence,
                centerX,
                centerY,
            });
        }

        console.log(`Parsed ${detections.length} detections from ${numDetections} candidates`);
        return detections;
    }

    /**
     * Transpose detection data from [6, num_detections] to [num_detections, 6].
     */
    private transposeDetections(data: any[], numDetections: number): any[] {
        const transposed: any[] = [];
        for (let i = 0; i < numDetections; i++) {
            transposed.push([
                data[0][i], // center_x
                data[1][i], // center_y
                data[2][i], // width
                data[3][i], // height
                data[4][i], // confidence
                data[5][i], // class_id
            ]);
        }
        return transposed;
    }

    /**
     * Extract dart positions from detections.
     */
    private parseDarts(detections: YoloDetection[]): DartPosition[] {
        return detections
            .filter((d) => this.isDart(d.classId))
            .filter((d) => d.confidence >= this.dartConfidenceThreshold)
            .map((d) => ({
                x: d.centerX,
                y: d.centerY,
                confidence: d.confidence,
            }));
    }

    /**
     * Extract calibration points from detections.
     */
    private parseCalibrationPoints(detections: YoloDetection[]): CalibrationPoint[] {
        return detections
            .filter((d) => !this.isDart(d.classId))
            .filter((d) => d.confidence >= this.calibrationConfidenceThreshold)
            .map((d) => ({
                x: d.centerX,
                y: d.centerY,
                confidence: d.confidence,
                classId: d.classId,
                pointType: this.getClassName(d.classId),
            }));
    }

    /**
     * Check if a class ID corresponds to a dart.
     */
    private isDart(classId: number): boolean {
        return classId === DART_CLASS_ID;
    }

    /**
     * Get the class name for a given class ID.
     */
    private getClassName(classId: number): string {
        return YOLO_CLASS_MAPPING[classId] || String(classId);
    }
}

// Export singleton instance
export const yoloParser = new YoloResultParser();

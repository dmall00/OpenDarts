/**
 * Dart scoring service.
 * Orchestrates the full scoring pipeline: detection → transformation → scoring.
 * Ported from Python detector/service/scoring/dart_scoring_service.py
 */

import {coordinateTransformer} from '../calibration/coordinateTransformer';
import {dartScoreCalculator} from './dartScoreCalculator';
import type {DartDetection, DartPosition} from '../types';

/**
 * Dart scoring service.
 */
export class DartScoringService {
    /**
     * Score darts from detected positions using calibration.
     *
     * @param dartPositions - Detected dart positions from YOLO (camera space)
     * @param homographyMatrix - Calibration matrix for transformation
     * @returns Full dart detections with scores
     */
    scoreDarts(
        dartPositions: DartPosition[],
        homographyMatrix: number[][]
    ): DartDetection[] {
        console.log(`=== Scoring ${dartPositions.length} Darts ===`);

        if (dartPositions.length === 0) {
            console.log('No darts to score');
            return [];
        }

        // Transform positions from camera space to board space
        const transformedPositions = coordinateTransformer.transformToBoardDimensions(
            homographyMatrix,
            dartPositions
        );

        // Calculate scores for each dart
        const scores = dartScoreCalculator.calculateScores(transformedPositions);

        // Combine into full detection results
        const detections: DartDetection[] = dartPositions.map((original, index) => ({
            originalPosition: {
                x: original.x,
                y: original.y,
                confidence: original.confidence,
            },
            transformedPosition: transformedPositions[index],
            dartScore: scores[index],
        }));

        // Log summary
        console.log('=== Scoring Summary ===');
        detections.forEach((detection, index) => {
            const score = detection.dartScore!;
            console.log(
                `Dart ${index + 1}: ${score.computedScore} points ` +
                `(${score.multiplier}x ${score.singleValue}) ` +
                `confidence: ${detection.originalPosition.confidence.toFixed(3)}`
            );
        });
        console.log('======================');

        return detections;
    }

    /**
     * Score darts without calibration (returns detections without scores).
     * Useful for testing or when calibration is not available.
     */
    createUnscoredDetections(dartPositions: DartPosition[]): DartDetection[] {
        console.log(`Creating ${dartPositions.length} unscored detections`);

        return dartPositions.map((position) => ({
            originalPosition: {
                x: position.x,
                y: position.y,
                confidence: position.confidence,
            },
            // No transformed position or score without calibration
        }));
    }
}

// Export singleton instance
export const dartScoringService = new DartScoringService();

/**
 * Dart score calculator.
 * Calculates dart scores from transformed board coordinates.
 * Ported from Python detector/service/scoring/dart_point_score_calculator.py
 */

import {
    ANGLE_CALCULATION_EPSILON,
    BOARD_CENTER_COORDINATE,
    BOARD_DIAMETER,
    BULLSEYE_WIRE_WIDTH,
    DARTBOARD_SEGMENT_ANGLES,
    DARTBOARD_SEGMENT_NUMBERS,
    DOUBLE_BULL_RADIUS,
    DOUBLE_RING_INNER_RADIUS,
    DOUBLE_RING_OUTER_RADIUS,
    SCORING_REGION_NAMES,
    SEGMENT_20_3_ANGLE_THRESHOLD,
    SINGLE_BULL_RADIUS,
    TRIPLE_RING_INNER_RADIUS,
    TRIPLE_RING_OUTER_RADIUS,
} from '../constants';
import type {DartScore} from '../types';

/**
 * Dartboard geometry and scoring model.
 */
class DartBoard {
    private scoringRadii: number[] = [];
    private scoringNames: string[] = [];
    private segmentAngles: number[] = [];
    private segmentNumbers: number[][] = [];

    constructor() {
        this.setupScoringRegions();
        this.setupSegments();
    }

    /**
     * Get the segment number for a given angle and position.
     */
    getSegmentNumber(angle: number, position: [number, number]): number {
        let possibleNumbers: number[];

        if (Math.abs(angle) >= SEGMENT_20_3_ANGLE_THRESHOLD) {
            possibleNumbers = [3, 20];
        } else {
            const segmentIndex = this.findSegmentIndex(angle);
            possibleNumbers = this.segmentNumbers[segmentIndex];
        }

        // Determine which number based on position
        const coordinateIndex = possibleNumbers[0] === 6 && possibleNumbers[1] === 11 ? 0 : 1;
        return position[coordinateIndex] > BOARD_CENTER_COORDINATE
            ? possibleNumbers[0]
            : possibleNumbers[1];
    }

    /**
     * Get the scoring region (single, double, triple, etc.) for a position.
     */
    getScoringRegion(position: [number, number]): string {
        const distance = this.calculateDistanceFromCenter(position);

        // Find the region index
        let regionIndex = 0;
        for (let i = this.scoringRadii.length - 1; i >= 0; i--) {
            if (distance > this.scoringRadii[i]) {
                regionIndex = i;
                break;
            }
        }

        return this.scoringNames[regionIndex];
    }

    private setupScoringRegions(): void {
        this.scoringNames = [...SCORING_REGION_NAMES];

        // Initialize radii (in mm, will be normalized)
        this.scoringRadii = [
            0,
            DOUBLE_BULL_RADIUS,
            SINGLE_BULL_RADIUS,
            TRIPLE_RING_INNER_RADIUS,
            TRIPLE_RING_OUTER_RADIUS,
            DOUBLE_RING_INNER_RADIUS,
            DOUBLE_RING_OUTER_RADIUS,
        ];

        // Adjust for wire width
        this.scoringRadii[1] += BULLSEYE_WIRE_WIDTH / 2;
        this.scoringRadii[2] += BULLSEYE_WIRE_WIDTH / 2;

        // Normalize by board diameter
        this.scoringRadii = this.scoringRadii.map((r) => r / BOARD_DIAMETER);
    }

    private setupSegments(): void {
        this.segmentAngles = [...DARTBOARD_SEGMENT_ANGLES];
        this.segmentNumbers = DARTBOARD_SEGMENT_NUMBERS.map((pair) => [...pair]);
    }

    private findSegmentIndex(angle: number): number {
        const validAngles = this.segmentAngles.filter((a) => a <= angle);

        if (validAngles.length === 0) {
            return 0;
        }

        const maxValidAngle = Math.max(...validAngles);
        return this.segmentAngles.indexOf(maxValidAngle);
    }

    private calculateDistanceFromCenter(position: [number, number]): number {
        const dx = position[0] - BOARD_CENTER_COORDINATE;
        const dy = position[1] - BOARD_CENTER_COORDINATE;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

/**
 * Dart score calculator service.
 */
export class DartScoreCalculator {
    private board: DartBoard;

    constructor() {
        this.board = new DartBoard();
    }

    /**
     * Calculate score for a single dart position.
     *
     * @param position - Transformed dart position in board space (normalized 0-1)
     * @returns Dart score with multiplier and value
     */
    calculateScore(position: { x: number; y: number }): DartScore {
        // Adjust center position to avoid division by zero
        const adjustedPosition = this.adjustCenterPosition([position.x, position.y]);

        // Calculate angle from center
        const angle = this.calculateAngle(adjustedPosition);

        // Get segment number and scoring region
        const segmentNumber = this.board.getSegmentNumber(angle, adjustedPosition);
        const scoringRegion = this.board.getScoringRegion(adjustedPosition);

        // Calculate final score
        const [multiplier, singleValue] = this.calculateScoreFromRegion(
            segmentNumber,
            scoringRegion
        );

        const computedScore = multiplier * singleValue;

        console.log(
            `Dart at (${position.x.toFixed(3)}, ${position.y.toFixed(3)}): ` +
            `${this.formatScore(multiplier, singleValue)} = ${computedScore} points ` +
            `(region: ${scoringRegion}, segment: ${segmentNumber}, angle: ${angle.toFixed(1)}°)`
        );

        return {
            multiplier,
            singleValue,
            computedScore,
        };
    }

    /**
     * Calculate scores for multiple dart positions.
     */
    calculateScores(positions: Array<{ x: number; y: number }>): DartScore[] {
        console.log(`Calculating scores for ${positions.length} darts`);
        return positions.map((pos) => this.calculateScore(pos));
    }

    private adjustCenterPosition(position: [number, number]): [number, number] {
        const adjusted: [number, number] = [...position];
        if (adjusted[0] === BOARD_CENTER_COORDINATE) {
            adjusted[0] += ANGLE_CALCULATION_EPSILON;
        }
        return adjusted;
    }

    private calculateAngle(position: [number, number]): number {
        const dx = position[0] - BOARD_CENTER_COORDINATE;
        const dy = position[1] - BOARD_CENTER_COORDINATE;

        const angleRad = Math.atan(dy / dx);
        const angleDeg = (angleRad * 180) / Math.PI;

        return angleDeg > 0 ? Math.floor(angleDeg) : Math.ceil(angleDeg);
    }

    private calculateScoreFromRegion(
        segmentNumber: number,
        scoringRegion: string
    ): [number, number] {
        const scoringRules: Record<string, [number, number]> = {
            DB: [2, 25],      // Double bull
            SB: [1, 25],      // Single bull
            S: [1, segmentNumber],   // Single
            T: [3, segmentNumber],   // Triple
            D: [2, segmentNumber],   // Double
            miss: [0, 0],     // Miss
        };

        return scoringRules[scoringRegion] || [0, 0];
    }

    private formatScore(multiplier: number, singleValue: number): string {
        if (multiplier === 0) return 'Miss';
        if (singleValue === 25) {
            return multiplier === 2 ? 'Double Bull' : 'Single Bull';
        }

        const multiplierName = ['', 'Single', 'Double', 'Triple'][multiplier] || '';
        return `${multiplierName} ${singleValue}`;
    }
}

// Export singleton instance
export const dartScoreCalculator = new DartScoreCalculator();

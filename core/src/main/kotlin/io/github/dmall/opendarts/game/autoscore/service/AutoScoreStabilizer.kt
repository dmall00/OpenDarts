package io.github.dmall.opendarts.game.autoscore.service

import io.github.dmall.opendarts.game.autoscore.model.DartDetection
import io.github.dmall.opendarts.game.autoscore.model.DetectionResult
import io.github.dmall.opendarts.game.autoscore.model.DetectionState
import io.github.dmall.opendarts.game.autoscore.model.PipelineDetectionResponse
import io.github.dmall.opendarts.game.events.DartThrowDetectedEvent
import io.github.dmall.opendarts.game.model.DartThrow
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import java.util.*
import kotlin.math.sqrt

private const val DISTANCE_THRESHOLD = 0.01
private const val CONFIDENCE_THRESHOLD = 0.1

@Service
class AutoScoreStabilizer
    @Autowired
    constructor(
        private val applicationEventPublisher: ApplicationEventPublisher,
        private val turnSwitchDetector: TurnSwitchDetector,
    ) {
        private val logger = KotlinLogging.logger {}

        private val detectionStates: MutableMap<String, DetectionState> = Collections.synchronizedMap(mutableMapOf())
        private val confirmedDartsPerSession: MutableMap<String, MutableList<Pair<Double, Double>>> =
            Collections.synchronizedMap(mutableMapOf())

        fun processDartDetectionResult(detection: PipelineDetectionResponse) {
            if (!isValidDetection(detection)) {
                logger.info { "Invalid autoscore result received" }
                return
            }

            val id = composeId(detection.playerId, detection.sessionId)
            val detectionState = detectionStates.getOrPut(id) { DetectionState() }

            when {
                detection.detectionResult.resultCode.isYoloError() -> handleYoloError(detectionState)
                detection.detectionResult.resultCode.isMissingCalibration() -> handleMissingCalibration(detectionState)
                else ->
                    handleDartRecognition(
                        detection.detectionResult,
                        detectionState,
                        id,
                        detection.playerId,
                        detection.sessionId,
                    )
            }
        }

        private fun isValidDetection(detection: PipelineDetectionResponse): Boolean = detection.status.isSuccess()

        private fun composeId(
            playerId: String,
            sessionId: String,
        ): String = "$playerId/$sessionId"

        private fun handleYoloError(detectionState: DetectionState) {
            detectionState.yoloErrors++
        }

        private fun handleMissingCalibration(detectionState: DetectionState) {
            detectionState.missingCalibrations++
        }

        private fun handleDartRecognition(
            detectionResult: DetectionResult,
            detectionState: DetectionState,
            id: String,
            playerId: String,
            sessionId: String,
        ) {
            val imageDarts = detectionResult.scoringResult?.dartDetections ?: return
            logger.info { "Recognized ${imageDarts.size} darts on board: $imageDarts" }

            val confirmedDarts = confirmedDartsPerSession.getOrPut(id) { mutableListOf() }
            val currentImageDarts = extractDartPositions(imageDarts)

            if (confirmedDarts.size >= 3) {
                handleThreeDartsConfirmed(currentImageDarts, detectionState, confirmedDarts, playerId, sessionId)
                return
            }

            // Check if we need to register missed darts
            val hasDartsOnBoardBefore = !detectionState.isNewTurnAndBoardCleared || confirmedDarts.isNotEmpty()
            val (shouldRegisterMisses, missCount) =
                turnSwitchDetector.detectMissedDarts(
                    id,
                    confirmedDarts.size,
                    currentImageDarts.size,
                    hasDartsOnBoardBefore,
                )

            if (shouldRegisterMisses) {
                registerMissedDarts(missCount, playerId, sessionId, confirmedDarts)
                // After registering misses, we'll have 3 darts, so check if board is clear
                handleThreeDartsConfirmed(currentImageDarts, detectionState, confirmedDarts, playerId, sessionId)
                return
            }

            if (detectionState.isNewTurnAndBoardCleared) {
                registerNewDarts(currentImageDarts, imageDarts, confirmedDarts, playerId, sessionId, detectionState)
            } else {
                logger.info { "Waiting for board to clear before accepting new darts." }
            }
        }

        /**
         * Registers missed darts (with score 0) for the current player
         */
        private fun registerMissedDarts(
            missCount: Int,
            playerId: String,
            sessionId: String,
            confirmedDarts: MutableList<Pair<Double, Double>>,
        ) {
            logger.info { "Registering $missCount missed dart(s) for player $playerId" }

            // Add dummy positions for missed darts - they won't be visible but we need to track them
            for (i in 0 until missCount) {
                // Create a dart with score 0
                val dartThrow = DartThrow(1, 0) // multiplier 1, value 0 = 0 points

                // Publish the event for this missed dart
                applicationEventPublisher.publishEvent(
                    DartThrowDetectedEvent(this, sessionId, playerId, dartThrow),
                )

                // Add a dummy position for tracking
                // Use a negative position to ensure it doesn't collide with real dart positions
            confirmedDarts.add((-1.0 - i) to -1.0)
            }
        }

        private fun handleThreeDartsConfirmed(
            currentImageDarts: List<Pair<Double, Double>>,
            detectionState: DetectionState,
            confirmedDarts: MutableList<Pair<Double, Double>>,
            playerId: String,
            sessionId: String,
        ) {
            if (turnSwitchDetector.handleThreeDartsState(currentImageDarts.size, detectionState, playerId, sessionId)) {
                resetStateForNewTurn(playerId, sessionId, confirmedDarts, detectionState)
            }
        }

        private fun registerNewDarts(
            currentImageDarts: List<Pair<Double, Double>>,
            imageDarts: List<DartDetection>,
            confirmedDarts: MutableList<Pair<Double, Double>>,
            playerId: String,
            sessionId: String,
            detectionState: DetectionState,
        ) {
            val newDarts = findNewDarts(currentImageDarts, confirmedDarts)
            submitNewDarts(newDarts, imageDarts, confirmedDarts, playerId, sessionId)
            turnSwitchDetector.checkMaximumDartsReached(confirmedDarts.size, detectionState)
        }

        private fun extractDartPositions(darts: List<DartDetection>): List<Pair<Double, Double>> = darts.map { dart -> toPair(dart) }

        private fun findNewDarts(
            currentImageDarts: List<Pair<Double, Double>>,
            confirmedDarts: List<Pair<Double, Double>>,
        ): List<Pair<Double, Double>> =
            currentImageDarts.filter { current ->
                confirmedDarts.none { stable -> isSameDart(current, stable) }
            }

        private fun submitNewDarts(
            newDarts: List<Pair<Double, Double>>,
            imageDarts: List<DartDetection>,
            confirmedDarts: MutableList<Pair<Double, Double>>,
            playerId: String,
            sessionId: String,
        ) {
            for (dart in imageDarts) {
                val pos = toPair(dart)
                val confidence = dart.originalPosition.confidence

                if (confidence > CONFIDENCE_THRESHOLD && newDarts.contains(pos)) {
                    val multiplier = dart.dartScore.multiplier
                    val score = dart.dartScore.singleValue
                    logger.info { "Detected new dart with score $score - $multiplier = ${multiplier * score}" }

                    val dartThrow = DartThrow(multiplier, score)
                    applicationEventPublisher.publishEvent(
                        DartThrowDetectedEvent(this, sessionId, playerId, dartThrow),
                    )
                    confirmedDarts.add(pos)
                }
            }
        }

        private fun toPair(dart: DartDetection): Pair<Double, Double> =
        dart.transformedPosition.x.toDouble() to dart.transformedPosition.y.toDouble()

        private fun resetStateForNewTurn(
            playerId: String,
            sessionId: String,
            stableDarts: MutableList<Pair<Double, Double>>,
            detectionState: DetectionState,
        ) {
            stableDarts.clear()
            turnSwitchDetector.resetStateForNewTurn(playerId, sessionId, detectionState)
            logger.info { "Cleared tracked darts for new turn." }
        }

        private fun isSameDart(
            current: Pair<Double, Double>,
            previous: Pair<Double, Double>,
        ): Boolean {
            val dx = current.first - previous.first
            val dy = current.second - previous.second
            val distance = sqrt(dx * dx + dy * dy)
            return distance < DISTANCE_THRESHOLD
        }
    }

package io.github.dmall.opendarts.game.autoscore.service

import io.github.dmall.opendarts.game.autoscore.model.DartDetection
import io.github.dmall.opendarts.game.autoscore.model.DetectionResult
import io.github.dmall.opendarts.game.autoscore.model.DetectionState
import io.github.dmall.opendarts.game.autoscore.model.PipelineDetectionResponse
import io.github.dmall.opendarts.game.model.DartThrow
import io.github.dmall.opendarts.game.service.GameOrchestrator
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import java.util.*
import kotlin.math.sqrt

private const val DISTANCE_THRESHOLD = 0.01
private const val CONFIDENCE_THRESHOLD = 0.1

@Service
class AutoScoreStabilizer
    @Autowired
    constructor(
        private val orchestrator: GameOrchestrator,
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
                    associateDetectionsWithTrackedDarts(
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

        private fun associateDetectionsWithTrackedDarts(
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

            val newDartPositions = findNewDarts(currentImageDarts, confirmedDarts)

            submitNewDarts(newDartPositions, imageDarts, confirmedDarts, playerId, sessionId)

            if (turnSwitchDetector.isTurnSwitch(detectionState, confirmedDarts.size, currentImageDarts.size)) {
                resetStateForNewTurn(playerId, sessionId, confirmedDarts, detectionState)
            }
        }

        private fun extractDartPositions(darts: List<DartDetection>): List<Pair<Double, Double>> =
            darts.map { dart ->
                dart.transformedPosition.x.toDouble() to dart.transformedPosition.y.toDouble()
            }

        private fun findNewDarts(
            currentPositions: List<Pair<Double, Double>>,
            stablePositions: List<Pair<Double, Double>>,
        ): List<Pair<Double, Double>> =
            currentPositions.filter { current ->
                stablePositions.none { stable -> isSameDart(current, stable) }
            }

        private fun submitNewDarts(
            newDartPositions: List<Pair<Double, Double>>,
            imageDarts: List<DartDetection>,
            confirmedDarts: MutableList<Pair<Double, Double>>,
            playerId: String,
            sessionId: String,
        ) {
            for (dart in imageDarts) {
                val pos = dart.transformedPosition.x.toDouble() to dart.transformedPosition.y.toDouble()
                val confidence = dart.originalPosition.confidence

                if (confidence > CONFIDENCE_THRESHOLD && newDartPositions.contains(pos)) {
                    val multiplier = dart.dartScore.multiplier
                    val score = dart.dartScore.singleValue
                    logger.info { "Detected new dart with score $score - $multiplier = ${multiplier * score}" }

                    orchestrator.submitDartThrow(sessionId, playerId, DartThrow(multiplier, score))
                    confirmedDarts.add(pos)
                }
            }
        }

        private fun resetStateForNewTurn(
            playerId: String,
            sessionId: String,
            stableDarts: MutableList<Pair<Double, Double>>,
            detectionState: DetectionState,
        ) {
            stableDarts.clear()
            detectionState.yoloErrors = 0
            detectionState.missingCalibrations = 0
            logger.info { "Turn switch detected for player $playerId in session $sessionId. Resetting tracked darts and error counts." }
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

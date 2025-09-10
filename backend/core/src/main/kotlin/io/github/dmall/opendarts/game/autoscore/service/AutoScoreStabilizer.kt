package io.github.dmall.opendarts.game.autoscore.service

import io.github.dmall.opendarts.game.autoscore.events.DartThrowDetectedEvent
import io.github.dmall.opendarts.game.autoscore.events.ManualDartAdjustment
import io.github.dmall.opendarts.game.autoscore.events.TurnSwitchDetectedEvent
import io.github.dmall.opendarts.game.autoscore.model.DartDetection
import io.github.dmall.opendarts.game.autoscore.model.DetectionResult
import io.github.dmall.opendarts.game.autoscore.model.DetectionState
import io.github.dmall.opendarts.game.autoscore.model.PipelineDetectionResponse
import io.github.dmall.opendarts.game.model.DartThrowRequest
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.ApplicationEventPublisher
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Service
import java.util.*

private const val DISTANCE_THRESHOLD = 0.01
private const val CONFIDENCE_THRESHOLD = 0.1
private const val MISS_DART_CONFIDENCE_THRESHOLD = 0.5

@Service
class AutoScoreStabilizer
@Autowired
constructor(
    applicationEventPublisher: ApplicationEventPublisher,
    private val turnSwitchDetector: TurnSwitchDetector,
) : AutoScoreBaseService(applicationEventPublisher) {
    private val logger = KotlinLogging.logger {}

    private val detectionStates: MutableMap<String, DetectionState> = Collections.synchronizedMap(mutableMapOf())

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

    @EventListener
    fun consumeManualDartTrackedEvent(manualDartAdjustment: ManualDartAdjustment) {
        val id = composeId(manualDartAdjustment.playerId, manualDartAdjustment.sessionId)
        val detectionState = detectionStates.getOrPut(id) { DetectionState() }
        if (manualDartAdjustment.dartThrowRequest != null) {
            if (detectionState.confirmedDarts.size < 3) {
                detectionState.confirmedDarts += Pair(0.0, 0.0)
            }
        }
        if (manualDartAdjustment.dartRevertRequest != null) {
            detectionState.confirmedDarts.removeLastOrNull()
        }
    }

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

        val dartInfo = imageDarts.mapIndexed { index, dart ->
            val scoreText = if (dart.dartScore.multiplier == 1) {
                "${dart.dartScore.singleValue}"
            } else {
                "${dart.dartScore.multiplier}x${dart.dartScore.singleValue}"
            }
            "Dart ${index + 1}: $scoreText (confidence: ${String.format("%.3f", dart.originalPosition.confidence)})"
        }.joinToString(", ")

        logger.info { "Recognized ${imageDarts.size} darts on board: [$dartInfo]" }

        val confirmedDarts = detectionState.confirmedDarts
        val currentImageDarts = extractDartPositions(imageDarts)

        if (confirmedDarts.size >= 3) {
            handleThreeDartsConfirmed(currentImageDarts, detectionState, confirmedDarts, playerId, sessionId)
            return
        }

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

        for (i in 0 until missCount) {
            val dartThrowRequest = DartThrowRequest(1, 0, true)

            applicationEventPublisher.publishEvent(
                DartThrowDetectedEvent(this, sessionId, playerId, dartThrowRequest),
            )
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

    private fun extractDartPositions(darts: List<DartDetection>): List<Pair<Double, Double>> =
        darts.map { dart -> toPair(dart) }

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
            val multiplier = dart.dartScore.multiplier
            val score = dart.dartScore.singleValue

            if (isOverConfidenceThreshold(confidence, score) && newDarts.contains(pos)) {
                logger.info {
                    "Detected new dart with confidence $confidence and score $score*$multiplier = ${multiplier * score}, pos: $pos"
                }

                val dartThrowRequest = DartThrowRequest(multiplier, score, true)
                applicationEventPublisher.publishEvent(
                    DartThrowDetectedEvent(this, sessionId, playerId, dartThrowRequest),
                )
                confirmedDarts.add(pos)
            }
        }
    }

    private fun isOverConfidenceThreshold(
        confidence: Float,
        score: Int,
    ): Boolean =
        (confidence > CONFIDENCE_THRESHOLD && score != 0) || (confidence > MISS_DART_CONFIDENCE_THRESHOLD && score == 0)

    private fun toPair(dart: DartDetection): Pair<Double, Double> =
        dart.transformedPosition.x.toDouble() to dart.transformedPosition.y.toDouble()

    private fun resetStateForNewTurn(
        playerId: String,
        sessionId: String,
        stableDarts: MutableList<Pair<Double, Double>>,
        detectionState: DetectionState,
    ) {
        detectionState.confirmedDarts.clear()
        turnSwitchDetector.resetStateForNewTurn(playerId, sessionId, detectionState)
        logger.info { "Cleared tracked darts for new turn." }
        applicationEventPublisher.publishEvent(TurnSwitchDetectedEvent(this, sessionId, playerId))
    }

    private fun isSameDart(
        current: Pair<Double, Double>,
        previous: Pair<Double, Double>,
    ): Boolean = calculateDistance(current, previous) < DISTANCE_THRESHOLD
}

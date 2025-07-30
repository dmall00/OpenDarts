package io.github.dmall.opendarts.game.autoscore.service

import TurnSwitchDetector
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

private const val distanceThreshold = 10.0

private const val confidenceThreshold = 0.1

@Service
class AutoScoreStabilizer @Autowired constructor(
    private val orchestrator: GameOrchestrator,
    private val turnSwitchDetector: TurnSwitchDetector
) {

    private val logger = KotlinLogging.logger {}

    private val detectionStates: MutableMap<String, DetectionState> = Collections.synchronizedMap(mutableMapOf())
    private val stableDartsPerSession: MutableMap<String, MutableList<Pair<Double, Double>>> =
        Collections.synchronizedMap(mutableMapOf())

    fun processDartDetectionResult(detection: PipelineDetectionResponse) {
        if (!detection.status.isSuccess()) {
            logger.info { "Invalid autoscore result received" }
            return
        }

        val detectionResult = detection.detectionResult
        val resultCode = detectionResult.resultCode
        val id = "${detection.playerId}/${detection.sessionId}"
        val detectionState = detectionStates.getOrPut(id) { DetectionState() }

        if (resultCode.isYoloError()) {
            detectionState.yoloErrors++
            return
        }

        if (resultCode.isMissingCalibration()) {
            detectionState.missingCalibrations++
            return
        }

        associateDetectionsWithTrackedDarts(
            detectionResult,
            detectionState,
            id,
            detection.playerId,
            detection.sessionId
        )
    }

    private fun associateDetectionsWithTrackedDarts(
        detectionResult: DetectionResult,
        detectionState: DetectionState,
        id: String,
        playerId: String,
        sessionId: String
    ) {
        val scoringResult = detectionResult.scoringResult ?: return
        val darts = scoringResult.dartDetections
        val stableDarts = stableDartsPerSession.getOrPut(id) { mutableListOf() }
        val currentStableDarts = mutableListOf<Pair<Double, Double>>()

        var newDartsCount = 0

        for (dart in darts) {
            val transformed = dart.transformedPosition
            currentStableDarts.add(transformed.x.toDouble() to transformed.y.toDouble())
        }

        val newDarts = currentStableDarts.filter { current ->
            stableDarts.none { previous ->
                val dx = current.first - previous.first
                val dy = current.second - previous.second
                val distance = sqrt(dx * dx + dy * dy)
                distance < distanceThreshold
            }
        }

        for (dart in darts) {
            val transformed = dart.transformedPosition
            val confidence = dart.originalPosition.confidence
            if (confidence > confidenceThreshold) {
                val pos = transformed.x.toDouble() to transformed.y.toDouble()
                if (newDarts.contains(pos)) {

                    val firstChar = dart.dartScore.scoreString.first()

                    val multiplier = when (firstChar) {
                        'S' -> 1
                        'D' -> 2
                        'T' -> 3
                        else -> throw IllegalArgumentException("Unexpected character: $firstChar")
                    }
                    val score = dart.dartScore.scoreValue
                    logger.info { "Detected new dart with score $score $multiplier = ${multiplier * score}" }
                    orchestrator.submitDartThrow(
                        sessionId,
                        playerId,
                        DartThrow(multiplier, score)
                    )
                    newDartsCount++
                    stableDarts.add(pos)
                }
            }
        }

        val turnSwitched = turnSwitchDetector.isTurnSwitch(
            playerId = playerId,
            sessionId = sessionId,
            currentYoloErrors = detectionState.yoloErrors,
            currentMissingCalibrations = detectionState.missingCalibrations,
            currentDetectedDarts = stableDarts.size,
            dartThreshold = 3
        )

        if (turnSwitched) {
            stableDarts.clear()
            detectionState.yoloErrors = 0
            detectionState.missingCalibrations = 0
            logger.info { "Turn switch detected for player $playerId in session $sessionId. Resetting tracked darts and error counts." }
        }
    }

}
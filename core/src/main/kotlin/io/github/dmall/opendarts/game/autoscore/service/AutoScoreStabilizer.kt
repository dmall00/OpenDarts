package io.github.dmall.opendarts.game.autoscore.service

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

private const val confidenceThreshold = 0.8

@Service
class AutoScoreStabilizer @Autowired constructor(private val orchestrator: GameOrchestrator) {

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
            id,
            detection.playerId,
            detection.sessionId
        )
    }

    private fun associateDetectionsWithTrackedDarts(
        detectionResult: DetectionResult,
        id: String,
        playerId: String,
        sessionId: String
    ) {
        val scoringResult = detectionResult.scoringResult ?: return
        val darts = scoringResult.dartDetections
        val stableDarts = stableDartsPerSession.getOrPut(id) { mutableListOf() }
        val currentStableDarts = mutableListOf<Pair<Double, Double>>()

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
                    orchestrator.submitDartThrow(
                        sessionId,
                        playerId,
                        DartThrow(dart.dartScore.scoreString.toInt(), dart.dartScore.scoreValue)
                    )
                }
            }
        }
    }
}
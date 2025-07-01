package io.github.dmall.opendarts.game.autoscore.service

import io.github.dmall.opendarts.game.autoscore.model.DetectionState
import io.github.dmall.opendarts.game.autoscore.model.PipelineDetectionResponse
import io.github.dmall.opendarts.game.service.GameOrchestrator
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service

@Service
class AutoScoreStabilizer @Autowired constructor(private val orchestrator: GameOrchestrator) {

    private val logger = KotlinLogging.logger {}


    private val detectionStates: MutableMap<String, DetectionState> = mutableMapOf()

    fun processDartDetectionResult(detection: PipelineDetectionResponse) {
        if (!detection.status.isSuccess()) {
            logger.info { "Invalid autoscore result received" }
            return
        }

        val detectionResult = detection.detectionResult
        val resultCode = detectionResult.resultCode
        val id = "${detection.playerId}/${detection.sessionId}"
        val detectionState = detectionStates.getOrPut(id) { DetectionState() }


        // handle no objects detected from yolo model
        if (resultCode.isYoloError()) {
            detectionState.yoloErrors++
        }

        if (resultCode.isMissingCalibration()) {
            detectionState.missingCalibrations++
        }




    }
}

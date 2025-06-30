package io.github.dmall.opendarts.game.autoscore.service

import io.github.dmall.opendarts.game.autoscore.model.AutoScoringResultCode
import io.github.dmall.opendarts.game.autoscore.model.PipelineDetectionResponse
import io.github.dmall.opendarts.game.autoscore.model.Status
import io.github.dmall.opendarts.game.service.GameOrchestrator
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service

@Service
class AutoScoreStabilizer @Autowired constructor(private val orchestrator: GameOrchestrator) {


    fun processDartDetectionResult(detection: PipelineDetectionResponse) {
        if (detection.status == Status.SUCCESS && detection.detectionResult.resultCode == AutoScoringResultCode.SUCCESS) {

        }

    }
}
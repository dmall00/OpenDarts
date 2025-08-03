package io.github.dmall.opendarts.game.autoscore.service

import io.github.dmall.opendarts.game.autoscore.model.DetectionState
import org.springframework.stereotype.Service

@Service
class TurnSwitchDetector {
    fun isTurnSwitch(
        detectionState: DetectionState,
        stableDartsSize: Int,
        currentInImageDartsSize: Int,
    ): Boolean {
        val yoloErrors = detectionState.yoloErrors
        val missingCalibrations = detectionState.missingCalibrations

        val tooManyErrors = (yoloErrors > 15) || (missingCalibrations > 15)
        val enoughDarts = stableDartsSize == 3 && currentInImageDartsSize == 0

        return enoughDarts && !tooManyErrors
    }
}

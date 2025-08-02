package io.github.dmall.opendarts.game.autoscore.service

import io.github.dmall.opendarts.game.autoscore.model.DetectionState
import org.springframework.stereotype.Service
import java.util.*

@Service
class TurnSwitchDetector {

    fun isTurnSwitch(
        key: String,
        detectionState: DetectionState
    ): Boolean {
        val yoloErrors = detectionState.yoloErrors
        val missingCalibrations = detectionState.missingCalibrations
        val stableDartsSize = detectionState.stableDarts.size

        val tooManyErrors = (yoloErrors > 15) || (missingCalibrations > 15)
        val enoughDarts = stableDartsSize == 3

        return enoughDarts && !tooManyErrors
    }

}

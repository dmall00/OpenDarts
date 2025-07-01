package io.github.dmall.opendarts.game.autoscore.model

import java.util.*

enum class DartState {
    CANDIDATE,
    STABLE,
    OCCLUDED,
    REMOVED
}

data class StableDart(
    val id: UUID,
    val position: DartPosition,
    val state: DartState,
    val detectionHistory: List<DetectionRecord>
)

data class DetectionRecord(
    val position: DartPosition,
    val confidence: Float
)


data class DetectionState(
    val stableDarts: MutableList<StableDart> = mutableListOf(),
    var turnInProgress: Boolean = true,
    var frame: Int = 0,
    var lastCalibration: Int = -1,
    var yoloErrors: Int = 0,
    var missingCalibrations: Int = 0
)


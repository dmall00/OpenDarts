package io.github.dmall.opendarts.game.autoscore.model

import io.github.dmall.opendarts.game.util.DartScoreUtil

data class DetectionState(
    var isNewTurnAndBoardCleared: Boolean = true,
    var yoloErrors: Int = 0,
    var missingCalibrations: Int = 0,
    val confirmedDarts: MutableList<ConfirmedDart> = mutableListOf(),
)

data class CalibrationState(
    var consecutiveCalibrations: Int = 0,
    var consecutiveFailedCalibrations: Int = 0,
    val calibrationList: MutableList<Map<Int, Pair<Double, Double>>> = mutableListOf(),
)

data class ConfirmedDart(
    val position: Pair<Double, Double>,
    var scoreString: String? = null,
    var autoScored: Boolean = true,
    var reverted: Boolean = false,
    var filled: Boolean = false
)

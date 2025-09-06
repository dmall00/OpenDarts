package io.github.dmall.opendarts.game.autoscore.model

data class DetectionState(
    var isNewTurnAndBoardCleared: Boolean = true,
    var yoloErrors: Int = 0,
    var missingCalibrations: Int = 0,
    val confirmedDarts: MutableList<Pair<Double, Double>> = mutableListOf(),
)

data class CalibrationState(
    var consecutiveCalibrations: Int = 0,
    var consecutiveFailedCalibrations: Int = 0,
    val calibrationList: MutableList<Map<Int, Pair<Double, Double>>> = mutableListOf(),
)

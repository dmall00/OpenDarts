package io.github.dmall.opendarts.game.autoscore.model

data class DetectionState(
    var isNewTurnAndBoardCleared: Boolean = true,
    var yoloErrors: Int = 0,
    var missingCalibrations: Int = 0,
    val confirmedDarts: MutableList<Pair<Double, Double>> = mutableListOf(),
)

data class CalibrationState(
    val test: String,
)

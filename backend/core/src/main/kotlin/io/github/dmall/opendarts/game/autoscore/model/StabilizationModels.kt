package io.github.dmall.opendarts.game.autoscore.model

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
enum class DartOrigin {
    MANUAL_SCORING,
    MANUAL_BUST,
    AUTO_SCORE,
    AUTO_SCORE_MISS,
    AUTO_SCORE_BUST
}

data class ConfirmedDart(
    val position: Pair<Double, Double>,
    var scoreString: String? = null,
    var origin: DartOrigin = DartOrigin.AUTO_SCORE,
)

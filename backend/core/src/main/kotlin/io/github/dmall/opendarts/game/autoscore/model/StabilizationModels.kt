package io.github.dmall.opendarts.game.autoscore.model

data class DetectionState(
    var isNewTurnAndBoardCleared: Boolean = true,
    var yoloErrors: Int = 0,
    var missingCalibrations: Int = 0,
    val confirmedDarts: MutableList<ConfirmedDart> = mutableListOf(),
    val pendingDarts: MutableList<PendingDart> = mutableListOf()
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
    var score: Int = 0,
    var multiplier: Int = 1,
    var origin: DartOrigin = DartOrigin.AUTO_SCORE,
)

data class PendingDart(
    val position: Pair<Double, Double>,
    val score: Int,
    val multiplier: Int,
    var appearanceCount: Int = 1,
    var lastSeenFrameIndex: Int = 0,
    var framesSinceLastSeen: Int = 0
)

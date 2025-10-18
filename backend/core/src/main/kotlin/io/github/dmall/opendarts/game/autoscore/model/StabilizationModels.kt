package io.github.dmall.opendarts.game.autoscore.model

data class DetectionState(
  var isNewTurnAndBoardCleared: Boolean = true,
  var yoloErrors: Int = 0,
  var missingCalibrations: Int = 0,
  val confirmedDarts: MutableList<ConfirmedDart> = mutableListOf(),
  val revertedDarts: MutableList<ConfirmedDart> = mutableListOf(),
  val pendingDarts: MutableList<PendingDart> = mutableListOf(),
  var frameIndex: Int = 0,
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
  AUTO_SCORE_BUST,
}

open class AutoScoreDart(
  open val position: Pair<Double, Double>,
  open val score: Int,
  open val multiplier: Int,
)

data class ConfirmedDart(
  override val position: Pair<Double, Double>,
  override var score: Int,
  override var multiplier: Int,
  var origin: DartOrigin = DartOrigin.AUTO_SCORE,
  var internalId: Long,
) : AutoScoreDart(position, score, multiplier)

data class PendingDart(
  override val position: Pair<Double, Double>,
  override val score: Int,
  override val multiplier: Int,
  var appearanceCount: Int = 1,
  var lastSeenFrameIndex: Int = 0,
  var framesSinceLastSeen: Int = 0,
) : AutoScoreDart(position, score, multiplier)

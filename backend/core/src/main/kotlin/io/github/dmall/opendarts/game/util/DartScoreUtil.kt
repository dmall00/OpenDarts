package io.github.dmall.opendarts.game.util

object DartScoreUtil {

  fun computeScore(score: Int, multiplier: Int): Int {
    return when {
      isMiss(score) -> 0
      isBull(score, multiplier) -> 50
      isOuterBull(score, multiplier) -> 25
      else -> score * multiplier
    }
  }

  fun getScoreString(score: Int, multiplier: Int): String {
    return when {
      isMiss(score) -> "MISS"
      isBull(score, multiplier) -> "BULL"
      else ->
        when (multiplier) {
          1 -> "S$score"
          2 -> "D$score"
          3 -> "T$score"
          else -> throw IllegalArgumentException("Invalid dart throw: $multiplier * $score")
        }
    }
  }

  private fun isBull(score: Int, multiplier: Int) = score == 25 && multiplier == 1

  private fun isOuterBull(score: Int, multiplier: Int) = score == 25 && multiplier == 2

  private fun isMiss(score: Int) = score == 0
}

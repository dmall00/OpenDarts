package io.github.dmall.opendarts.game.model

import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.annotation.JsonProperty

data class DartThrow(
    val multiplier: Int,
    val score: Int,
    val autoScore: Boolean,
) {
    val computedScore: Int
        @JsonProperty(access = JsonProperty.Access.READ_ONLY)
        get() =
            when {
                isMiss() -> 0
                isBull() -> 50
                isOuterBull() -> 25
                else -> score * multiplier
            }

    val scoreString: String
        @JsonProperty(access = JsonProperty.Access.READ_ONLY)
        get() =
            when {
                isMiss() -> "MISS"
                isBull() -> "BULL"
                else ->
                    when (multiplier) {
                        1 -> "S$score"
                        2 -> "D$score"
                        3 -> "T$score"
                        else -> throw IllegalArgumentException("Invalid dart throw: $multiplier * $score")
                    }
            }

    private fun isBull() = score == 25 && multiplier == 1

    private fun isOuterBull() = score == 25 && multiplier == 2

    private fun isMiss() = score == 0
}

data class CurrentGameState(
    val currentDartThrow: DartThrow,
    val currentDartNumber: Int,
    val currentTurnDarts: List<Dart>,
    val currentPlayer: Player,
    val remainingScore: Int,
    val isLegWon: Boolean = false,
    val isSetWon: Boolean = false,
    val isGameWon: Boolean = false,
    val winner: Player? = null,
    val nextPlayer: Player? = null,
    val message: String? = null,
    val bust: Boolean = false,
)

data class GameStateTo(
    val currentPlayer: String,
    val currentRemainingScores: Map<String, Int>,
    val currentLegDarts: List<DartThrow>,
    val currentLeg: Int = 1,
    val currentSet: Int = 1,
    val legsWon: Map<String, Int> = emptyMap(),
    val setsWon: Map<String, Int> = emptyMap(),
    val dartsThrown: Int = 0,
    val turnsPlayed: Int = 0,
)

data class AppCalibrationResult(
    val calibrated: Boolean,
)

data class GameState(
    val currentPlayer: Player,
    val currentRemainingScores: Map<Player, Int>,
    val currentLegDarts: List<DartThrow>,
    val currentLeg: Int = 1,
    val currentSet: Int = 1,
    val legsWon: Map<Player, Int> = emptyMap(),
    val setsWon: Map<Player, Int> = emptyMap(),
    val dartsThrown: Int = 0,
    val turnsPlayed: Int = 0,
)

@JsonInclude(JsonInclude.Include.NON_NULL)
data class CurrentGameStateTO(
    val currentDartThrow: DartThrow,
    val currentDartNumber: Int,
    val currentTurnDarts: List<DartThrow>,
    val currentPlayer: String,
    val remainingScore: Int,
    val isLegWon: Boolean = false,
    val isSetWon: Boolean = false,
    val isGameWon: Boolean = false,
    val winner: String? = null,
    val nextPlayer: String? = null,
    val message: String? = null,
    val bust: Boolean = false,
)

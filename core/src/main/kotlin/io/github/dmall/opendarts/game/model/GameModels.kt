package io.github.dmall.opendarts.game.model

import com.fasterxml.jackson.annotation.JsonIgnore

data class DartThrow(
    val multiplier: Int,
    val score: Int,
) {
    val computedScore: Int
        @JsonIgnore
        get() = score * multiplier
}

data class GameResult(
    val isValidThrow: Boolean,
    val scoreChange: Int,
    val remainingScore: Int? = null,
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

data class DartTrackedTo(
    val currentPlayer: String,
    val remainingScore: Int,
    val trackedDart: DartThrow,
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

data class GameResultTo(
    val isValidThrow: Boolean,
    val scoreChange: Int,
    val remainingScore: Int? = null,
    val isLegWon: Boolean = false,
    val isSetWon: Boolean = false,
    val isGameWon: Boolean = false,
    val winner: String? = null,
    val nextPlayer: String? = null,
    val message: String? = null,
    val bust: Boolean = false,
)

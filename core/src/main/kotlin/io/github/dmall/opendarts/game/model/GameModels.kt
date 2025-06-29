package io.github.dmall.opendarts.game.model

data class DartThrow(val multiplier: Int, val score: Int) {
    val computedScore: Int
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
    val currentPlayer: Long,
    val scores: Map<Long, Int>,
    val currentLeg: Int = 1,
    val currentSet: Int = 1,
    val legsWon: Map<Long, Int> = emptyMap(),
    val setsWon: Map<Long, Int> = emptyMap(),
    val dartsThrown: Int = 0,
    val turnsPlayed: Int = 0,
)

data class GameState(
    val currentPlayer: Player,
    val scores: Map<Player, Int>,
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
    val winner: Long? = null,
    val nextPlayer: Long? = null,
    val message: String? = null,
    val bust: Boolean = false,
)

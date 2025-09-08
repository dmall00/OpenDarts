package io.github.dmall.opendarts.game.model

import com.fasterxml.jackson.annotation.JsonInclude
import io.github.dmall.opendarts.game.validation.ValidDartThrowRequest

@ValidDartThrowRequest
data class DartThrowRequest(
    val multiplier: Int,
    val score: Int,
    val autoScore: Boolean
)

data class DartRevertRequest(
    val id: Long
)

data class DartResponse(
    val id: Long,
    val multiplier: Int,
    val score: Int,
    val computedScore: Int,
    val scoreString: String
)

data class CurrentGameState(
    val currentDartNumber: Int,
    val currentTurnDarts: List<Dart>,
    val currentPlayer: Player,
    val remainingScore: Int,
    val legWon: Boolean = false,
    val setWon: Boolean = false,
    val gameWon: Boolean = false,
    val winner: Player? = null,
    val nextPlayer: Player? = null,
    val message: String? = null,
    val bust: Boolean = false,
)

data class GameStateTo(
    val currentPlayer: String,
    val currentRemainingScores: Map<String, Int>,
    val currentLegDarts: List<DartResponse>,
    val currentLeg: Int = 1,
    val currentSet: Int = 1,
    val legsWon: Map<String, Int> = emptyMap(),
    val setsWon: Map<String, Int> = emptyMap(),
    val dartsThrown: Int = 0,
    val turnsPlayed: Int = 0,
)

data class AppCalibrationResponse(
    val calibrated: Boolean,
)

data class GameState(
    val currentPlayer: Player,
    val currentRemainingScores: Map<Player, Int>,
    val currentLegDarts: List<DartThrowRequest>,
    val currentLeg: Int = 1,
    val currentSet: Int = 1,
    val legsWon: Map<Player, Int> = emptyMap(),
    val setsWon: Map<Player, Int> = emptyMap(),
    val dartsThrown: Int = 0,
    val turnsPlayed: Int = 0,
)

@JsonInclude(JsonInclude.Include.NON_NULL)
data class CurrentGameStateTO(
    val currentDartNumber: Int,
    val currentTurnDarts: List<DartResponse>,
    val currentPlayer: String,
    val remainingScore: Int,
    val legWon: Boolean,
    val setWon: Boolean,
    val gameWon: Boolean,
    val winner: String? = null,
    val nextPlayer: String? = null,
    val message: String? = null,
    val bust: Boolean = false,
)

package io.github.dmall.opendarts.game.model

import com.fasterxml.jackson.annotation.JsonInclude
import io.github.dmall.opendarts.game.validation.ValidDartThrowRequest
import jakarta.validation.constraints.NotNull

@ValidDartThrowRequest
data class DartThrowRequest(
    val multiplier: Int,
    val score: Int,

    @field:NotNull
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

data class PlayerTO(
    val id: String,
    val name: String
)

data class CurrentGameState(
    val currentTurnDarts: Map<Player, List<Dart>>,
    val currentRemainingScores: Map<Player, Int>,
    val currentPlayer: Player,
    val legWon: Boolean = false,
    val setWon: Boolean = false,
    val gameWon: Boolean = false,
    val winner: Player? = null,
    val nextPlayer: Player? = null,
    val message: String? = null,
    val bust: Boolean = false,
)

data class AppCalibrationResponse(
    val calibrated: Boolean,
)

@JsonInclude(JsonInclude.Include.NON_NULL)
data class CurrentGameStateTO(
    val currentTurnDarts: Map<String, List<DartResponse>>,
    val currentRemainingScores: Map<String, Int>,
    val currentPlayer: PlayerTO,
    val legWon: Boolean,
    val setWon: Boolean,
    val gameWon: Boolean,
    val winner: PlayerTO? = null,
    val nextPlayer: PlayerTO? = null,
    val message: String? = null,
    val bust: Boolean = false,
)



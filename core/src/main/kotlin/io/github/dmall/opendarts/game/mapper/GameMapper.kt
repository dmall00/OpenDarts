package io.github.dmall.opendarts.game.mapper

import io.github.dmall.opendarts.game.model.*
import org.springframework.stereotype.Component

@Component
class GameMapper {
    fun toGameResultTo(gameResult: GameResult): GameResultTo =
        GameResultTo(
            isValidThrow = gameResult.isValidThrow,
            scoreChange = gameResult.scoreChange,
            remainingScore = gameResult.remainingScore,
            isLegWon = gameResult.isLegWon,
            isSetWon = gameResult.isSetWon,
            isGameWon = gameResult.isGameWon,
            winner = gameResult.winner?.id,
            nextPlayer = gameResult.nextPlayer?.id,
            message = gameResult.message,
            bust = gameResult.bust,
        )

    fun toGameStateTo(gameState: GameState): GameStateTo =
        GameStateTo(
            currentPlayer = gameState.currentPlayer.id!!,
            currentRemainingScores = convertPlayerMapToIdMap(gameState.currentRemainingScores),
            currentLegDarts = gameState.currentLegDarts,
            currentLeg = gameState.currentLeg,
            currentSet = gameState.currentSet,
            legsWon = convertPlayerMapToIdMap(gameState.legsWon),
            setsWon = convertPlayerMapToIdMap(gameState.setsWon),
            dartsThrown = gameState.dartsThrown,
            turnsPlayed = gameState.turnsPlayed,
        )

    private fun convertPlayerMapToIdMap(playerMap: Map<Player, Int>): Map<String, Int> =
        playerMap.mapKeys { (player, _) ->
            player.id ?: throw IllegalArgumentException("Player ID cannot be null")
        }
}

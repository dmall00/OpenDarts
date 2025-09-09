package io.github.dmall.opendarts.game.mapper

import io.github.dmall.opendarts.game.model.*
import org.springframework.stereotype.Component

@Component
class GameMapper {

    fun toCurrentGameStateTO(currentGameState: CurrentGameState): CurrentGameStateTO {
        return CurrentGameStateTO(
            currentTurnDarts = mapCurrentTurnDartsToPlayerTO(currentGameState.currentTurnDarts),
            currentRemainingScores = mapPlayerScoresToPlayerTO(currentGameState.currentRemainingScores),
            currentPlayer = playerToPlayerTO(currentGameState.currentPlayer)!!,
            legWon = currentGameState.legWon,
            setWon = currentGameState.setWon,
            gameWon = currentGameState.gameWon,
            winner = playerToPlayerTO(currentGameState.winner),
            nextPlayer = playerToPlayerTO(currentGameState.nextPlayer),
            message = currentGameState.message,
            bust = currentGameState.bust
        )
    }

    fun dartToDartResponse(darts: List<Dart>): List<DartResponse> =
        darts.mapNotNull { dart ->
            dart.id?.let { id ->
                DartResponse(
                    id = id,
                    multiplier = dart.multiplier,
                    score = dart.score,
                    computedScore = dart.computedScore,
                    scoreString = dart.scoreString
                )
            }
        }

    fun playerToPlayerTO(player: Player?): PlayerTO? =
        player?.let { PlayerTO(id = it.id!!, name = it.name) }

    fun mapCurrentTurnDartsToPlayerTO(currentTurnDarts: Map<Player, List<Dart>>): Map<String, List<DartResponse>> =
        currentTurnDarts.mapKeys { (player, _) -> playerToPlayerTO(player)!!.id }
            .mapValues { (_, darts) -> dartToDartResponse(darts) }

    fun mapPlayerScoresToPlayerTO(playerMap: Map<Player, Int>): Map<String, Int> =
        playerMap.mapKeys { (player, _) -> playerToPlayerTO(player)!!.id }
}

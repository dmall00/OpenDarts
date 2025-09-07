package io.github.dmall.opendarts.game.mapper

import io.github.dmall.opendarts.game.model.*
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.Named

@Mapper(componentModel = "spring")
interface GameMapper {
    @Mapping(source = "winner.id", target = "winner")
    @Mapping(source = "nextPlayer.id", target = "nextPlayer")
    @Mapping(source = "currentPlayer.id", target = "currentPlayer")
    @Mapping(source = "currentTurnDarts", target = "currentTurnDarts", qualifiedByName = ["dartListToDartResponseList"])
    fun toCurrentGameStateTO(currentGameState: CurrentGameState): CurrentGameStateTO

    @Mapping(source = "currentPlayer.id", target = "currentPlayer")
    @Mapping(
        source = "currentRemainingScores",
        target = "currentRemainingScores",
        qualifiedByName = ["playerMapToIdMap"],
    )
    @Mapping(source = "legsWon", target = "legsWon", qualifiedByName = ["playerMapToIdMap"])
    @Mapping(source = "setsWon", target = "setsWon", qualifiedByName = ["playerMapToIdMap"])
    fun toGameStateTo(gameState: GameState): GameStateTo

    @Named("playerMapToIdMap")
    fun playerMapToIdMap(playerMap: Map<Player, Int>): Map<String, Int> =
        playerMap.mapKeys { (player, _) ->
            player.id ?: throw IllegalArgumentException("Player ID cannot be null")
        }

    fun playerIdToString(player: Player): String = player.id ?: throw IllegalArgumentException("Player ID cannot be null")

    @Named("dartListToDartResponseList")
    fun dartListToDartResponseList(darts: List<Dart>): List<DartResponse> =
        darts.map { dart ->
            DartResponse(
                id = dart.id ?: 0L,
                multiplier = dart.multiplier,
                score = dart.score,
                computedScore = dart.score * dart.multiplier,
                scoreString = when (dart.multiplier) {
                    0 -> "MISS"
                    1 -> dart.score.toString()
                    2 -> "D${dart.score}"
                    3 -> "T${dart.score}"
                    else -> "${dart.multiplier}x${dart.score}"
                }
            )
        }

    fun toDartThrow(dart: Dart): DartThrowRequest
}

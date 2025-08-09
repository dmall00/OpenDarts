package io.github.dmall.opendarts.game.mapper

import io.github.dmall.opendarts.game.model.*
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.Named

@Mapper(componentModel = "spring")
interface GameMapper {
    @Mapping(source = "winner.id", target = "winner")
    @Mapping(source = "nextPlayer.id", target = "nextPlayer")
    fun toGameResultTo(gameResult: GameResult): GameResultTo

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
}

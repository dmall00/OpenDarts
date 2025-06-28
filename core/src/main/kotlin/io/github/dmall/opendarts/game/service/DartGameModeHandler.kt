package io.github.dmall.opendarts.game.service

import io.github.dmall.opendarts.game.model.DartThrow
import io.github.dmall.opendarts.game.model.GameMode
import io.github.dmall.opendarts.game.model.GameSession
import io.github.dmall.opendarts.game.model.Player

/**
 * Defines any dart game mode
 */
interface DartGameModeHandler {

    fun processDartThrow(gameSession: GameSession, currentPlayer: Player, dartThrow: DartThrow)

    fun getGameMode(): GameMode
}
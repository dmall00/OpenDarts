package io.github.dmall.opendarts.game.service

import io.github.dmall.opendarts.game.model.*

/** Defines any dart game mode with enhanced functionality */
interface DartGameModeHandler {
    /** Process a dart throw and return the result */
    fun processDartThrow(
        gameSession: GameSession,
        currentPlayer: Player,
        dartThrow: DartThrow,
    ): CurrentGameState

    /** Get the current game state */
    fun getGameState(gameSession: GameSession): GameState

    /** Initialize a new game session with specific configuration */
    fun initializeGame(gameSession: GameSession)

    /** Get game mode */
    fun getGameMode(): GameMode
}

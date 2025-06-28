package io.github.dmall.opendarts.game.service

import io.github.dmall.opendarts.game.model.*

/**
 * Defines any dart game mode with enhanced functionality
 */
interface DartGameModeHandler {

    /**
     * Process a dart throw and return the result
     */
    fun processDartThrow(gameSession: GameSession, currentPlayer: Player, dartThrow: DartThrow): GameResult

    /**
     * Get the current game state
     */
    fun getGameState(gameSession: GameSession): GameState

    /**
     * Initialize a new game session with specific configuration
     */
    fun initializeGame(gameSession: GameSession)

    /**
     * Check if a throw is valid according to game rules
     */
    fun isValidThrow(gameSession: GameSession, currentPlayer: Player, dartThrow: DartThrow): Boolean

    /**
     * Calculate possible checkouts for current player (mainly for X01)
     */
    fun getPossibleCheckouts(gameSession: GameSession, player: Player): List<String> = emptyList()

    /**
     * Get game mode
     */
    fun getGameMode(): GameMode

    /**
     * Get suggested next dart for auto-scoring assistance
     */
    fun getSuggestedNextDart(gameSession: GameSession, player: Player): DartThrow? = null
}
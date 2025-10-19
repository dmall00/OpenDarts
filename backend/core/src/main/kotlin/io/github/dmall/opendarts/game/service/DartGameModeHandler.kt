package io.github.dmall.opendarts.game.service

import io.github.dmall.opendarts.game.model.*

/**
 * Common interface for defining common operations across different dart game modes e.g. X01,
 * Cricket.
 */
interface DartGameModeHandler {

  /**
   * Processes a dart throw for the current player in the given game session
   *
   * @param gameSession The current game session
   * @param currentPlayer The player who is throwing the dart
   * @param dartThrowRequest The dart that is to be thrown / registered
   */
  fun processDartThrow(
    gameSession: GameSession,
    currentPlayer: Player,
    dartThrowRequest: DartThrowRequest,
  ): CurrentGameState

    /**
     * Commits the turn for the current player in the given game session
     * @param gameSession The current game session
     * @param currentPlayer The player whose turn is being committed
     * @param turnDarts The list of dart throws made in the turn
     */
    fun commitTurn(
    gameSession: GameSession,
    currentPlayer: Player,
    turnDarts: List<DartThrowRequest>
    ) : CurrentGameState

  /**
   * Retrieves the current game state for the given game session
   *
   * @param gameSession The current game session
   * @return The current state of the game
   */
  fun getCurrentGameState(gameSession: GameSession): CurrentGameState

  /**
   * Initialize the game with the specified game session that contains game configuration and
   * players
   *
   * @param gameSession The game session to initialize
   */
  fun initializeGame(gameSession: GameSession)

  /**
   * Returns the game mode handled by this handler
   *
   * @return The game mode enum
   */
  fun getGameMode(): GameMode

  /**
   * Reverts the last dart throw for the current player in the given game session
   *
   * @param gameSession The current game session
   * @param currentPlayer The player who is reverting the dart throw
   * @param dartRevertRequest The request containing information about which dart to revert
   */
  fun revertDartThrow(
    gameSession: GameSession,
    currentPlayer: Player,
    dartRevertRequest: DartRevertRequest,
  ): CurrentGameState

  /**
   * Corrects a dart throw for the current player in the given game session
   *
   * @param gameSession The current game session
   * @param currentPlayer The player who is correcting the dart throw
   * @param dartCorrectionRequest The request containing information about the dart correction
   */
  fun correctDartThrow(
    gameSession: GameSession,
    currentPlayer: Player,
    dartCorrectionRequest: DartCorrectionRequest,
  ): CurrentGameState
}

package io.github.dmall.opendarts.game.service

import io.github.dmall.opendarts.game.model.*

interface DartGameModeHandler {
  fun processDartThrow(
    gameSession: GameSession,
    currentPlayer: Player,
    dartThrowRequest: DartThrowRequest,
  ): CurrentGameState

  fun getCurrentGameState(gameSession: GameSession): CurrentGameState

  fun initializeGame(gameSession: GameSession)

  fun getGameMode(): GameMode

  fun revertDartThrow(
    gameSession: GameSession,
    currentPlayer: Player,
    dartRevertRequest: DartRevertRequest,
  ): CurrentGameState

  fun correctDartThrow(
    gameSession: GameSession,
    currentPlayer: Player,
    dartCorrectionRequest: DartCorrectionRequest,
    dartThrowRequest: DartThrowRequest,
  ): CurrentGameState
}

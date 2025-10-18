package io.github.dmall.opendarts.game.service

import io.github.dmall.opendarts.game.autoscore.events.*
import io.github.dmall.opendarts.game.autoscore.websocket.AppWebSocketHandler
import io.github.dmall.opendarts.game.mapper.GameMapper
import io.github.dmall.opendarts.game.model.*
import io.github.dmall.opendarts.game.repository.GameSessionRepository
import io.github.dmall.opendarts.game.repository.PlayerRepository
import io.github.oshai.kotlinlogging.KotlinLogging
import jakarta.transaction.Transactional
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.ApplicationEventPublisher
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Service

/** Main entry point to route dart throws to the current game */
@Service
class GameOrchestrator
@Autowired
constructor(
  private val gameSessionRepository: GameSessionRepository,
  private val playerRepository: PlayerRepository,
  private val gameModeRegistry: GameModeRegistry,
  private val appWebSocketHandler: AppWebSocketHandler,
  private val gameMapper: GameMapper,
  private val applicationEventPublisher: ApplicationEventPublisher,
) {

  private val logger = KotlinLogging.logger {}

  @Transactional
  fun submitDartThrow(
    gameSessionId: String,
    playerId: String,
    dartThrowRequest: DartThrowRequest,
  ): CurrentGameState {
    val gameSession = gameSessionRepository.findById(gameSessionId).orElseThrow()
    val currentPlayer = playerRepository.findById(playerId).orElseThrow()
    val gameHandler = gameModeRegistry.getGameHandler(gameSession.game.gameMode)
    val gameState = gameHandler.processDartThrow(gameSession, currentPlayer, dartThrowRequest)

    if (dartThrowRequest.autoScore) {
      appWebSocketHandler.sendWebSocketMessage(
        gameMapper.toCurrentGameStateTO(gameState),
        "$playerId-$gameSessionId",
        EventType.DART_THROW_DETECTED,
      )
    }

    if (!dartThrowRequest.autoScore) {
      val adjustment =
        if (gameState.bust) {
          ManualDartAdjustment(
            this,
            gameSessionId,
            playerId,
            AdjustmentType.THROW,
            DartThrowRequest(0, 0, false),
            null,
            null,
            gameState.getLastDartId(playerId)!!,
            true,
          )
        } else {
          ManualDartAdjustment(
            this,
            gameSessionId,
            playerId,
            AdjustmentType.THROW,
            dartThrowRequest,
            null,
            null,
            gameState.getLastDartId(playerId)!!,
          )
        }
      applicationEventPublisher.publishEvent(adjustment)
    }

    return gameState
  }

  @Transactional
  fun revertDartThrow(
    gameId: String,
    playerId: String,
    dartRevertRequest: DartRevertRequest,
  ): CurrentGameState {
    val gameSession = gameSessionRepository.findById(gameId).orElseThrow()
    val currentPlayer = playerRepository.findById(playerId).orElseThrow()
    val gameHandler = gameModeRegistry.getGameHandler(gameSession.game.gameMode)
    val gameState = gameHandler.revertDartThrow(gameSession, currentPlayer, dartRevertRequest)
    applicationEventPublisher.publishEvent(
      ManualDartAdjustment(
        this,
        gameId,
        playerId,
        AdjustmentType.REVERT,
        null,
        dartRevertRequest,
        null,
        gameState.getLastDartId(playerId)!!,
      )
    )

    return gameState
  }

  @Transactional
  fun correctDartThrow(
    gameId: String,
    playerId: String,
    dartCorrectionRequest: DartCorrectionRequest,
  ): CurrentGameState {
    val gameSession = gameSessionRepository.findById(gameId).orElseThrow()
    val currentPlayer = playerRepository.findById(playerId).orElseThrow()
    val gameHandler = gameModeRegistry.getGameHandler(gameSession.game.gameMode)

    val dartThrowRequest =
      DartThrowRequest(dartCorrectionRequest.multiplier, dartCorrectionRequest.score, false)

    val gameState = gameHandler.correctDartThrow(gameSession, currentPlayer, dartCorrectionRequest)

    applicationEventPublisher.publishEvent(
      ManualDartAdjustment(
        this,
        gameId,
        playerId,
        AdjustmentType.CORRECT,
        dartThrowRequest,
        null,
        dartCorrectionRequest,
        gameState.getLastDartId(playerId)!!,
      )
    )

    return gameState
  }

  fun getGameState(gameId: String): CurrentGameState {
    val gameSession = gameSessionRepository.findById(gameId).orElseThrow()
    val gameHandler = gameModeRegistry.getGameHandler(gameSession.game.gameMode)
    return gameHandler.getCurrentGameState(gameSession)
  }

  @EventListener
  @Transactional
  fun handleTurnSwitchDetectedEvent(event: TurnSwitchDetectedEvent) {
    val gameState = getGameState(event.sessionId)
    appWebSocketHandler.sendWebSocketMessage(
      gameMapper.toCurrentGameStateTO(gameState),
      "${event.playerId}-${event.sessionId}",
      event.type,
    )
  }

  @EventListener
  fun handleCalibrationEvent(event: CalibrationEvent) {
    appWebSocketHandler.sendWebSocketMessage(
      AppCalibrationResponse(event.calibrated),
      "${event.playerId}-${event.sessionId}",
      event.type,
    )
  }
}

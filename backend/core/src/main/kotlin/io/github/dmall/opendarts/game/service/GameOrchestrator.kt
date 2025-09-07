package io.github.dmall.opendarts.game.service

import io.github.dmall.opendarts.game.autoscore.events.CalibrationEvent
import io.github.dmall.opendarts.game.autoscore.events.DartThrowDetectedEvent
import io.github.dmall.opendarts.game.autoscore.events.EventType
import io.github.dmall.opendarts.game.autoscore.events.TurnSwitchDetectedEvent
import io.github.dmall.opendarts.game.autoscore.websocket.AppWebSocketHandler
import io.github.dmall.opendarts.game.mapper.GameMapper
import io.github.dmall.opendarts.game.model.AppCalibrationResponse
import io.github.dmall.opendarts.game.model.CurrentGameState
import io.github.dmall.opendarts.game.model.DartRevertRequest
import io.github.dmall.opendarts.game.model.DartThrowRequest
import io.github.dmall.opendarts.game.model.GameState
import io.github.dmall.opendarts.game.repository.GameSessionRepository
import io.github.dmall.opendarts.game.repository.PlayerRepository
import jakarta.transaction.Transactional
import org.springframework.beans.factory.annotation.Autowired
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
) {
    @Transactional
    fun submitDartThrow(
        gameId: String,
        playerId: String,
        dartThrowRequest: DartThrowRequest,
    ): CurrentGameState {
        val gameSession = gameSessionRepository.findById(gameId).orElseThrow()
        val currentPlayer = playerRepository.findById(playerId).orElseThrow()
        val gameHandler = gameModeRegistry.getGameHandler(gameSession.game.gameMode)
        val gameState = gameHandler.processDartThrow(gameSession, currentPlayer, dartThrowRequest)
        if (dartThrowRequest.autoScore) {
            appWebSocketHandler.sendWebSocketMessage(
                gameMapper.toCurrentGameStateTO(gameState),
                "$playerId-$gameId",
                EventType.DART_THROW_DETECTED,
            )
        }
        return gameState
    }

    @Transactional
    fun revertDartThrow(
        gameId: String,
        playerId: String,
        dartRevertRequest: DartRevertRequest
    ) {
        val gameSession = gameSessionRepository.findById(gameId).orElseThrow()
        val currentPlayer = playerRepository.findById(playerId).orElseThrow()
        val gameHandler = gameModeRegistry.getGameHandler(gameSession.game.gameMode)
        return gameHandler.revertDartThrow(gameSession, currentPlayer, dartRevertRequest)
    }

    fun getGameState(gameId: String): GameState {
        val gameSession = gameSessionRepository.findById(gameId).orElseThrow()
        val gameHandler = gameModeRegistry.getGameHandler(gameSession.game.gameMode)
        return gameHandler.getGameState(gameSession)
    }

    @EventListener
    @Transactional
    fun handleDartThrowDetectedEvent(event: DartThrowDetectedEvent) {
        submitDartThrow(event.sessionId, event.playerId, event.dartThrowRequest)
    }

    @EventListener
    @Transactional
    fun handleTurnSwitchDetectedEvent(event: TurnSwitchDetectedEvent) {
        val gameState = getGameState(event.sessionId)
        appWebSocketHandler.sendWebSocketMessage(
            gameMapper.toGameStateTo(gameState),
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

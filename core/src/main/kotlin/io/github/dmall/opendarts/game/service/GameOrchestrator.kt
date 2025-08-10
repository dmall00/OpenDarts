package io.github.dmall.opendarts.game.service

import io.github.dmall.opendarts.game.autoscore.events.DartThrowDetectedEvent
import io.github.dmall.opendarts.game.autoscore.events.TurnSwitchDetectedEvent
import io.github.dmall.opendarts.game.autoscore.websocket.AppWebSocketHandler
import io.github.dmall.opendarts.game.mapper.GameMapper
import io.github.dmall.opendarts.game.model.CurrentGameState
import io.github.dmall.opendarts.game.model.DartThrow
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
            sessionId: String,
            playerId: String,
            dartThrow: DartThrow,
        ): CurrentGameState {
            val gameSession = gameSessionRepository.findById(sessionId).orElseThrow()
            val currentPlayer = playerRepository.findById(playerId).orElseThrow()
            val gameHandler = gameModeRegistry.getGameHandler(gameSession.game.gameMode)
            val gameState = gameHandler.processDartThrow(gameSession, currentPlayer, dartThrow)
            if (dartThrow.autoScore) {
                appWebSocketHandler.sendWebSocketMessage(
                    gameMapper.toCurrentGameStateTO(gameState),
                    "$playerId-$sessionId",
                )
            }
            return gameState
        }

        fun getGameState(gameId: String): GameState {
            val gameSession = gameSessionRepository.findById(gameId).orElseThrow()
            val gameHandler = gameModeRegistry.getGameHandler(gameSession.game.gameMode)
            return gameHandler.getGameState(gameSession)
        }

        @EventListener
        @Transactional
        fun handleDartThrowDetectedEvent(event: DartThrowDetectedEvent) {
            submitDartThrow(event.sessionId, event.playerId, event.dartThrow)
        }

        @EventListener
        @Transactional
        fun handleTurnSwitchDetectedEvent(event: TurnSwitchDetectedEvent) {
            val gameState = getGameState(event.sessionId)
            appWebSocketHandler.sendWebSocketMessage(
                gameMapper.toGameStateTo(gameState),
                "${event.playerId}-${event.sessionId}",
        )
    }
    }

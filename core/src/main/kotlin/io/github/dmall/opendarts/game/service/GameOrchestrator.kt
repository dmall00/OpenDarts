package io.github.dmall.opendarts.game.service

import io.github.dmall.opendarts.game.autoscore.websocket.AppWebSocketHandler
import io.github.dmall.opendarts.game.events.DartThrowDetectedEvent
import io.github.dmall.opendarts.game.model.DartThrow
import io.github.dmall.opendarts.game.model.DartTrackedTo
import io.github.dmall.opendarts.game.model.GameResult
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
    ) {
        @Transactional
        fun submitDartThrow(
            sessionId: String,
            playerId: String,
            dartThrow: DartThrow,
        ): GameResult {
            val gameSession = gameSessionRepository.findById(sessionId).orElseThrow()
            val currentPlayer = playerRepository.findById(playerId).orElseThrow()
            val gameHandler = gameModeRegistry.getGameHandler(gameSession.game.gameMode)
            val gameResult = gameHandler.processDartThrow(gameSession, currentPlayer, dartThrow)
            if (dartThrow.isAutoScore) {
                appWebSocketHandler.sendDartDetected(
                    DartTrackedTo(playerId, gameResult.remainingScore!!, dartThrow),
                    "$playerId-$sessionId",
                )
            }
            return gameResult
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
    }

package io.github.dmall.opendarts.game.autoscore.websocket

import io.github.dmall.opendarts.game.autoscore.service.AutoScoreService
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.stereotype.Component
import org.springframework.web.socket.BinaryMessage
import org.springframework.web.socket.CloseStatus
import org.springframework.web.socket.WebSocketSession
import org.springframework.web.socket.handler.BinaryWebSocketHandler
import java.util.concurrent.ConcurrentHashMap

@Component
class AppWebSocketHandler(
    private val autoScoreService: AutoScoreService
) : BinaryWebSocketHandler() {
    private val sessions: MutableSet<WebSocketSession?> = ConcurrentHashMap.newKeySet<WebSocketSession?>()

    private val logger = KotlinLogging.logger {}

    override fun afterConnectionEstablished(session: WebSocketSession) {
        logger.info { "App connection established" }
        sessions.add(session)
    }

    override fun handleBinaryMessage(session: WebSocketSession, message: BinaryMessage) {
        val sizeInBytes = message.payload.remaining()
        val sizeInMB = sizeInBytes / (1024.0 * 1024.0)
        logger.info { "Received message from app with size in MB: ${String.format("%.2f", sizeInMB)}" }

        try {
            val imageBytes = message.payload.array()
            autoScoreService.sendPipelineDetectionRequest(imageBytes)
        } catch (e: Exception) {
            logger.error(e) { "Failed to process binary message from app" }
        }
    }

    override fun afterConnectionClosed(session: WebSocketSession, status: CloseStatus) {
        logger.info { "App connection closed $status" }
        sessions.remove(session)
    }
}

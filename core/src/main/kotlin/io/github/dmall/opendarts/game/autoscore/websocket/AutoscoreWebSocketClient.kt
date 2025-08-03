package io.github.dmall.opendarts.game.autoscore.websocket

import com.fasterxml.jackson.databind.ObjectMapper
import io.github.dmall.opendarts.common.config.SnakeCase
import io.github.dmall.opendarts.game.autoscore.model.AutoScoreProperties
import io.github.dmall.opendarts.game.autoscore.service.AutoScoreStabilizer
import io.github.oshai.kotlinlogging.KotlinLogging
import jakarta.annotation.PostConstruct
import jakarta.annotation.PreDestroy
import org.springframework.stereotype.Component
import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketSession
import org.springframework.web.socket.client.standard.StandardWebSocketClient
import java.util.concurrent.atomic.AtomicReference

@Component
class AutoscoreWebSocketClient(
    private val autoScoreProperties: AutoScoreProperties,
    @SnakeCase private val objectMapper: ObjectMapper,
    private val autoScoreStabilizer: AutoScoreStabilizer,
) {
    private val pythonSession: AtomicReference<WebSocketSession?> =
        AtomicReference<WebSocketSession?>()
    private val logger = KotlinLogging.logger {}

    @PostConstruct
    fun initialize() {
        logger.info { "Initializing Autoscoring WebSocketClient" }
        connect()
    }

    @PreDestroy
    fun cleanup() {
        logger.info { "Cleaning up Autoscoring WebSocketClient" }
        disconnect()
    }

    private fun connect() {
        try {
            val client = StandardWebSocketClient()
            val handler = AutoscoreWebSocketReceiver(this, objectMapper, autoScoreStabilizer)
            client.execute(handler, "ws://${autoScoreProperties.host}:${autoScoreProperties.port}")
            logger.info {
                "Connecting to autoscoring server at ws://${autoScoreProperties.host}:${autoScoreProperties.port}"
            }
        } catch (e: Exception) {
            logger.error(e) { "Failed to connect to autoscoring server" }
        }
    }

    private fun disconnect() {
        pythonSession.get()?.let { session ->
            try {
                if (session.isOpen) {
                    session.close()
                }
            } catch (e: Exception) {
                logger.error(e) { "Error closing websocket session" }
            }
        }
        pythonSession.set(null)
    }

    internal fun setSession(session: WebSocketSession) {
        pythonSession.set(session)
    }

    internal fun clearSession() {
        pythonSession.set(null)
    }

    fun autoscoreImage(jsonData: ByteArray) {
        val session = pythonSession.get()
        if (session != null && session.isOpen) {
            try {
                val jsonString = String(jsonData, Charsets.UTF_8)
                val message = TextMessage(jsonString)
                session.sendMessage(message)
                logger.debug { "Sent JSON message to Python server, size: ${jsonData.size} bytes" }
            } catch (e: Exception) {
                logger.error(e) { "Failed to send JSON message to autoscore server: ${e.message}" }
            }
        } else {
            logger.warn {
                "Could not send JSON message to autoscore server - session not available"
            }
        }
    }
}

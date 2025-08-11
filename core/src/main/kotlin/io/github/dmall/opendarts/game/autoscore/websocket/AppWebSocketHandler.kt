package io.github.dmall.opendarts.game.autoscore.websocket

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.node.ObjectNode
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import io.github.dmall.opendarts.game.autoscore.events.EventType
import io.github.dmall.opendarts.game.autoscore.service.AutoscoreImageTransmitter
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.stereotype.Component
import org.springframework.web.socket.BinaryMessage
import org.springframework.web.socket.CloseStatus
import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketSession
import org.springframework.web.socket.handler.BinaryWebSocketHandler
import java.util.concurrent.ConcurrentHashMap

@Component
class AppWebSocketHandler(
    private val autoscoreImageTransmitter: AutoscoreImageTransmitter,
) : BinaryWebSocketHandler() {
    private val sessions: MutableMap<String, WebSocketSession> = ConcurrentHashMap<String, WebSocketSession>()

    private val logger = KotlinLogging.logger {}

    private val objectMapper: ObjectMapper = jacksonObjectMapper()

    private fun Pair<String, String>.joinWith(delimiter: String = "-"): String = "${first}${delimiter}$second"

    override fun afterConnectionEstablished(session: WebSocketSession) {
        val sessionId = extractIdsFromSession(session).joinWith()
        logger.info { "App connection established with session ID: $sessionId" }
        sessions[sessionId] = session
        logger.info { "Active sessions count: ${sessions.size}" }
    }

    override fun handleBinaryMessage(
        session: WebSocketSession,
        message: BinaryMessage,
    ) {
        val sizeInBytes = message.payload.remaining()
        val sizeInMB = sizeInBytes / (1024.0 * 1024.0)
        logger.debug {
            "Received message from app with size in MB: ${String.format("%.2f", sizeInMB)}"
        }

        try {
            val (playerId, gameSessionId) = extractIdsFromSession(session)
            val imageBytes = message.payload.array()
            autoscoreImageTransmitter.sendPipelineDetectionRequest(
                imageBytes,
                gameSessionId,
                playerId,
            )
        } catch (e: Exception) {
            logger.error(e) { "Failed to process binary message from app" }
        }
    }

    private fun extractIdsFromSession(session: WebSocketSession): Pair<String, String> {
        val uri = session.uri.toString()
        val path = uri.substringAfterLast("ws/", "")
        val segments = path.split("/").filter { it.isNotEmpty() }
        val gameSessionId = segments.last()
        val playerId = segments[segments.size - 2]
        return playerId to gameSessionId
    }

    override fun afterConnectionClosed(
        session: WebSocketSession,
        status: CloseStatus,
    ) {
        logger.info { "App connection closed $status" }
        sessions.remove(extractIdsFromSession(session).joinWith())
    }

    fun sendWebSocketMessage(
        eventObject: Any,
        id: String,
        type: EventType,
    ) {
        val session = sessions[id] ?: throw IllegalStateException("No session found for id")
        if (session.isOpen) {
            try {
                val jsonNode = objectMapper.valueToTree<ObjectNode>(eventObject)
                jsonNode.put("type", type.type)
                val json = objectMapper.writeValueAsString(jsonNode)
                session.sendMessage(TextMessage(json))
                logger.info { "Successfully sent $type websocket event message $json" }
            } catch (e: Exception) {
                logger.error(e) { "Error sending object as text message" }
            }
        } else {
            logger.warn { "Session $id is not open, cannot send event message" }
        }
    }
}

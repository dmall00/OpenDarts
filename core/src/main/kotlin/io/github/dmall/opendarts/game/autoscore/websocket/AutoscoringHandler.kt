package io.github.dmall.opendarts.game.autoscore.websocket

import com.fasterxml.jackson.databind.ObjectMapper
import io.github.dmall.opendarts.game.autoscore.model.PipelineDetectionResponse
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.web.socket.CloseStatus
import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketSession
import org.springframework.web.socket.handler.TextWebSocketHandler

class AutoscoringHandler(
    private val autoScoreSocketClient: AutoScoreSocketClient,
    private val objectMapper: ObjectMapper
) : TextWebSocketHandler() {

    val logger = KotlinLogging.logger {}

    override fun afterConnectionEstablished(session: WebSocketSession) {
        autoScoreSocketClient.setSession(session)
        logger.info { "Websocket connection to python server established" }
    }

    public override fun handleTextMessage(session: WebSocketSession, message: TextMessage) {
        val result: PipelineDetectionResponse =
            objectMapper.readValue(message.payload, PipelineDetectionResponse::class.java)
        logger.info { "Websocket message received ${result.status}" }
    }

    override fun afterConnectionClosed(session: WebSocketSession, status: CloseStatus) {
        autoScoreSocketClient.clearSession()
        logger.warn { "Websocket connection to python server closed with status: ${status.code} - ${status.reason}" }
    }

    override fun handleTransportError(session: WebSocketSession, exception: Throwable) {
        logger.error(exception) { "Transport error in websocket connection to python server" }
    }
}
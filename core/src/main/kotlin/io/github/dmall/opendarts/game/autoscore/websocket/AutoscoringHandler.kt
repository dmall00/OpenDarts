package io.github.dmall.opendarts.game.autoscore.websocket

import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.web.socket.CloseStatus
import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketSession
import org.springframework.web.socket.handler.TextWebSocketHandler

class AutoscoringHandler : TextWebSocketHandler() {

    val logger = KotlinLogging.logger {}

    override fun afterConnectionEstablished(session: WebSocketSession) {
        AutoScoreSocketClient.instance.pythonSession.set(session)
        logger.info { "Websocket connection to python server established" }
    }

    public override fun handleTextMessage(session: WebSocketSession, message: TextMessage) {
        logger.info { "Websocket message received ${message.payload}" }
    }

    override fun afterConnectionClosed(session: WebSocketSession, status: CloseStatus) {
        logger.warn { "Websocket connection to python server closed with status: ${status.code} - ${status.reason}" }
    }

    override fun handleTransportError(session: WebSocketSession, exception: Throwable) {
        logger.error(exception) { "Transport error in websocket connection to python server" }
    }
}
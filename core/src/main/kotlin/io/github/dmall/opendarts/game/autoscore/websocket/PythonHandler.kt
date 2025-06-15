package io.github.dmall.opendarts.game.autoscore.websocket

import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketSession
import org.springframework.web.socket.handler.TextWebSocketHandler

class PythonHandler : TextWebSocketHandler() {

    val logger = KotlinLogging.logger {}

    override fun afterConnectionEstablished(session: WebSocketSession) {
        AutoScoreSocketClient.instance.pythonSession.set(session)
        logger.info { "Websocket connection to python server established" }
    }

    public override fun handleTextMessage(session: WebSocketSession, message: TextMessage) {
        logger.info { "Websocket message received " + message.payload }
    }
}
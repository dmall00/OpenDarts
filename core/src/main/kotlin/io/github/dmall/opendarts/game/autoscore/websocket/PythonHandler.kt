package io.github.dmall.opendarts.game.autoscore.websocket

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketSession
import org.springframework.web.socket.handler.TextWebSocketHandler

class PythonHandler : TextWebSocketHandler() {

    companion object {
        private val LOGGER: Logger = LoggerFactory.getLogger(PythonHandler::class.java)
    }

    override fun afterConnectionEstablished(session: WebSocketSession) {
        PythonWebSocketClient.instance.pythonSession.set(session)
        LOGGER.info("Websocket connection to python server established")
    }

    public override fun handleTextMessage(session: WebSocketSession, message: TextMessage) {
        LOGGER.info("Websocket message received " + message.payload)
    }


}
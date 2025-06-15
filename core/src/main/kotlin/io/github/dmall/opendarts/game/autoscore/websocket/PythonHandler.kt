package io.github.dmall.opendarts.game.autoscore.websocket

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.web.socket.BinaryMessage
import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketSession
import org.springframework.web.socket.handler.BinaryWebSocketHandler

class PythonHandler : BinaryWebSocketHandler() {

    companion object {
        private val LOGGER: Logger = LoggerFactory.getLogger(PythonHandler::class.java)
    }

    override fun afterConnectionEstablished(session: WebSocketSession) {
        PythonWebSocketClient.instance.pythonSession.set(session)
        LOGGER.info("Websocket connection to python server established")
    }

    override fun handleBinaryMessage(session: WebSocketSession, message: BinaryMessage) {
        val data = message.payload.array()
        LOGGER.info("Binary message received from Python server - Size: ${data.size} bytes")
        // Log first few bytes as hex for debugging
        val preview = data.take(20).joinToString(" ") { "%02x".format(it) }
        LOGGER.info("First 20 bytes (hex): $preview")
    }

    override fun handleTextMessage(session: WebSocketSession, message: TextMessage) {
        LOGGER.info("Text message received from Python server: ${message.payload}")
    }

}
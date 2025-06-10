package io.github.dmall.opendarts.game.autoscore.websocket

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.PropertyNamingStrategies
import org.slf4j.LoggerFactory
import org.springframework.web.socket.CloseStatus
import org.springframework.web.socket.WebSocketHandler
import org.springframework.web.socket.WebSocketMessage
import org.springframework.web.socket.WebSocketSession

class AutoScoreWebSocketClient : WebSocketHandler {


    private val logger = LoggerFactory.getLogger(AutoScoreWebSocketClient::class.java)

    private val objectMapper = ObjectMapper().apply {
        propertyNamingStrategy = PropertyNamingStrategies.SNAKE_CASE
    }

    override fun afterConnectionEstablished(session: WebSocketSession) {
        TODO("Not yet implemented")
    }

    override fun handleMessage(
        session: WebSocketSession,
        message: WebSocketMessage<*>
    ) {
        TODO("Not yet implemented")
    }

    override fun handleTransportError(
        session: WebSocketSession,
        exception: Throwable
    ) {
        TODO("Not yet implemented")
    }

    override fun afterConnectionClosed(
        session: WebSocketSession,
        closeStatus: CloseStatus
    ) {
        TODO("Not yet implemented")
    }

    override fun supportsPartialMessages(): Boolean {
        TODO("Not yet implemented")
    }

}
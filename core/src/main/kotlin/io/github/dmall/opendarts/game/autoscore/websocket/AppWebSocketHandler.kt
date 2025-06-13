package io.github.dmall.opendarts.game.autoscore.websocket

import org.springframework.web.socket.CloseStatus
import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketSession
import org.springframework.web.socket.handler.TextWebSocketHandler
import java.util.concurrent.ConcurrentHashMap

class AppWebSocketHandler : TextWebSocketHandler() {
    private val sessions: MutableSet<WebSocketSession?> = ConcurrentHashMap.newKeySet<WebSocketSession?>()
    private val pythonClient: PythonWebSocketClient = PythonWebSocketClient.Companion.instance

    override fun afterConnectionEstablished(session: WebSocketSession) {
        sessions.add(session)
    }

    public override fun handleTextMessage(session: WebSocketSession, message: TextMessage) {
        pythonClient.sendToPython(message.payload)
    }

    override fun afterConnectionClosed(session: WebSocketSession, status: CloseStatus) {
        sessions.remove(session)
    }
}

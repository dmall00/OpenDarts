package io.github.dmall.opendarts.game.autoscore.websocket

import org.springframework.web.socket.*
import org.springframework.web.socket.handler.BinaryWebSocketHandler
import java.util.concurrent.ConcurrentHashMap

class AppWebSocketHandler : BinaryWebSocketHandler() {
    private val sessions: MutableSet<WebSocketSession?> = ConcurrentHashMap.newKeySet<WebSocketSession?>()
    private val pythonClient: PythonWebSocketClient = PythonWebSocketClient.Companion.instance

    override fun afterConnectionEstablished(session: WebSocketSession) {
        sessions.add(session)
    }

    override fun handleBinaryMessage(session: WebSocketSession, message: BinaryMessage) {
        pythonClient.sendToPython(message.payload.array())
    }

    override fun afterConnectionClosed(session: WebSocketSession, status: CloseStatus) {
        sessions.remove(session)
    }
}

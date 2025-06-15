package io.github.dmall.opendarts.game.autoscore.websocket

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.web.socket.BinaryMessage
import org.springframework.web.socket.WebSocketSession
import org.springframework.web.socket.client.standard.StandardWebSocketClient
import java.nio.ByteBuffer
import java.util.concurrent.atomic.AtomicReference

class PythonWebSocketClient private constructor() {
    val pythonSession: AtomicReference<WebSocketSession?> = AtomicReference<WebSocketSession?>()

    companion object {
        private val LOGGER: Logger = LoggerFactory.getLogger(PythonWebSocketClient::class.java)

        val instance: PythonWebSocketClient = PythonWebSocketClient()
    }

    init {
        LOGGER.info("Python WebSocketClient created")
        connect()
    }

    fun connect() {
        val client = StandardWebSocketClient()
        client.execute(PythonHandler(), "ws://192.168.178.34:8765")
    }

    fun sendToPython(data: ByteArray) {
        val session = pythonSession.get()
        if (session != null && session.isOpen) {
            try {
                val message = BinaryMessage(ByteBuffer.wrap(data))
                session.sendMessage(message)
            } catch (e: Exception) {
                LOGGER.error(e.message, e)
            }
        }
    }

}

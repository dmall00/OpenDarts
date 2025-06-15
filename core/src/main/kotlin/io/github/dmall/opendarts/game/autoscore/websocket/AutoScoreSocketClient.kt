package io.github.dmall.opendarts.game.autoscore.websocket

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.web.socket.BinaryMessage
import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketSession
import org.springframework.web.socket.client.standard.StandardWebSocketClient
import java.nio.ByteBuffer
import java.util.concurrent.atomic.AtomicReference

@Component
class AutoScoreSocketClient {
    val pythonSession: AtomicReference<WebSocketSession?> = AtomicReference<WebSocketSession?>()

    companion object {
        private val LOGGER: Logger = LoggerFactory.getLogger(AutoScoreSocketClient::class.java)

        @Volatile
        private var INSTANCE: AutoScoreSocketClient? = null

        val instance: AutoScoreSocketClient
            get() = INSTANCE ?: throw IllegalStateException("PythonWebSocketClient not initialized")
    }

    init {
        INSTANCE = this
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
        } else {
            LOGGER.warn("Autoscoring websocket server not available");
        }
    }

    fun autoscoreImage(jsonData: ByteArray) {
        val session = pythonSession.get()
        if (session != null && session.isOpen) {
            try {
                val jsonString = String(jsonData, Charsets.UTF_8)
                val message = TextMessage(jsonString)
                session.sendMessage(message)
                LOGGER.info("Sent JSON message to Python server, size: {} bytes", jsonData.size)
            } catch (e: Exception) {
                LOGGER.error("Failed to send JSON message to autoscore server", e)
            }
        } else {
            LOGGER.warn("Could not send JSON message to autoscore server - session not available")
        }
    }

}

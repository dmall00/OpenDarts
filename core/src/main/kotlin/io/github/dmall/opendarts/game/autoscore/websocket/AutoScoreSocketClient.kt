package io.github.dmall.opendarts.game.autoscore.websocket

import io.github.dmall.opendarts.game.autoscore.model.AutoScoreProperties
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Component
import org.springframework.web.socket.BinaryMessage
import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketSession
import org.springframework.web.socket.client.standard.StandardWebSocketClient
import java.nio.ByteBuffer
import java.util.concurrent.atomic.AtomicReference

@Component
class AutoScoreSocketClient @Autowired constructor(val autoScoreProperties: AutoScoreProperties) {
    val pythonSession: AtomicReference<WebSocketSession?> = AtomicReference<WebSocketSession?>()

    val logger = KotlinLogging.logger {}

    companion object {

        @Volatile
        private var INSTANCE: AutoScoreSocketClient? = null

        val instance: AutoScoreSocketClient
            get() = INSTANCE ?: throw IllegalStateException("PythonWebSocketClient not initialized")
    }

    init {
        INSTANCE = this
        logger.info { "Autoscoring WebSocketClient created" }
        connect()
    }

    fun connect() {
        val client = StandardWebSocketClient()
        client.execute(AutoscoringHandler(), "ws://${autoScoreProperties.host}:${autoScoreProperties.port}")
    }

    fun sendToPython(data: ByteArray) {
        val session = pythonSession.get()
        if (session != null && session.isOpen) {
            try {
                val message = BinaryMessage(ByteBuffer.wrap(data))
                session.sendMessage(message)
            } catch (e: Exception) {
                logger.error(e) { "${e.message}" }
            }
        } else {
            logger.warn("Autoscoring websocket server not available");
        }
    }

    fun autoscoreImage(jsonData: ByteArray) {
        val session = pythonSession.get()
        if (session != null && session.isOpen) {
            try {
                val jsonString = String(jsonData, Charsets.UTF_8)
                val message = TextMessage(jsonString)
                session.sendMessage(message)
                logger.info { "${"Sent JSON message to Python server, size: {} bytes"} ${jsonData.size}" }
            } catch (e: Exception) {
                logger.error(e) { "Failed to send JSON message to autoscore server" }
            }
        } else {
            logger.warn { "Could not send JSON message to autoscore server - session not available" }
        }
    }

}

package io.github.dmall.opendarts.game.autoscore.service

import com.fasterxml.jackson.databind.ObjectMapper
import io.github.dmall.opendarts.common.config.SnakeCase
import io.github.dmall.opendarts.game.autoscore.model.PipelineDetectionRequest
import io.github.dmall.opendarts.game.autoscore.websocket.AutoscoreWebSocketClient
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.stereotype.Service
import java.util.*

@Service
class AutoscoreImageTransmitter(
    private val autoScoreWebSocketClient: AutoscoreWebSocketClient,
    @SnakeCase private val objectMapper: ObjectMapper,
) {
    private val logger = KotlinLogging.logger {}

    fun sendPipelineDetectionRequest(
        imageBytes: ByteArray,
        gameId: String,
        playerId: String,
    ) {
        try {
            val base64Image = Base64.getEncoder().encodeToString(imageBytes)
            val request = PipelineDetectionRequest(gameId, base64Image)
            val jsonString = objectMapper.writeValueAsString(request)
            val jsonBytes = jsonString.toByteArray(Charsets.UTF_8)
            autoScoreWebSocketClient.autoscoreImage(jsonBytes)
            logger.debug {
                "Sent PipelineDetectionRequest with gameId: $gameId and $playerId size: ${imageBytes.size} bytes"
            }
        } catch (e: Exception) {
            logger.error(e) { "Failed to send PipelineDetectionRequest" }
        }
    }
}

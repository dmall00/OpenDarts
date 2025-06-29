package io.github.dmall.opendarts.game.autoscore.service

import com.fasterxml.jackson.databind.ObjectMapper
import io.github.dmall.opendarts.common.config.SnakeCase
import io.github.dmall.opendarts.game.autoscore.model.PipelineDetectionRequest
import io.github.dmall.opendarts.game.autoscore.websocket.AutoScoreSocketClient
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.stereotype.Service
import java.util.*

@Service
class AutoScoreService(
    private val autoScoreSocketClient: AutoScoreSocketClient,
    @SnakeCase private val objectMapper: ObjectMapper,
) {
    private val logger = KotlinLogging.logger {}

    fun sendPipelineDetectionRequest(
        imageBytes: ByteArray,
        gameId: String,
        requestId: String = UUID.randomUUID().toString(),
    ) {
        try {
            val base64Image = Base64.getEncoder().encodeToString(imageBytes)
            val request = PipelineDetectionRequest(gameId, base64Image)
            val jsonString = objectMapper.writeValueAsString(request)
            val jsonBytes = jsonString.toByteArray(Charsets.UTF_8)
            autoScoreSocketClient.autoscoreImage(jsonBytes)
            logger.info {
                "Sent PipelineDetectionRequest with ID: $requestId, gameId: $gameId and image size: ${imageBytes.size} bytes"
            }
        } catch (e: Exception) {
            logger.error(e) { "Failed to send PipelineDetectionRequest" }
        }
    }
}

package io.github.dmall.opendarts.game.autoscore.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.PropertyNamingStrategies
import io.github.dmall.opendarts.game.autoscore.model.PipelineDetectionRequest
import io.github.dmall.opendarts.game.autoscore.websocket.AutoScoreSocketClient
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.stereotype.Service
import java.util.*

@Service
class AutoScoreService(
    private val autoScoreSocketClient: AutoScoreSocketClient
) {

    private val logger = KotlinLogging.logger {}
    companion object {

        private val objectMapper = ObjectMapper().apply {
            propertyNamingStrategy = PropertyNamingStrategies.SNAKE_CASE
        }
    }

    fun sendPipelineDetectionRequest(imageBytes: ByteArray, requestId: String = UUID.randomUUID().toString()) {
        try {
            val base64Image = Base64.getEncoder().encodeToString(imageBytes)
            val request = PipelineDetectionRequest(requestId, base64Image)
            val jsonString = objectMapper.writeValueAsString(request)
            val jsonBytes = jsonString.toByteArray(Charsets.UTF_8)
            autoScoreSocketClient.autoscoreImage(jsonBytes)
            logger.info {
                "${"Sent PipelineDetectionRequest with ID: {} and image size: {} bytes"} $requestId ${
                imageBytes.size
                }"
            }
        } catch (e: Exception) {
            logger.error(e) { "Failed to send PipelineDetectionRequest" }
        }
    }
}

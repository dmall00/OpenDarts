package io.github.dmall.opendarts.game.autoscore.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.PropertyNamingStrategies
import io.github.dmall.opendarts.game.autoscore.model.PipelineDetectionRequest
import io.github.dmall.opendarts.game.autoscore.websocket.AutoScoreSocketClient
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.util.*

@Service
class AutoScoreService(
    private val autoScoreSocketClient: AutoScoreSocketClient
) {

    companion object {
        private val LOGGER: Logger = LoggerFactory.getLogger(AutoScoreService::class.java)
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
            LOGGER.info(
                "Sent PipelineDetectionRequest with ID: {} and image size: {} bytes",
                requestId,
                imageBytes.size
            )
        } catch (e: Exception) {
            LOGGER.error("Failed to send PipelineDetectionRequest", e)
        }
    }
}

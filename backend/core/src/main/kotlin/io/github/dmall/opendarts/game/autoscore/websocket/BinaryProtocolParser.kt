package io.github.dmall.opendarts.game.autoscore.websocket

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import io.github.dmall.opendarts.game.autoscore.model.AutoScoreMessage
import java.nio.ByteBuffer
import java.nio.ByteOrder

data class BinaryMessageWithMetadata(val autoScoreMessage: AutoScoreMessage, val imageData: ByteArray)

object BinaryProtocolParser {
  private val objectMapper: ObjectMapper = jacksonObjectMapper()

  fun parseBinaryMessage(data: ByteArray): BinaryMessageWithMetadata {
    val buffer = ByteBuffer.wrap(data).order(ByteOrder.BIG_ENDIAN)
    val metadataLength = buffer.getInt()

    val metadataBytes = ByteArray(metadataLength)
    buffer.get(metadataBytes)
    val metadataJson = String(metadataBytes, Charsets.UTF_8)
    val metadata = objectMapper.readValue(metadataJson, AutoScoreMessage::class.java)

    val imageDataLength = data.size - 4 - metadataLength
    val imageData = ByteArray(imageDataLength)
    buffer.get(imageData)

    return BinaryMessageWithMetadata(metadata, imageData)
  }

  fun hasMetadata(data: ByteArray): Boolean {
    if (data.size < 4) return false

    val buffer = ByteBuffer.wrap(data).order(ByteOrder.BIG_ENDIAN)
    val metadataLength = buffer.getInt()

    if (metadataLength <= 0 || metadataLength > data.size - 4) return false

    return try {
      val metadataBytes = ByteArray(metadataLength)
      buffer.get(metadataBytes)
      val metadataJson = String(metadataBytes, Charsets.UTF_8)
      objectMapper.readValue(metadataJson, AutoScoreMessage::class.java)
      true
    } catch (e: Exception) {
      false
    }
  }
}

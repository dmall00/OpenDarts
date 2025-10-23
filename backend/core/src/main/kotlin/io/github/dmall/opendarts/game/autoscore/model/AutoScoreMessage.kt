package io.github.dmall.opendarts.game.autoscore.model

data class AutoScoreMessage(
  val timestamp: Long,
    val playerId: String,
    val traceId: String
)

package io.github.dmall.opendarts.game.autoscore.model

abstract class BaseRequest(
    val requestType: RequestType,
    val sessionId: String,
    val playerId: String,
)

class PipelineDetectionRequest(
    sessionId: String,
    playerId: String,
    val image: String,
) : BaseRequest(RequestType.FULL, sessionId, playerId)

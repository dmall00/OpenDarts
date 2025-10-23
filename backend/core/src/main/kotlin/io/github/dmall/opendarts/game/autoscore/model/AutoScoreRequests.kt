package io.github.dmall.opendarts.game.autoscore.model

abstract class BaseRequest(
  val requestType: RequestType,
  val sessionId: String,
  val playerId: String,
  val traceId: String,
)

class PipelineDetectionRequest(sessionId: String, playerId: String, val image: String, traceId: String) :
  BaseRequest(RequestType.FULL, sessionId, playerId, traceId)

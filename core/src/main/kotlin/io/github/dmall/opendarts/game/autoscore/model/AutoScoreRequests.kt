package io.github.dmall.opendarts.game.autoscore.model

abstract class BaseRequest(val requestType: RequestType, val sessionId: String, val playerId: Long)

class PingRequest(sessionId: String, playerId: Long, val message: String) :
    BaseRequest(RequestType.PING, sessionId, playerId)

class ScoringRequest(
    sessionId: String,
    playerId: Long,
    val image: String,
    val calibrationResult: CalibrationResult,
) : BaseRequest(RequestType.SCORING, sessionId, playerId)

class CalibrationRequest(sessionId: String, playerId: Long, val image: String) :
    BaseRequest(RequestType.CALIBRATION, sessionId, playerId)

class PipelineDetectionRequest(sessionId: String, playerId: Long, val image: String) :
    BaseRequest(RequestType.FULL, sessionId, playerId)

package io.github.dmall.opendarts.game.autoscore.model

abstract class BaseRequest(val requestType: RequestType, val id: String)

class PingRequest(id: String, val message: String) : BaseRequest(RequestType.PING, id)

class ScoringRequest(id: String, val image: String, val calibrationResult: CalibrationResult) :
    BaseRequest(RequestType.SCORING, id)

class CalibrationRequest(id: String, val image: String) : BaseRequest(RequestType.CALIBRATION, id)

class PipelineDetectionRequest(id: String, val image: String) : BaseRequest(RequestType.FULL, id)

package io.github.dmall.opendarts.game.autoscore.model

import com.fasterxml.jackson.annotation.JsonProperty

abstract class BaseRequest(
    @JsonProperty("requestType")
    val requestType: RequestType,
    @JsonProperty("id")
    val id: String
)

class PingRequest(
    id: String,
    @JsonProperty("message")
    val message: String
) : BaseRequest(RequestType.PING, id)

class ScoringRequest(
    id: String,
    @JsonProperty("image")
    val image: String,
    @JsonProperty("calibrationResult")
    val calibrationResult: CalibrationResult
) : BaseRequest(RequestType.SCORING, id)


class CalibrationRequest(
    id: String,
    @JsonProperty("image")
    val image: String
) : BaseRequest(RequestType.CALIBRATION, id)


class PipelineDetectionRequest(
    id: String,
    @JsonProperty("image")
    val image: String
) : BaseRequest(RequestType.FULL, id)
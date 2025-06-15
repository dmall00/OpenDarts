package io.github.dmall.opendarts.game.autoscore.model

enum class Status(val code: Int) {
    SUCCESS(0),
    ERROR(1)
}

abstract class BaseResponse(
    val requestType: RequestType,
    val status: Status,
    val id: String
)

class ErrorResponse(
    requestType: RequestType,
    status: Status,
    id: String,
    val message: String
) : BaseResponse(requestType, status, id)

class PingResponse(
    requestType: RequestType,
    status: Status,
    id: String,
    val message: String
) : BaseResponse(requestType, status, id)

class CalibrationResponse(
    requestType: RequestType,
    status: Status,
    id: String,
    val calibrationResult: CalibrationResult
) : BaseResponse(requestType, status, id)

class ScoringResponse(
    requestType: RequestType,
    status: Status,
    id: String,
    val scoringResult: ScoringResult
) : BaseResponse(requestType, status, id)

class PipelineDetectionResponse(
    requestType: RequestType,
    status: Status,
    id: String,
    val detectionResult: DetectionResult,
    val calibrationResult: CalibrationResult,
    val preprocessingResult: PreprocessingResult
) : BaseResponse(requestType, status, id)

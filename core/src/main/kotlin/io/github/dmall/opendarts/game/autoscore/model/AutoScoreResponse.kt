package io.github.dmall.opendarts.game.autoscore.model

enum class Status(val code: Int) {
    SUCCESS(0),
    ERROR(1)
}


sealed class AutoScoreResponse(
    open val requestType: RequestType,
    open val status: Status,
    open val id: String,

    open val message: String?
)

data class ErrorResponse(
    override val requestType: RequestType,
    override val status: Status,
    override val id: String,
    override val message: String?
) : AutoScoreResponse(requestType, status, id, message)

data class PingResponse(
    override val requestType: RequestType,
    override val status: Status,
    override val id: String,
    override val message: String?
) : AutoScoreResponse(requestType, status, id, message)

data class CalibrationResponse(
    override val requestType: RequestType,
    override val status: Status,
    override val id: String,
    override val message: String?,
    val calibrationResult: CalibrationResult
) : AutoScoreResponse(requestType, status, id, message)

data class ScoringResponse(
    override val requestType: RequestType,
    override val status: Status,
    override val id: String,
    override val message: String?,
    val scoringResult: ScoringResult
) : AutoScoreResponse(requestType, status, id, message)

data class PipelineDetectionResponse(
    override val requestType: RequestType,
    override val status: Status,
    override val id: String,
    override val message: String?,
    val detectionResult: DetectionResult
) : AutoScoreResponse(requestType, status, id, message)
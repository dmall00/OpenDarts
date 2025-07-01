package io.github.dmall.opendarts.game.autoscore.model


enum class Status(val code: Int) {
    SUCCESS(0),
    ERROR(1);

    fun isSuccess() = this == Status.SUCCESS
}

sealed class AutoScoreResponse(
    open val requestType: RequestType,
    open val status: Status,
    open val sessionId: String,

    open val playerId: Long,
    open val message: String?,
)

data class ErrorResponse(
    override val requestType: RequestType,
    override val status: Status,
    override val sessionId: String,
    override val message: String?,
    override val playerId: Long,
) : AutoScoreResponse(requestType, status, sessionId, playerId, message)

data class PingResponse(
    override val requestType: RequestType,
    override val status: Status,
    override val sessionId: String,
    override val message: String?,
    override val playerId: Long,
) : AutoScoreResponse(requestType, status, sessionId, playerId, message)

data class CalibrationResponse(
    override val requestType: RequestType,
    override val status: Status,
    override val sessionId: String,
    override val playerId: Long,
    override val message: String?,
    val calibrationResult: CalibrationResult,
) : AutoScoreResponse(requestType, status, sessionId, playerId, message)

data class ScoringResponse(
    override val requestType: RequestType,
    override val status: Status,
    override val sessionId: String,
    override val playerId: Long,
    override val message: String?,
    val scoringResult: ScoringResult,
) : AutoScoreResponse(requestType, status, sessionId, playerId, message)

data class PipelineDetectionResponse(
    override val requestType: RequestType,
    override val status: Status,
    override val sessionId: String,
    override val playerId: Long,
    override val message: String?,
    val detectionResult: DetectionResult,
) : AutoScoreResponse(requestType, status, sessionId, playerId, message)

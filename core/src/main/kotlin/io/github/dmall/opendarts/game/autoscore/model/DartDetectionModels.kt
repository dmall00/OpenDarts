package io.github.dmall.opendarts.game.autoscore.model

enum class RequestType {
    CALIBRATION,
    SCORING,
    FULL,
    PING,
    NONE,
}

enum class AutoScoringResultCode(val code: Int) {
    SUCCESS(0),
    YOLO_ERROR(1),
    HOMOGRAPHY(2),
    MISSING_CALIBRATION_POINTS(3),
    INVALID_INPUT(4),
    UNKNOWN(100);

    fun isSuccess() = this == SUCCESS
    fun isYoloError() = this == YOLO_ERROR
    fun isMissingCalibration() = this == MISSING_CALIBRATION_POINTS
}

data class CalibrationResult(
    val homographyMatrix: Array<IntArray>,
    val calibrationPoints: List<CalibrationPoint>,
    val preprocessingResult: PreprocessingResult,
)

data class PreprocessingResult(val cropInfo: CropInformation?)

data class CropInformation(val xOffset: Int, val yOffset: Int, val width: Int, val height: Int)

data class CalibrationPoint(
    val x: Double,
    val y: Double,
    val confidence: Double,
    val classId: Int,
    val message: String
)

data class ScoringResult(val dartDetections: List<DartDetection>)

data class DartDetection(
    val dartScore: DartScore,
    val originalPosition: OriginalPosition,
    val transformedPosition: TransformedPosition,
)

data class TransformedPosition(val x: Float, val y: Float)

data class OriginalPosition(val x: Float, val y: Float, val confidence: Float)

data class DartScore(val scoreString: String, val scoreValue: Int)

data class DetectionResult(
    val preprocessing: PreprocessingResult?,
    val calibrationResult: CalibrationResult?,
    val scoringResult: ScoringResult?,
    val resultCode: AutoScoringResultCode,
    val message: String?,
    val details: String?,
    val creationTime: Double,
)

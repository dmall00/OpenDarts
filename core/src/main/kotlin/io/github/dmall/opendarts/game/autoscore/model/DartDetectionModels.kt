package io.github.dmall.opendarts.game.autoscore.model

import com.fasterxml.jackson.annotation.JsonProperty

enum class RequestType {
    CALIBRATION,
    SCORING,
    FULL,
    PING
}

class CalibrationResult(
    @JsonProperty("homographyMatrix")
    val homographyMatrix: Array<IntArray>,
    @JsonProperty("calibrationPoints")
    val calibrationPoints: List<CalibrationPoint>,
    @JsonProperty("preprocessingResult")
    val preprocessingResult: PreprocessingResult
)

class PreprocessingResult(
    @JsonProperty("cropInfo")
    val cropInfo: CropInformation
)

class CropInformation(
    @JsonProperty("xOffset")
    val xOffset: Int,
    @JsonProperty("yOffset")
    val yOffset: Int,
    @JsonProperty("width")
    val width: Int,
    @JsonProperty("height")
    val height: Int
)

class CalibrationPoint(
    @JsonProperty("classId")
    val classId: Int,
    @JsonProperty("pointType")
    val pointType: String,
    @JsonProperty("message")
    val message: String
)

class ScoringResult(
    @JsonProperty("dartDetections")
    val dartDetections: List<DartDetection>
)

class DartDetection(
    @JsonProperty("dartScore")
    val dartScore: DartScore,
    @JsonProperty("originalPosition")
    val originalPosition: DartPosition,
    @JsonProperty("transformedPosition")
    val transformedPosition: DartPosition
)

class DartPosition(
    @JsonProperty("x")
    val x: Int,
    @JsonProperty("y")
    val y: Int
)

class DartScore(
    @JsonProperty("scoreString")
    val scoreString: String,
    @JsonProperty("scoreValue")
    val scoreValue: Int
)

class DetectionResult(
    @JsonProperty("scoringResult")
    val scoringResult: ScoringResult,
    @JsonProperty("calibrationResult")
    val calibrationResult: CalibrationResult
)

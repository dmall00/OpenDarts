"""Environment-based configuration settings for the autoscore server."""

from pathlib import Path
from typing import Literal, Tuple

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from detector.model.configuration import CalibrationPointDetectionMode, ProcessingConfig


class ServerSettings(BaseSettings):
    """Server-wide configuration settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_prefix="AUTOSCORE_",
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    host: str = Field(default="0.0.0.0", description="Server host address")  # noqa: S104
    port: int = Field(default=8765, description="Server port")
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = Field(default="INFO", description="Logging level")
    max_message_size: int = Field(default=20 * 1024 * 1024, description="Maximum WebSocket message size in bytes")

    save_images: bool = Field(default=True, description="Enable image saving for debugging")
    image_save_directory: Path = Field(default_factory=lambda: Path("./saved_images"), description="Directory to save processed images")

    calibration_confidence_threshold: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Confidence threshold for calibration point detections",
    )
    dart_confidence_threshold: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Confidence threshold for dart detection",
    )
    target_image_width: int = Field(default=800, gt=0, description="Target image width for processing")
    target_image_height: int = Field(default=800, gt=0, description="Target image height for processing")
    min_calibration_points: int = Field(default=4, ge=4, description="Minimum calibration points required")
    max_allowed_darts: int = Field(default=3, gt=0, description="Maximum number of darts allowed")
    enable_cropping_model: bool = Field(default=True, description="Enable cropping model for dart detection")
    crop_padding_ratio: float = Field(
        default=0.15,
        ge=0.0,
        le=1.0,
        description="Padding ratio for cropping the dartboard area",
    )
    calibration_detection_mode: CalibrationPointDetectionMode = Field(
        default=CalibrationPointDetectionMode.GEOMETRIC,
        description="Mode for calibration point detection",
    )
    use_gpu: bool = Field(
        default=False,
        description="Enable GPU acceleration for YOLO models",
    )

    def __init__(self, **kwargs) -> None:  # noqa: ANN003
        super().__init__(**kwargs)
        if self.save_images:
            self.image_save_directory.mkdir(parents=True, exist_ok=True)

    @property
    def target_image_size(self) -> Tuple[int, int]:
        """Get target image size as tuple."""
        return self.target_image_width, self.target_image_height

    def to_processing_config(self) -> ProcessingConfig:
        """Convert to ProcessingConfig for the detector package."""
        return ProcessingConfig(
            calibration_confidence_threshold=self.calibration_confidence_threshold,
            dart_confidence_threshold=self.dart_confidence_threshold,
            target_image_size=self.target_image_size,
            min_calibration_points=self.min_calibration_points,
            max_allowed_darts=self.max_allowed_darts,
            enable_cropping_model=self.enable_cropping_model,
            crop_padding_ratio=self.crop_padding_ratio,
            calibration_detection_mode=self.calibration_detection_mode,
            use_gpu=self.use_gpu,
        )


def __load_settings() -> ServerSettings:
    """Load application settings from environment variables."""
    return ServerSettings()

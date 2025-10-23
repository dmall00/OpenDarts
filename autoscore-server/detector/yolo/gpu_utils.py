"""Utilities for GPU device detection and model setup."""

import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ultralytics import YOLO

logger = logging.getLogger(__name__)


def setup_model_device(model: "YOLO", use_gpu: bool) -> None:  # noqa: FBT001
    """
    Configure YOLO model to use GPU if available and requested.

    Supports CUDA (NVIDIA GPUs) and MPS (Apple Silicon GPUs).
    Falls back to CPU if GPU is not available or torch is not installed.

    Args:
        model: YOLO model instance to configure
        use_gpu: Whether to attempt GPU acceleration

    """
    if not use_gpu:
        logger.info("Using CPU for inference")
        return

    try:
        import torch  # noqa: PLC0415

        if torch.cuda.is_available():
            device = "cuda"
            logger.info("Moving model to GPU (CUDA)")
        elif torch.backends.mps.is_available():
            device = "mps"
            logger.info("Moving model to GPU (MPS - Apple Silicon)")
        else:
            device = "cpu"
            logger.warning("GPU requested but not available, using CPU")

        model.to(device)
    except ImportError:
        logger.warning("GPU requested but torch not available, using CPU")

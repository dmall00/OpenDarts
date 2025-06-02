import logging
import os

logger = logging.getLogger(__name__)


class FileValidator:
    @staticmethod
    def validate_model_path(model_path):
        if not os.path.exists(model_path):
            error_msg = f"Model file not found: {model_path}"
            logger.error(error_msg)
            raise FileNotFoundError(error_msg)

    @staticmethod
    def validate_image_path(image_path):
        if not os.path.exists(image_path):
            error_msg = f"Image file not found: {image_path}"
            logger.error(error_msg)
            raise FileNotFoundError(error_msg)

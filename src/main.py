import logging
import time

import cv2
import numpy as np

from src.core.detectory import DartDetector
from src.utils.image_utils import crop_image
from src.utils.image_utils import resize_image
from src.utils.validation import FileValidator

logger = logging.getLogger(__name__)


class DartScoringApp:
    def __init__(self, model_path="weights.pt"):
        logger.info(f"Initializing DartScoringApp with model: {model_path}")
        FileValidator.validate_model_path(model_path)
        self.detector = DartDetector(model_path)
        logger.info("DartScoringApp initialization complete")

    def score_image(self, image_path, resolution=None):
        logger.info(f"Scoring darts in image: {image_path}")

        try:
            image = self._load_image(image_path)
            image = resize_image(image=image)
            resolution, crop_size, crop_start = self._calculate_crop_parameters(image.shape, resolution)
            cropped_image, crop_start, crop_size = crop_image(image, resolution, crop_size)
            # cv2.imshow("Cropped Image", cropped_image)
            # cv2.waitKey(0)
            # cv2.destroyAllWindows()

            logger.info(f"Image cropped to size: {cropped_image.shape}")

            result = self.detector.yolo_processor.run_inference(cropped_image)
            h_matrix, calibration_coords, dart_coords, darts, score = self.detector.process_frame(
                result, resolution, crop_start, crop_size, repeat_threshold=1
            )

            if h_matrix is None:
                error_msg = "Could not find sufficient calibration points for homography"
                logger.warning(error_msg)
                return self._create_error_result(error_msg)

            dart_positions = self.detector.dart_coords_in_visit
            return self._create_success_result(darts, score, dart_positions)

        except (FileNotFoundError, ValueError, RuntimeError) as e:
            return self._create_error_result(str(e))
        except Exception as e:
            error_msg = f"Unexpected error processing image: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return self._create_error_result(error_msg)

    def _load_image(self, image_path):
        FileValidator.validate_image_path(image_path)
        image = cv2.imread(image_path)
        if image is None:
            error_msg = f"Could not load image: {image_path}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        logger.debug(f"Image loaded successfully. Shape: {image.shape}")
        return image

    def _calculate_crop_parameters(self, image_shape, resolution):
        height, width = image_shape[:2]
        if resolution is None:
            resolution = np.array([width, height])
        else:
            resolution = np.array(resolution)

        crop_size = min(resolution)
        crop_start = resolution / 2 - crop_size / 2

        logger.info(f"Crop parameters - Resolution: {resolution}, Crop size: {crop_size}, Crop start: {crop_start}")
        return resolution, crop_size, crop_start

    def _create_error_result(self, error_message):
        return {
            'darts': [],
            'total_score': 0,
            'dart_positions': [],
            'success': False,
            'message': error_message
        }

    def _create_success_result(self, darts, score, dart_positions):
        filtered_darts = [dart for dart in darts if dart != '']
        logger.info(f"Scoring complete. Darts: {filtered_darts}, Total score: {score}")
        return {
            'darts': filtered_darts,
            'total_score': score,
            'dart_positions': dart_positions.copy(),
            'success': True,
            'message': f"Successfully scored {len(filtered_darts)} darts"
        }


def main():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    image_path = "data/img_3.png"
    try:
        app = DartScoringApp()
        start = time.time()
        result = app.score_image(image_path)
        end = time.time()

        if result['success']:
            print("Dart Scoring Results. Took ", end - start, " seconds")
            print(f"Darts: {result['darts']}")
            print(f"Total Score: {result['total_score']}")
            print(f"Dart Positions: {result['dart_positions']}")
        else:
            print(f"Scoring failed: {result['message']}")

    except Exception as e:
        print(f"Error: {str(e)}")


if __name__ == "__main__":
    main()

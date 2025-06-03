import logging

import numpy as np
from ultralytics import YOLO

logger = logging.getLogger(__name__)


class YoloProcessor:
    def __init__(self, model_path):
        logger.info(f"Loading YOLO model from: {model_path}")
        self.model = YOLO(model_path)
        self.class_names = {0: '20', 1: '3', 2: '11', 3: '6', 4: 'dart', 6: '15', 5: '11'}

    def extract_detections(self, yolo_result):
        logger.debug("Processing YOLO detection output")
        calibration_coords = -np.ones((6, 2))
        dart_coords = []
        # Track which calibration points have duplicates
        duplicate_calib_points = set()

        classes = yolo_result.boxes.cls
        boxes = yolo_result.boxes.xywhn
        confidences = yolo_result.boxes.conf

        logger.debug(f"Processing {len(classes)} detected objects")

        for i in range(len(classes)):
            class_id = int(classes[i].item())
            confidence = float(confidences[i].item())
            box_center = [boxes[i][0], boxes[i][1]]
            logger.debug(f"Processing {self.class_names.get(class_id)} point: {confidence:.4f}")

            if class_id == 4:  # Dart
                if len(dart_coords) < 3:
                    dart_coords.append(box_center)
                    logger.debug(f"Added dart at position {box_center}")
            else:  # Calibration point
                if confidence < 0.6:
                    logger.info(
                        f"Skipping low-confidence calibration {self.class_names.get(class_id)} point: {confidence:.4f}")
                    continue

                calib_index = class_id if class_id < 4 else class_id - 1

                # Skip if we've already identified this as a duplicate
                if calib_index in duplicate_calib_points:
                    logger.info(
                        f"Ignoring duplicate calibration point {self.class_names.get(class_id)}")
                    continue

                # If we've already added this calibration point, mark it as duplicate and remove it
                if not np.all(calibration_coords[calib_index] == -1):
                    logger.info(
                        f"Found duplicate of calibration point {self.class_names.get(class_id)}. Ignoring this class.")
                    calibration_coords[calib_index] = -np.ones(2)  # Reset to invalid
                    duplicate_calib_points.add(calib_index)  # Mark as duplicate
                    continue

                # This is the first instance of this calibration point
                calibration_coords[calib_index] = box_center
                logger.info(
                    f"Added calibration point {self.class_names.get(class_id)} with confidence {confidence:.2f}")

        dart_coords = np.array(dart_coords)
        valid_calibration_points = np.count_nonzero(calibration_coords != -1) // 2
        logger.info(f"Extracted {valid_calibration_points} calibration points and {len(dart_coords)} darts")

        return calibration_coords, dart_coords

    def run_inference(self, image):
        logger.info("Running YOLO inference...")
        import time
        start_time = time.time()
        try:
            results = list(self.model(image, verbose=False))
            if not results:
                raise RuntimeError("No results from YOLO model")

            result = results[0]
            inference_time = time.time() - start_time
            logger.info(
                f"YOLO inference complete. Detected {len(result.boxes)} objects and took {inference_time:.2f} seconds")
            return result
        except Exception as e:
            error_msg = f"YOLO inference failed: {str(e)}"
            logger.error(error_msg)
            raise RuntimeError(error_msg)

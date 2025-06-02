from ultralytics import YOLO
import numpy as np
import time
import logging

from src.core.score_calculator import ScoreCalculator

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('DartDetector')

class DartDetector:
    """
    Handles the detection of darts using a YOLO model and processes the results.
    This class is responsible for detecting darts, tracking their positions,
    and calculating scores.
    """
    def __init__(self, model_path="../../weights.pt"):
        """
        Initialize the DartDetector with a YOLO model.
        
        Args:
            model_path: Path to the YOLO model file
        """
        logger.info(f"Initializing DartDetector with model: {model_path}")
        self.model = YOLO(model_path)
        logger.info("YOLO model loaded successfully")
        
        self.score_calculator = ScoreCalculator()
        logger.info("ScoreCalculator initialized")
        
        # Initialize state variables
        self.dart_coords_in_visit = []
        self.darts_in_visit = [''] * 3
        self.user_calibration = -np.ones((6, 2))
        self.wait_for_dart_removal = False
        
        # Queue for prediction stability
        self.pred_queue = -np.ones((5, 3, 2))
        self.pred_queue_count = 0
        
        logger.info("DartDetector initialization complete")
    
    def _distance(self, coord1, coord2):
        """Calculate Euclidean distance between two coordinates."""
        dist = np.sqrt(np.sum((coord1 - coord2) ** 2))
        logger.debug(f"Distance between {coord1} and {coord2}: {dist}")
        return dist
    
    def _adjust_coords(self, calibration_coords, dart_coords, resolution, crop_start, crop_size):
        """
        Adjust coordinates for the square crop.
        
        Args:
            calibration_coords: Calibration point coordinates
            dart_coords: Dart coordinates
            resolution: Image resolution
            crop_start: Start position of the crop
            crop_size: Size of the crop
            
        Returns:
            tuple: (adjusted_calibration_coords, adjusted_dart_coords)
        """
        logger.debug(f"Adjusting coordinates - Resolution: {resolution}, Crop start: {crop_start}, Crop size: {crop_size}")
        logger.debug(f"Original calibration coords: {calibration_coords}")
        logger.debug(f"Original dart coords shape: {dart_coords.shape}")
        
        # Get pixel coords
        calibration_coords *= resolution
        # Adjust pixel coords for square crop
        calibration_coords -= crop_start
        # Convert back to normalized coords
        calibration_coords /= crop_size
        
        logger.debug(f"Adjusted calibration coords: {calibration_coords}")
        
        if dart_coords.shape != (0,):  # Do same for darts
            logger.debug(f"Original dart coords: {dart_coords}")
            dart_coords *= resolution
            dart_coords -= crop_start
            dart_coords /= crop_size
            # Remove any dart points detected outside of square crop
            dart_coords = dart_coords[np.all(np.logical_and(dart_coords >= 0, dart_coords <= 1), axis=1)]
            logger.debug(f"Adjusted dart coords: {dart_coords}")
        
        return calibration_coords, dart_coords
    
    def _process_predictions(self, transformed_dart_coords, repeat_threshold):
        """
        Process dart predictions to ensure stability and accuracy.
        
        Args:
            transformed_dart_coords: Dart coordinates transformed to board plane
            repeat_threshold: Threshold for considering a prediction stable
        """
        logger.debug(f"Processing predictions - Transformed dart coords: {transformed_dart_coords}")
        logger.debug(f"Current prediction queue count: {self.pred_queue_count}")
        
        # Update prediction queue
        if len(transformed_dart_coords) == 0:
            logger.debug("No darts detected in this frame")
            self.pred_queue[self.pred_queue_count % 5] = -np.ones((3, 2))
        else:
            logger.debug(f"Detected {len(transformed_dart_coords)} darts in this frame")
            # Add [-1, -1] to fill any spaces when < 3 darts
            self.pred_queue[self.pred_queue_count % 5] = np.vstack(
                (transformed_dart_coords, -np.ones((3-len(transformed_dart_coords), 2)))
            )
        self.pred_queue_count += 1
        
        if self.wait_for_dart_removal:
            logger.debug("Waiting for dart removal...")
            # Check if darts have been removed
            count = 0
            for frame in self.pred_queue:
                if np.all(frame == -1):
                    count += 1
            logger.debug(f"Empty frames count: {count}/{repeat_threshold}")
            if count >= repeat_threshold:
                logger.info("Darts removed, resetting visit")
                self._reset_visit()
        
        elif self.darts_in_visit.count('') > 0:
            logger.debug("Processing new dart detections")
            # Process new dart detections
            unique_predictions = np.unique(self.pred_queue[self.pred_queue != -1].reshape(-1, 2), axis=0)
            logger.debug(f"Found {len(unique_predictions)} unique predictions")
            
            matches = {tuple(pred): [] for pred in unique_predictions}  # Group similar predictions
            
            for frame in self.pred_queue:
                for pred in frame:
                    if np.any(pred == -1):
                        continue
                    for unique_pred in unique_predictions:
                        if self._distance(pred, unique_pred) < 0.01:  # Same prediction if distance < 0.01
                            matches[tuple(unique_pred)].append(pred)
                            break
            
            # Sort dictionary based on length of values lists
            matches = {
                k: v for k, v in sorted(
                    matches.items(), 
                    key=lambda item: len(item[1]), 
                    reverse=True
                ) if len(v) >= repeat_threshold
            }
            
            logger.debug(f"Stable predictions after filtering: {len(matches)}")
            
            best_predictions = []
            for k, match_ in matches.items():
                mean_pred = np.mean(match_, axis=0)
                logger.debug(f"Prediction {k} appeared {len(match_)} times, mean position: {mean_pred}")
                best_predictions.append(mean_pred)
            
            if len(self.dart_coords_in_visit) == 0:
                logger.info(f"First darts in visit: {best_predictions[:3]}")
                self.dart_coords_in_visit = [pred for pred in best_predictions[:3]]
            else:
                logger.debug(f"Current darts in visit: {self.dart_coords_in_visit}")
                for best_pred in best_predictions:
                    if all([self._distance(coords, best_pred) > 0.01 for coords in self.dart_coords_in_visit]):
                        if len(self.dart_coords_in_visit) == 3:
                            logger.debug("Already have 3 darts, not adding more")
                            break
                        logger.info(f"Adding new dart at position: {best_pred}")
                        self.dart_coords_in_visit.append(best_pred)
    
    def _reset_visit(self):
        """Reset the current visit state."""
        logger.info("Resetting visit state")
        self.dart_coords_in_visit = []
        self.darts_in_visit = [''] * 3
        self.wait_for_dart_removal = False
        self.pred_queue = -np.ones((5, 3, 2))
        self.pred_queue_count = 0
        logger.debug("Visit state reset complete")
    
    def process_frame(self, result, resolution, crop_start, crop_size, repeat_threshold=3):
        """
        Process a single frame from the YOLO model.
        
        Args:
            result: YOLO model result
            resolution: Image resolution
            crop_start: Start position of the crop
            crop_size: Size of the crop
            repeat_threshold: Threshold for considering a prediction stable
            
        Returns:
            tuple: (H_matrix, calibration_coords, dart_coords, darts, score)
        """
        logger.debug("Processing new frame")
        
        # Process YOLO output
        calibration_coords, dart_coords = self.score_calculator.process_yolo_output(result)
        logger.debug(f"YOLO output processed - Calibration points: {np.count_nonzero(calibration_coords != -1) // 2}, Darts: {len(dart_coords)}")
        
        # Skip if not enough calibration points
        if np.count_nonzero(calibration_coords == -1) / 2 > 2:
            logger.warning("Not enough calibration points detected, skipping frame {}" )
            return None, calibration_coords, dart_coords, self.darts_in_visit, 0
        
        # Adjust coordinates for square crop
        calibration_coords, dart_coords = self._adjust_coords(
            calibration_coords, dart_coords, resolution, crop_start, crop_size
        )
        
        # Use user calibration if available
        calibration_coords = np.where(
            self.user_calibration == -1, calibration_coords, self.user_calibration
        )
        logger.debug("Applied user calibration if available")
        
        # Find homography matrix
        H_matrix = self.score_calculator.find_homography(calibration_coords, crop_size)
        logger.debug("Homography matrix calculated")
        
        # Transform dart coordinates to board plane
        transformed_dart_coords = self.score_calculator.transform_to_boardplane(
            H_matrix[0], dart_coords, crop_size
        )
        logger.debug(f"Transformed dart coordinates: {transformed_dart_coords}")
        
        # Process predictions for stability
        self._process_predictions(transformed_dart_coords, repeat_threshold)
        
        # Calculate scores
        self.darts_in_visit, score = self.score_calculator.calculate_score(
            np.array(self.dart_coords_in_visit)
        )
        logger.debug(f"Calculated scores: {self.darts_in_visit}, Total: {score}")
        
        # Ensure darts_in_visit has exactly 3 elements
        while len(self.darts_in_visit) < 3:
            self.darts_in_visit.append('')
        
        return H_matrix, calibration_coords, dart_coords, self.darts_in_visit, score
    
    def start_detection(self, ui_callback, source, resolution=np.array((1200, 1600))):
        """
        Start the dart detection process using a video source.
        
        Args:
            ui_callback: Callback function to update the UI
            source: Video source (IP address or path)
            resolution: Image resolution
        """
        logger.info("Starting dart detection")
        logger.info(f"Source: {source}, Resolution: {resolution}")
        
        # Calculate crop parameters
        crop_size = min(resolution)
        crop_start = resolution / 2 - crop_size / 2
        logger.info(f"Crop size: {crop_size}, Crop start: {crop_start}")
        
        # Reset state
        self._reset_visit()
        
        # Threshold for considering a prediction stable
        repeat_threshold = 3
        logger.info(f"Prediction stability threshold: {repeat_threshold}")
        
        # FPS calculation
        prev_frame_time = 0
        new_frame_time = 0
        
        logger.info("Connecting to camera...")
        camera_url = 'http://' + source + '/video'
        logger.info(f"Camera URL: {camera_url}")
        
        try:
            results = self.model(camera_url, stream=True, verbose=False)
            logger.info("Camera connection established, starting frame processing")
            
            frame_count = 0
            for result in results:
                frame_count += 1
                logger.debug(f"Processing frame #{frame_count}")
                
                # Process the current frame
                H_matrix, calibration_coords, dart_coords, darts, score = self.process_frame(
                    result, resolution, crop_start, crop_size, repeat_threshold
                )
                
                # Skip if not enough calibration points
                if H_matrix is None:
                    logger.debug("Skipping frame due to insufficient calibration points")
                    continue
                
                # Calculate FPS
                new_frame_time = time.time()
                fps = round(1 / (new_frame_time - prev_frame_time), 1)
                prev_frame_time = new_frame_time
                logger.debug(f"Current FPS: {fps}")
                
                # Update UI
                logger.debug("Updating UI with processed frame")
                ui_callback(
                    result, H_matrix, crop_start, crop_size, 
                    calibration_coords, dart_coords, score, fps
                )
        except Exception as e:
            logger.error(f"Error in detection process: {str(e)}", exc_info=True)
    
    def commit_score(self):
        """Manually commit the current score and reset for next visit."""
        logger.info(f"Committing score: {self.darts_in_visit}")
        self.wait_for_dart_removal = True
    
    def add_dart(self):
        """Manually add a dart at the center of the board."""
        if len(self.dart_coords_in_visit) < 3:
            logger.info("Manually adding dart at center of board")
            self.dart_coords_in_visit.append([0.5, 0.5])
        else:
            logger.warning("Cannot add more darts, already at maximum (3)")

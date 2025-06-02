import cv2
import numpy as np
import os
import logging
from pathlib import Path

from src.core.dart_detector import DartDetector
from src.utils.image_utils import crop_image

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('DartScorer')

class DartScorer:
    """
    A class for scoring darts from static images.
    This class processes a single image and returns the dart scores without any UI components.
    """
    
    def __init__(self, model_path="weights.pt"):
        """
        Initialize the DartScorer with a YOLO model.
        
        Args:
            model_path: Path to the YOLO model file
        """
        logger.info(f"Initializing DartScorer with model: {model_path}")
        
        # Check if model file exists
        if not os.path.exists(model_path):
            logger.error(f"Model file not found: {model_path}")
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        self.dart_detector = DartDetector(model_path)
        logger.info("DartScorer initialization complete")
    
    def score_image(self, image_path, resolution=None):
        """
        Score darts in a single image.
        
        Args:
            image_path: Path to the image file
            resolution: Image resolution (width, height). If None, will use actual image dimensions
            
        Returns:
            dict: Dictionary containing:
                - 'darts': List of dart scores (e.g., ['S20', 'T19', 'D16'])
                - 'total_score': Total score as integer
                - 'dart_positions': List of dart coordinates in board plane
                - 'success': Boolean indicating if scoring was successful
                - 'message': Status message
        """
        logger.info(f"Scoring darts in image: {image_path}")
        
        # Check if image file exists
        if not os.path.exists(image_path):
            error_msg = f"Image file not found: {image_path}"
            logger.error(error_msg)
            return {
                'darts': [],
                'total_score': 0,
                'dart_positions': [],
                'success': False,
                'message': error_msg
            }
        
        try:
            # Load the image
            image = cv2.imread(image_path)
            if image is None:
                error_msg = f"Could not load image: {image_path}"
                logger.error(error_msg)
                return {
                    'darts': [],
                    'total_score': 0,
                    'dart_positions': [],
                    'success': False,
                    'message': error_msg
                }
            
            logger.info(f"Image loaded successfully. Shape: {image.shape}")
            
            # Get image dimensions
            height, width = image.shape[:2]
            if resolution is None:
                resolution = np.array([width, height])
            else:
                resolution = np.array(resolution)
            
            logger.info(f"Using resolution: {resolution}")
            
            # Calculate crop parameters for square crop
            crop_size = min(resolution)
            crop_start = resolution / 2 - crop_size / 2
            
            logger.info(f"Crop size: {crop_size}, Crop start: {crop_start}")
            
            # Crop the image to square
            cropped_image, crop_start, crop_size = crop_image(image, resolution, crop_size)
            logger.info(f"Image cropped to size: {cropped_image.shape}")
            
            # Run YOLO inference on the cropped image
            logger.info("Running YOLO inference...")
            results = list(self.dart_detector.model(cropped_image, verbose=False))
            
            if not results:
                error_msg = "No results from YOLO model"
                logger.error(error_msg)
                return {
                    'darts': [],
                    'total_score': 0,
                    'dart_positions': [],
                    'success': False,
                    'message': error_msg
                }
            
            result = results[0]
            logger.info(f"YOLO inference complete. Detected {len(result.boxes)} objects")
            
            # Process the frame using the dart detector
            H_matrix, calibration_coords, dart_coords, darts, score = self.dart_detector.process_frame(
                result, resolution, crop_start, crop_size, repeat_threshold=1
            )
            
            if H_matrix is None:
                error_msg = "Could not find sufficient calibration points for homography"
                logger.warning(error_msg)
                return {
                    'darts': [],
                    'total_score': 0,
                    'dart_positions': [],
                    'success': False,
                    'message': error_msg
                }
            
            # Get the dart positions in board plane
            dart_positions = self.dart_detector.dart_coords_in_visit.copy()
            
            # Filter out empty dart scores
            filtered_darts = [dart for dart in darts if dart != '']
            
            logger.info(f"Scoring complete. Darts: {filtered_darts}, Total score: {score}")
            
            return {
                'darts': filtered_darts,
                'total_score': score,
                'dart_positions': dart_positions,
                'success': True,
                'message': f"Successfully scored {len(filtered_darts)} darts"
            }
            
        except Exception as e:
            error_msg = f"Error processing image: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return {
                'darts': [],
                'total_score': 0,
                'dart_positions': [],
                'success': False,
                'message': error_msg
            }
    
    def score_multiple_images(self, image_directory, image_extensions=None):
        """
        Score darts in multiple images from a directory.
        
        Args:
            image_directory: Path to directory containing images
            image_extensions: List of valid image extensions (default: ['.jpg', '.jpeg', '.png', '.bmp'])
            
        Returns:
            dict: Dictionary with image filenames as keys and scoring results as values
        """
        if image_extensions is None:
            image_extensions = ['.jpg', '.jpeg', '.png', '.bmp']
        
        logger.info(f"Scoring multiple images in directory: {image_directory}")
        
        if not os.path.exists(image_directory):
            logger.error(f"Directory not found: {image_directory}")
            return {}
        
        results = {}
        image_files = []
        
        # Find all image files in the directory
        for ext in image_extensions:
            image_files.extend(Path(image_directory).glob(f"*{ext}"))
            image_files.extend(Path(image_directory).glob(f"*{ext.upper()}"))
        
        logger.info(f"Found {len(image_files)} image files")
        
        for image_file in image_files:
            logger.info(f"Processing: {image_file.name}")
            result = self.score_image(str(image_file))
            results[image_file.name] = result
        
        return results


def main():
    """
    Main function demonstrating how to use the DartScorer class.
    """
    # Example usage
    image_path = "data/img_1.png"  # Replace with your image path
    
    try:
        # Initialize the scorer
        scorer = DartScorer()
        
        # Score a single image
        result = scorer.score_image(image_path)
        
        if result['success']:
            print(f"Dart Scoring Results:")
            print(f"Darts: {result['darts']}")
            print(f"Total Score: {result['total_score']}")
            print(f"Dart Positions: {result['dart_positions']}")
        else:
            print(f"Scoring failed: {result['message']}")
            
    except Exception as e:
        print(f"Error: {str(e)}")


if __name__ == "__main__":
    main()

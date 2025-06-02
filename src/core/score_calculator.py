import cv2
import numpy as np
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('ScoreCalculator')

class ScoreCalculator:
    """
    Handles the calculation of dart scores based on detected dart positions.
    This class is responsible for processing YOLO output, finding homography,
    transforming coordinates, and calculating scores.
    """
    def __init__(self):
        """Initialize the ScoreCalculator with dart board measurements and scoring regions."""
        logger.info("Initializing ScoreCalculator")
        
        # Class names for YOLO detection
        self.class_names = {0: '20', 1: '3', 2: '11', 3: '6', 4: 'dart'}
        logger.debug(f"Class names: {self.class_names}")
        
        # Dart board measurements in mm
        ring = 10.0  # width of the double and treble rings
        bullseye_wire = 1.6  # width of the bullseye wires
        logger.debug(f"Ring width: {ring}mm, Bullseye wire width: {bullseye_wire}mm")
        
        # Scoring regions and their names
        self.scoring_names = np.array(['DB', 'SB', 'S', 'T', 'S', 'D', 'miss'])
        
        # Inside radius of the corresponding regions in scoring_names
        self.scoring_radii = np.array([0, 6.35, 15.9, 107.4-ring, 107.4, 170.0-ring, 170.0])
        self.scoring_radii[1:3] += (bullseye_wire/2)  # add on half the width of the bullseye wire
        
        # Normalize radii between 0-1
        self.scoring_radii /= 451.0  # divide by the diameter of the dart board
        logger.debug(f"Normalized scoring radii: {self.scoring_radii}")
        
        # Segment angles and numbers for dart board
        self.segment_angles = np.array([-9, 9, 27, 45, 63, -81, -63, -45, -27])  # minimum angle for corresponding pairs
        self.segment_numbers = np.array(([6,11], [10,14], [15,9], [2,12], [17,5], [19,1], [7,18], [16,4], [8,13]))
        logger.debug(f"Segment angles: {self.segment_angles}")
        logger.debug(f"Segment numbers: {self.segment_numbers}")
        
        # Computing the boardplane calibration coordinates
        self.boardplane_calibration_coords = -np.ones((6, 2))
        h = self.scoring_radii[-1]
        
        # For 20 & 3
        a = h*np.cos(np.deg2rad(81))
        o = (h**2 - a**2)**0.5
        self.boardplane_calibration_coords[0] = [0.5 - a, 0.5 - o]
        self.boardplane_calibration_coords[1] = [0.5 + a, 0.5 + o]
        
        # For 11 & 6
        a = h*np.cos(np.deg2rad(-9))
        o = (h**2 - a**2)**0.5
        self.boardplane_calibration_coords[2] = [0.5 - a, 0.5 + o]
        self.boardplane_calibration_coords[3] = [0.5 + a, 0.5 - o]
        
        # For 9 & 15
        a = h*np.cos(np.deg2rad(27))
        o = (h**2 - a**2)**0.5
        self.boardplane_calibration_coords[4] = [0.5 - a, 0.5 - o]
        self.boardplane_calibration_coords[5] = [0.5 + a, 0.5 + o]
        
        logger.debug(f"Boardplane calibration coordinates: {self.boardplane_calibration_coords}")
        logger.info("ScoreCalculator initialization complete")
    
    def process_yolo_output(self, output):
        """
        Process the YOLO model output to extract calibration points and dart coordinates.
        
        Args:
            output: YOLO model output containing detected objects
            
        Returns:
            tuple: (calibration_coords, dart_coords)
        """
        logger.debug("Processing YOLO output")
        
        calibration_coords = -np.ones((6, 2))
        dart_coords = []
        classes = output.boxes.cls
        boxes = output.boxes.xywhn
        conf = output.boxes.conf
        
        logger.debug(f"Detected {len(classes)} objects")
        
        for i in range(len(classes)):
            class_id = int(classes[i].item())
            confidence = float(conf[i].item())
            
            logger.debug(f"Object {i}: Class {class_id}, Confidence {confidence:.2f}, Position {boxes[i][:2]}")
            
            if class_id == 4 and len(dart_coords) < 3:
                dart_coords.append([boxes[i][0], boxes[i][1]])
                logger.debug(f"Added dart at position {boxes[i][:2]}")
            elif class_id == 4:
                logger.debug(f"Skipping dart (already have 3)")
                continue
            else:
                if confidence < 0.85:
                    logger.debug(f"Skipping calibration point (confidence too low: {confidence:.2f})")
                    continue
                
                calibration_i = class_id
                if calibration_i > 4:
                    calibration_i -= 1
                
                if np.all(calibration_coords[calibration_i] == -1):  # don't overwrite if already detected
                    calibration_coords[calibration_i] = boxes[i][:2]
                    logger.debug(f"Added calibration point {calibration_i} at position {boxes[i][:2]}")
                else:
                    logger.debug(f"Skipping calibration point {calibration_i} (already detected)")
        
        dart_coords = np.array(dart_coords)
        
        logger.debug(f"Processed YOLO output - Found {np.count_nonzero(calibration_coords != -1) // 2} calibration points and {len(dart_coords)} darts")
        
        return calibration_coords, dart_coords
    
    def find_homography(self, calibration_coords, image_shape):
        """
        Find the homography matrix to transform between image plane and board plane.
        
        Args:
            calibration_coords: Coordinates of calibration points
            image_shape: Shape of the image
            
        Returns:
            numpy.ndarray: Homography matrix
        """
        logger.debug("Finding homography matrix")
        
        mask = np.all(np.logical_and(calibration_coords >= 0, calibration_coords <= 1), axis=1)
        valid_points = np.count_nonzero(mask)
        
        logger.debug(f"Using {valid_points} valid calibration points")
        
        if valid_points < 4:
            logger.warning(f"Only {valid_points} valid calibration points - homography may be unstable")
        
        H_matrix = cv2.findHomography(
            calibration_coords[mask]*image_shape, 
            self.boardplane_calibration_coords[mask]*image_shape
        )
        
        logger.debug(f"Homography matrix: {H_matrix[0]}")
        
        return H_matrix
    
    def transform_to_boardplane(self, matrix, dart_coords, image_shape):
        """
        Transform dart coordinates from image plane to board plane.
        
        Args:
            matrix: Homography matrix
            dart_coords: Dart coordinates in image plane
            image_shape: Shape of the image
            
        Returns:
            numpy.ndarray: Transformed dart coordinates
        """
        logger.debug(f"Transforming {len(dart_coords)} dart coordinates to board plane")
        
        if len(dart_coords) == 0:
            logger.debug("No darts to transform")
            return dart_coords
        
        logger.debug(f"Original dart coordinates: {dart_coords}")
        
        homogenous_coords = np.concatenate(
            (dart_coords*image_shape, np.ones((dart_coords.shape[0], 1))), 
            axis=1
        ).T
        
        transformed_darts = matrix @ homogenous_coords
        transformed_darts /= transformed_darts[-1]  # divide by w to get x and y coords in 2D space
        transformed_darts = transformed_darts[:-1].T
        transformed_darts /= image_shape  # normalize again for scoring function
        
        logger.debug(f"Transformed dart coordinates: {transformed_darts}")
        
        return transformed_darts
    
    def calculate_score(self, transformed_darts):
        """
        Calculate the score for each dart based on its position on the board.
        
        Args:
            transformed_darts: Dart coordinates in board plane
            
        Returns:
            tuple: (darts, score) where darts is a list of dart scores and score is the total
        """
        logger.debug(f"Calculating scores for {len(transformed_darts)} darts")
        
        # Initialize variables
        darts = ['' for _ in range(len(transformed_darts))]
        score = 0
        
        if len(darts) == 0:
            logger.debug("No darts to score")
            return darts, score
        
        mask = transformed_darts[:,0] == 0.5
        transformed_darts[mask,0] += 0.00001  # prevent division by zero error
        
        # Find the angles of the dart locations relative to the center
        angles = np.rad2deg(np.arctan((transformed_darts[:,1]-0.5)/(transformed_darts[:,0]-0.5)))
        angles = np.where(angles > 0, np.floor(angles), np.ceil(angles))
        logger.debug(f"Dart angles: {angles}")
        
        for i in range(len(transformed_darts)):
            dart_coords = transformed_darts[i]
            logger.debug(f"Scoring dart {i} at position {dart_coords}")
            
            # Use computed angle to work out which numbered segment the dart lies in
            if abs(angles[i]) >= 81:
                possible_numbers = np.array([3,20])
                logger.debug(f"Dart {i} angle {angles[i]} >= 81, possible numbers: [3,20]")
            else:
                possible_numbers = self.segment_numbers[
                    np.where(self.segment_angles == max(self.segment_angles[self.segment_angles <= angles[i]]))
                ][0]
                logger.debug(f"Dart {i} angle {angles[i]}, possible numbers: {possible_numbers}")
            
            # Angle can only narrow down to 2 possible numbered segments
            # Use coordinate values to determine which of the 2 it is
            if all(possible_numbers == [6,11]):
                coord_index = 0
            else:
                coord_index = 1
            
            if dart_coords[coord_index] > 0.5:
                number = possible_numbers[0]
            else:
                number = possible_numbers[1]
            
            logger.debug(f"Dart {i} determined to be in segment number: {number}")
            
            # Compute euclidean distance from the center, and thus the scoring region
            distance = ((dart_coords[0]-0.5)**2 + (dart_coords[1]-0.5)**2)**0.5
            logger.debug(f"Dart {i} distance from center: {distance}")
            
            region = self.scoring_names[np.argmax(self.scoring_radii[distance > self.scoring_radii])]
            logger.debug(f"Dart {i} in region: {region}")
            
            scores = {
                'DB': ['DB', 50], 
                'SB': ['SB', 25], 
                'S': ['S'+str(number), number],
                'T': ['T'+str(number), number*3], 
                'D': ['D'+str(number), number*2], 
                'miss': ['miss', 0]
            }
            
            darts[i] = scores[region][0]
            score += scores[region][1]
            logger.debug(f"Dart {i} scored as: {darts[i]} ({scores[region][1]} points)")
                
        logger.info(f"Final score calculation: {darts} = {score} points")
        return darts, score

import logging

import cv2
import numpy as np

from src.geometry.board import DartBoard

logger = logging.getLogger(__name__)


class CalibrationVisualizer:
    """
    A utility class to visualize the dart board image after calibration and homography transformations.
    Shows the original image, detected calibration points, and the transformed/rectified board view with 
    accurate segments based on the actual board geometry and scoring logic.
    """

    def __init__(self):
        self.window_name = "Calibration Visualization"
        self.dart_board = DartBoard()

    def show_transformation_result(self, original_image, calibration_coords, homography_matrix,
                                   dart_coords=None, crop_start=None, crop_size=None):
        """
        Display the original image with calibration points and the transformed board view.
        
        Args:
            original_image: The cropped image used for detection
            calibration_coords: Detected calibration point coordinates (normalized 0-1)
            homography_matrix: The calculated homography transformation matrix
            dart_coords: Optional dart coordinates to visualize
            crop_start: Crop start position for coordinate adjustment
            crop_size: Crop size for coordinate adjustment
        """
        if homography_matrix is None:
            logger.warning("No homography matrix provided - cannot show transformation")
            return

        # Create visualization images
        original_viz = self._draw_calibration_points(original_image.copy(), calibration_coords)

        if dart_coords is not None and len(dart_coords) > 0:
            original_viz = self._draw_dart_points(original_viz, dart_coords)

        # Apply homography transformation to get rectified board view
        transformed_image = cv2.warpPerspective(
            original_image,
            homography_matrix[0],
            (original_image.shape[1], original_image.shape[0])
        )

        # Draw dart board segments on the transformed image using actual board geometry
        transformed_with_segments = self._draw_accurate_dart_board(transformed_image.copy())
        
        # Add dart points to transformed image if available
        if dart_coords is not None and len(dart_coords) > 0:
            # Transform dart coordinates to the rectified space
            transformed_dart_coords = self._transform_dart_coords(dart_coords, homography_matrix[0],
                                                                  original_image.shape)
            transformed_with_segments = self._draw_dart_points_with_scores(transformed_with_segments,
                                                                           transformed_dart_coords)

        # Create side-by-side comparison
        comparison = self._create_side_by_side_view(original_viz, transformed_with_segments)

        # Display the result
        cv2.imshow(self.window_name, comparison)
        print("Press any key to close the visualization...")
        cv2.waitKey(0)
        cv2.destroyAllWindows()

    def _draw_calibration_points(self, image, calibration_coords):
        """Draw calibration points on the image."""
        height, width = image.shape[:2]

        # Convert normalized coordinates to pixel coordinates
        pixel_coords = calibration_coords * np.array([width, height])

        # Draw calibration points
        for i, (x, y) in enumerate(pixel_coords):
            if x >= 0 and y >= 0:  # Only draw valid points
                # Draw circle for calibration point
                cv2.circle(image, (int(x), int(y)), 8, (0, 255, 0), 2)
                # Add point number
                cv2.putText(image, str(i + 1), (int(x + 10), int(y - 10)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

        return image

    def _draw_dart_points(self, image, dart_coords):
        """Draw dart points on the image."""
        height, width = image.shape[:2]

        # Convert normalized coordinates to pixel coordinates
        pixel_coords = dart_coords * np.array([width, height])

        # Draw dart points
        for i, (x, y) in enumerate(pixel_coords):
            # Draw circle for dart point
            cv2.circle(image, (int(x), int(y)), 6, (0, 0, 255), 2)
            # Add dart number
            cv2.putText(image, f"D{i + 1}", (int(x + 10), int(y + 10)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)

        return image

    def _draw_dart_points_with_scores(self, image, dart_coords):
        """Draw dart points with their calculated scores on the transformed image."""
        if len(dart_coords) == 0:
            return image

        height, width = image.shape[:2]
        pixel_coords = dart_coords * np.array([width, height])

        # Calculate scores for each dart using the actual scoring logic
        from src.core.scorer import DartScorer
        scorer = DartScorer()
        dart_scores, total_score = scorer.calculate_scores(dart_coords)

        # Draw dart points with scores
        for i, ((x, y), score) in enumerate(zip(pixel_coords, dart_scores)):
            # Draw circle for dart point
            cv2.circle(image, (int(x), int(y)), 8, (0, 0, 255), 3)
            # Add dart score
            cv2.putText(image, f"{score}", (int(x + 15), int(y + 5)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

        return image

    def _transform_dart_coords(self, dart_coords, homography_matrix, image_shape):
        """Transform dart coordinates using the homography matrix."""
        if len(dart_coords) == 0:
            return dart_coords

        height, width = image_shape[:2]

        # Convert to pixel coordinates
        pixel_coords = dart_coords * np.array([width, height])

        # Add homogeneous coordinate
        homogeneous_coords = np.column_stack([pixel_coords, np.ones(len(pixel_coords))])

        # Apply transformation
        transformed_coords = homography_matrix @ homogeneous_coords.T
        transformed_coords = transformed_coords / transformed_coords[2, :]

        # Convert back to normalized coordinates
        transformed_pixel_coords = transformed_coords[:2, :].T
        normalized_coords = transformed_pixel_coords / np.array([width, height])

        return normalized_coords

    def _draw_accurate_dart_board(self, image):
        """Draw dart board using the actual board geometry and scoring logic."""
        height, width = image.shape[:2]
        center = (width // 2, height // 2)

        # Use the actual board radius - the scoring radii are normalized to board diameter
        # So we scale by half the image size to get pixel radii
        max_radius = min(width, height) // 2

        # Draw scoring rings using actual board geometry
        self._draw_scoring_rings(image, center, max_radius)

        # Draw segment boundaries based on actual board angles
        # self._draw_segment_boundaries(image, center, max_radius)

        # Draw segment numbers using actual board logic
        self._draw_segment_numbers_accurate(image, center, max_radius)

        return image

    def _draw_scoring_rings(self, image, center, max_radius):
        """Draw scoring rings using actual board geometry."""
        # Use the actual scoring radii from the board
        scoring_radii_pixels = self.dart_board.scoring_radii * max_radius * 2

        # Define colors for different scoring regions
        ring_colors = [
            (128, 128, 128),  # miss (outer)
            (255, 0, 0),  # double
            (0, 255, 0),  # single (outer)
            (255, 255, 0),  # treble
            (0, 255, 0),  # single (inner)
            (0, 255, 255),  # single bull
            (255, 255, 0),  # double bull
        ]

        # Draw rings from outside to inside
        for i in range(len(scoring_radii_pixels) - 1, 0, -1):
            radius = int(scoring_radii_pixels[i])
            if radius > 0:
                color = ring_colors[min(i, len(ring_colors) - 1)]
                cv2.circle(image, center, radius, color, 2)

    def _draw_segment_boundaries(self, image, center, max_radius):
        """Draw segment boundaries using actual board angles."""
        # Use the actual segment angles from the board
        segment_angles = self.dart_board.segment_angles

        # Draw lines for each segment boundary
        for angle_deg in segment_angles:
            angle_rad = np.deg2rad(angle_deg)
            end_x = int(center[0] + max_radius * np.cos(angle_rad))
            end_y = int(center[1] + max_radius * np.sin(angle_rad))
            cv2.line(image, center, (end_x, end_y), (255, 255, 255), 2)

        # Draw the boundaries for segments 20 and 3 (at ±81 degrees)
        for angle_deg in [81, -81]:
            angle_rad = np.deg2rad(angle_deg)
            end_x = int(center[0] + max_radius * np.cos(angle_rad))
            end_y = int(center[1] + max_radius * np.sin(angle_rad))
            cv2.line(image, center, (end_x, end_y), (255, 255, 255), 2)

    def _draw_segment_numbers_accurate(self, image, center, max_radius):
        """Draw segment numbers using the actual board geometry and logic."""
        # Sample points around the board to determine segment numbers
        text_radius = max_radius * 0.8

        # Create a grid of angles to sample segment numbers
        num_samples = 40  # More samples for better accuracy

        for i in range(num_samples):
            angle_deg = (i * 360 / num_samples) - 90  # Start from top
            angle_rad = np.deg2rad(angle_deg)

            # Calculate position for this angle
            sample_x = 0.5 + 0.4 * np.cos(angle_rad)  # 0.4 puts us in the outer single region
            sample_y = 0.5 + 0.4 * np.sin(angle_rad)
            sample_position = np.array([sample_x, sample_y])

            # Calculate the angle as the board scoring system does
            adjusted_position = sample_position.copy()
            if adjusted_position[0] == 0.5:
                adjusted_position[0] += 0.00001

            angle_for_scoring = np.arctan((adjusted_position[1] - 0.5) / (adjusted_position[0] - 0.5))
            angle_deg_for_scoring = np.rad2deg(angle_for_scoring)
            if angle_deg_for_scoring > 0:
                angle_deg_for_scoring = np.floor(angle_deg_for_scoring)
            else:
                angle_deg_for_scoring = np.ceil(angle_deg_for_scoring)

            # Get segment number using board logic
            segment_number = self.dart_board.get_segment_number(angle_deg_for_scoring, sample_position)

            # Only draw numbers at certain intervals to avoid clutter
            if i % 2 == 0:  # Draw every other sample
                text_x = int(center[0] + text_radius * np.cos(angle_rad))
                text_y = int(center[1] + text_radius * np.sin(angle_rad))

                cv2.putText(image, str(segment_number), (text_x - 8, text_y + 5),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

    def _create_side_by_side_view(self, original, transformed):
        """Create a side-by-side comparison view."""
        # Resize images to same height if needed
        h1, w1 = original.shape[:2]
        h2, w2 = transformed.shape[:2]

        target_height = min(h1, h2, 600)  # Limit height for display

        # Resize original
        scale1 = target_height / h1
        new_w1 = int(w1 * scale1)
        original_resized = cv2.resize(original, (new_w1, target_height))

        # Resize transformed
        scale2 = target_height / h2
        new_w2 = int(w2 * scale2)
        transformed_resized = cv2.resize(transformed, (new_w2, target_height))

        # Create side-by-side image
        total_width = new_w1 + new_w2 + 20  # 20px gap
        comparison = np.zeros((target_height, total_width, 3), dtype=np.uint8)

        # Place images
        comparison[:, :new_w1] = original_resized
        comparison[:, new_w1 + 20:new_w1 + 20 + new_w2] = transformed_resized

        # Add labels
        cv2.putText(comparison, "Original", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        cv2.putText(comparison, "Transformed", (new_w1 + 30, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

        return comparison

    def show_simple_transformation(self, image_path, dart_scoring_app):
        """
        Simple method to visualize transformation for a given image.
        
        Args:
            image_path: Path to the image file
            dart_scoring_app: Instance of DartScoringApp to use for processing
        """
        try:
            # Load and process the image
            image = cv2.imread(image_path)
            if image is None:
                logger.error(f"Could not load image: {image_path}")
                return

            from src.utils.image_utils import resize_image, crop_image

            # Process image similar to main scoring pipeline
            image = resize_image(image=image)
            resolution = np.array([image.shape[1], image.shape[0]])
            crop_size = min(resolution)
            crop_start = resolution / 2 - crop_size / 2

            cropped_image, crop_start, crop_size = crop_image(image, resolution, crop_size)

            # Run inference
            result = dart_scoring_app.detector.yolo_processor.run_inference(cropped_image)
            h_matrix, calibration_coords, dart_coords, darts, score = dart_scoring_app.detector.process_frame(
                result, resolution, crop_start, crop_size, repeat_threshold=1
            )

            if h_matrix is None:
                print("Could not find sufficient calibration points for visualization")
                return

            # Show the transformation
            self.show_transformation_result(
                cropped_image, calibration_coords, h_matrix, dart_coords
            )

            print(f"Detected darts: {darts}")
            print(f"Total score: {score}")

        except Exception as e:
            logger.error(f"Error in visualization: {str(e)}", exc_info=True)
            print(f"Visualization error: {str(e)}")

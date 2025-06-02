import cv2
import numpy as np
import os

def ensure_directory_exists(directory):
    """
    Ensure that a directory exists, creating it if necessary.
    
    Args:
        directory: Path to the directory
    """
    if not os.path.exists(directory):
        os.makedirs(directory)

def crop_image(image, resolution, crop_size=None):
    """
    Crop an image to a square centered in the image.
    
    Args:
        image: Image to crop
        resolution: Image resolution
        crop_size: Size of the crop (default: min dimension of the image)
        
    Returns:
        tuple: (cropped_image, crop_start, crop_size)
    """
    if crop_size is None:
        crop_size = min(resolution)
    
    crop_start = resolution / 2 - crop_size / 2
    
    cropped_image = image[
        int(crop_start[1]):int(crop_start[1] + crop_size),
        int(crop_start[0]):int(crop_start[0] + crop_size)
    ]
    
    return cropped_image, crop_start, crop_size

def resize_image(image, size):
    """
    Resize an image to the specified size.
    
    Args:
        image: Image to resize
        size: Target size (width, height)
        
    Returns:
        numpy.ndarray: Resized image
    """
    return cv2.resize(image, size)

def draw_board_outline(image, center, radii, segment_angles, color=(255, 0, 0), thickness=1):
    """
    Draw a dart board outline on an image.
    
    Args:
        image: Image to draw on
        center: Center point of the board (x, y)
        radii: Radii of the board rings
        segment_angles: Angles of the board segments
        color: Color of the outline
        thickness: Thickness of the lines
        
    Returns:
        numpy.ndarray: Image with board outline
    """
    # Draw circles for the rings
    for radius in radii:
        cv2.circle(image, center, int(radius), color, thickness)
    
    # Draw lines for the segments
    angles = np.append(segment_angles, 81)
    
    for angle in angles:
        # Calculate the start and end points of the line
        radian = np.deg2rad(angle)
        x = int(center[0] + radii[-1] * np.cos(radian))
        y = int(center[1] + radii[-1] * np.sin(radian))
        
        # Draw the line from the center to the edge
        cv2.line(image, center, (x, y), color, thickness)
    
    return image

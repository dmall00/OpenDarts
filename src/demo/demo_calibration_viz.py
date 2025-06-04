"""
Demo script to visualize calibration and homography transformations.

This script shows how the dart board image looks after calibration points are detected
and homography matrix transformations are applied.
"""
import logging
from pathlib import Path

from src.demo.visualizer.calibration_visualizer import CalibrationVisualizer
from src.models.detection_models import IMAGES_PATH


def main() -> None:
    """Run the calibration visualization demo."""
    default_image = "img_3.png"
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    print("=== Dart Board Calibration Visualization Demo ===")
    print("This demo shows how the image looks after calibration and homography transformations.")
    print()

    visualizer = CalibrationVisualizer()

    while True:
        print("\nEnter an image number (e.g. 1, 2, 7), or press Enter for the default image (img_3.png):")
        print("To exit enter 'q', 'exit' or 'quit':")

        choice = input().strip().lower()
        if choice in ["q", "exit", "quit"]:
            print("Program is exiting.")
            break

        if choice == "":
            selected_image = IMAGES_PATH / default_image
        else:
            img_num = int(choice)
            selected_image = IMAGES_PATH / f"img_{img_num}.png"

        if not Path.exists(selected_image):
            print(f"Error: Image file '{selected_image}' not found!")
            continue

        visualizer.show_simple_transformation(selected_image)


if __name__ == "__main__":
    main()

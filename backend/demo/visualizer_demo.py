"""Demo running visualization of dart board calibration."""

import logging
from pathlib import Path

from backend import IMAGE_PATH
from detector.entrypoint.calibration_visualizer import CalibrationVisualizer


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
            selected_image = IMAGE_PATH / default_image
        else:
            img_num = int(choice)
            selected_image = IMAGE_PATH / f"img_{img_num}.png"

        if not Path.exists(selected_image):
            print(f"Error: Image file '{selected_image}' not found!")
            continue

        visualizer.visualize(selected_image)


if __name__ == "__main__":
    main()

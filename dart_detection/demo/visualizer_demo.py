"""Demo running visualization of dart board calibration."""

import argparse
import logging
import re
from pathlib import Path

from dart_detection import IMAGE_PATH
from detector.entrypoint.calibration_visualizer import CalibrationVisualizer


def __natural_sort_key(path: Path) -> tuple[int, int | str]:
    match = re.search(r"img_(\d+)\.png", path.name)
    if match:
        return 0, int(match.group(1))
    return 1, path.name


def list_available_images() -> None:
    """List all available PNG images in the IMAGE_PATH folder."""
    print("Available images in the folder:")
    png_files = list(IMAGE_PATH.glob("*.png"))

    if png_files:
        for image_file in sorted(png_files, key=__natural_sort_key):
            print(f"  - {image_file.name}")
        print(f"\nTotal: {len(png_files)} image(s) found")
    else:
        print("  No PNG images found in the folder.")
    print(f"Image folder path: {IMAGE_PATH}")


def main() -> None:
    """Run the calibration visualization demo."""
    parser = argparse.ArgumentParser(description="Run Dart Board Calibration Visualization demo.")
    parser.add_argument(
        "--image_path",
        type=str,
        help="Path to a specific image file for calibration visualization. If not provided, runs in interactive mode.",
    )
    parser.add_argument("--list", action="store_true", help="List all available PNG images in the images folder and exit.")
    args = parser.parse_args()

    if args.list:
        list_available_images()
        return

    image_path = Path(args.image_path) if args.image_path else None

    default_image = "img_3.png"
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    print("=== Dart Board Calibration Visualization Demo ===")
    print("This demo shows how the image looks after calibration and homography transformations.")
    print()

    visualizer = CalibrationVisualizer()

    if image_path:
        if not image_path.exists():
            print(f"Error: Image file '{image_path}' not found!")
            return
        print(f"Processing image: {image_path}")
        visualizer.visualize(image_path)
        return

    while True:
        print("\nEnter an image number (e.g. 1, 2, 7), or press Enter for the default image (img_3.png):")
        print("Enter 'list' to see all available images.")
        print("To exit enter 'q', 'exit' or 'quit':")

        choice = input().strip().lower()
        if choice in ["q", "exit", "quit"]:
            print("Program is exiting.")
            break

        if choice == "list":
            list_available_images()
            continue

        if choice == "":
            selected_image = IMAGE_PATH / default_image
        else:
            try:
                img_num = int(choice)
                selected_image = IMAGE_PATH / f"img_{img_num}.png"
            except ValueError:
                print("Error: Please enter a valid number, 'list', or press Enter for default.")
                continue

        if not selected_image.exists():
            print(f"Error: Image file '{selected_image}' not found!")
            continue

        visualizer.visualize(selected_image)


if __name__ == "__main__":
    main()

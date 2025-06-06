"""Demo running visualization of dart board calibration."""

import argparse
import logging
import re
from pathlib import Path
from typing import List

from detector.entrypoint.calibration_visualizer import CalibrationVisualizer
from detector.model.configuration import ProcessingConfig


def __natural_sort_key(path: Path) -> tuple[int, int | str]:
    match = re.search(r"img_(\d+)\.png", path.name)
    if match:
        return 0, int(match.group(1))
    return 1, path.name


def list_available_images(image_folder: Path) -> None:
    """List all available images in the specified folder."""
    print("Available images in the folder:")
    image_extensions = ["*.png", "*.jpg", "*.jpeg", "*.bmp", "*.tiff"]
    image_files: List[Path] = []

    for ext in image_extensions:
        image_files.extend(image_folder.glob(ext))

    if image_files:
        for image_file in sorted(image_files, key=__natural_sort_key):
            print(f"  - {image_file.name}")
        print(f"\nTotal: {len(image_files)} image(s) found")
    else:
        print("  No image files found in the folder.")
    print(f"Image folder path: {image_folder}")


def main() -> None:  # noqa: C901
    """Run the calibration visualization demo."""
    parser = argparse.ArgumentParser(description="Run Dart Board Calibration Visualization demo.")
    parser.add_argument(
        "--image_path",
        type=str,
        help="Path to a specific image file for calibration visualization. If not provided, runs in interactive mode.",
    )
    parser.add_argument("--list", action="store_true", help="List all available PNG images in the images folder and exit.")
    parser.add_argument("--config_path", type=str, default=None, help="Path to JSON config file for dart detection")
    parser.add_argument("--image_folder", type=str, default=".", help="Path to the folder containing dart images")
    args = parser.parse_args()

    image_folder = Path(args.image_folder)
    config_path = Path(args.config_path) if args.config_path else None

    if args.list:
        list_available_images(image_folder)
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

    visualizer = CalibrationVisualizer(ProcessingConfig.from_json(config_path) if config_path else None)

    if image_path:
        if image_path.exists():
            print(f"Processing image: {image_path}")
            visualizer.visualize(image_path)
            return
        fallback_path = image_folder / image_path.name
        if fallback_path.exists():
            print(f"Processing image with fallback: {fallback_path}")
            visualizer.visualize(fallback_path)
            return
        print(f"Error: Image file '{image_path}' not found, and fallback '{fallback_path}' also not found!")
        return

    while True:
        print("\nEnter an image number (e.g. 1, 2, 7), with img scheme (img_x.png) or enter the full file name:")
        print("Enter 'list' to see all available images.")
        print("To exit enter 'q', 'exit' or 'quit':")

        choice = input().strip().lower()
        if choice in ["q", "exit", "quit"]:
            print("Program is exiting.")
            break

        if choice == "list":
            list_available_images(image_folder)
            continue

        if choice == "":
            selected_image = image_folder / default_image
        else:
            try:
                img_num = int(choice)
                selected_image = image_folder / f"img_{img_num}.png"
            except ValueError:
                selected_image = image_folder / choice

        if not selected_image.exists():
            print(f"Error: Image file '{selected_image}' not found!")
            continue

        visualizer.visualize(selected_image)


if __name__ == "__main__":
    main()

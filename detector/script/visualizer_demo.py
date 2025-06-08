"""Demo running visualization of dart board calibration."""

import logging
import re
from pathlib import Path
from typing import List

import click
from pydanclick import from_pydantic

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


@click.command()
@click.option("--list", is_flag=True, help="List all available images in the target folder and exit.")
@click.option(
    "--config_path", type=click.Path(exists=True, path_type=Path), default=None, help="Path to JSON config file for dart detection"
)
@click.argument("target", type=click.Path(exists=True, path_type=Path), default=".")
@from_pydantic("config", ProcessingConfig)
def main(list: bool, config_path: Path | None, target: Path, config: ProcessingConfig) -> None:
    """
    Run the calibration visualization demo.

    TARGET: Path to either an image file or folder containing dart images (default: current directory)
    """
    if target.is_file():
        image_path = target
        image_folder = target.parent
    else:
        image_path = None
        image_folder = target

    if list:
        list_available_images(image_folder)
        return

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    print("=== Dart Board Calibration Visualization Demo ===")
    print("This demo shows how the image looks after calibration and homography transformations.")
    print()
    visualizer = CalibrationVisualizer(ProcessingConfig.from_json(config_path) if config_path else None)

    if image_path:
        print(f"Processing single image: {image_path}")
        visualizer.visualize(image_path)
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

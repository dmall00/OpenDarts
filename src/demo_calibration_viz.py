"""
Demo script to visualize calibration and homography transformations.
This script shows how the dart board image looks after calibration points are detected
and homography matrix transformations are applied.
"""

import logging
import os
import sys

# Add the src directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import DartScoringApp
from utils.calibration_visualizer import CalibrationVisualizer


def main():
    # Set up logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    print("=== Dart Board Calibration Visualization Demo ===")
    print("This demo shows how the image looks after calibration and homography transformations.")
    print()

    # Initialize the dart scoring app
    try:
        print("Initializing dart scoring app...")
        app = DartScoringApp("weights.pt")
        print("✓ App initialized successfully")
    except Exception as e:
        print(f"✗ Failed to initialize app: {e}")
        return

    # Initialize the visualizer
    visualizer = CalibrationVisualizer()

    # Loop until the user decides to exit
    while True:
        print("\nGib eine Bildnummer ein (z.B. 1, 2, 7), oder drücke Enter für das Standardbild (img_3.png):")
        print("Zum Beenden gib 'q', 'exit' oder 'quit' ein:")

        try:
            choice = input().strip().lower()
            if choice in ["q", "exit", "quit"]:
                print("Programm wird beendet.")
                break

            if choice == "":
                selected_image = "data/img_3.png"
            else:
                try:
                    img_num = int(choice)
                    selected_image = f"data/img_{img_num}.png"
                except ValueError:
                    print("Ungültige Eingabe, Standardbild wird verwendet")
                    selected_image = "data/img_3.png"
        except Exception:
            print("Unerwarteter Fehler bei der Eingabe, Standardbild wird verwendet")
            selected_image = "data/img_3.png"

        if not os.path.exists(selected_image):
            print(f"Fehler: Bilddatei '{selected_image}' nicht gefunden!")
            continue

        try:
            visualizer.show_simple_transformation(selected_image, app)
        except Exception as e:
            print(f"Fehler während der Visualisierung: {e}")
            logging.error(f"Visualization error: {e}", exc_info=True)


if __name__ == "__main__":
    main()

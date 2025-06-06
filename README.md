# 🎯 Dart Detection

A Python package for dart detection and scoring using computer vision and YOLO models. This package provides both
programmatic APIs and command-line tools for detecting darts in images and calculating scores with high accuracy.

## ✨ Features

- **🎯 High-accuracy dart detection** using YOLO-based computer vision models
- **📊 Automatic scoring calculation** with dartboard calibration
- **⚙️ Configurable processing pipeline** with customizable settings
- **🖥️ Command-line tools** for quick dart scoring and calibration visualization
- **📦 Easy installation** via PyPI or uv package manager

## 🚀 Installation

Install from PyPI:

```bash
pip install dart-detection
```

Or using uv:

```bash
uv add dart-detection
```

## 📖 Quick Start

### **Basic Dart Detection from Image Path**

```python
from dart_detection.model.configuration import ProcessingConfig
from dart_detection.entrypoint.dart_image_scorer import DartImageScorer

# Use default configuration
scorer = DartImageScorer()
result = scorer.detect_darts("path/to/your/dart_image.jpg")

# Or with custom configuration
config = ProcessingConfig(
    # Add your custom settings here
    confidence_threshold=0.7,
    image_size=(640, 640)
)

scorer = DartImageScorer(config)
result = scorer.detect_darts("image.jpg")
print(f"Detected {len(result.detections)} darts with total score: {result.total_score}")
```

### **Advanced Usage with Raw Images**

For more control over the detection pipeline, use the `DartDetectionService` directly:

```python
import numpy as np
from dart_detection.service.dart_detection_service import DartDetectionService
from dart_detection.model.configuration import ProcessingConfig

# Load your image as numpy array
image = np.array(...)  # Your image data

# Initialize service
config = ProcessingConfig()
detection_service = DartDetectionService(config)

# Detect and score darts
result = detection_service.detect_and_score(image)
```

## 🛠️ Command Line Tools

The package includes two convenient command-line tools:

### **Dart Scorer CLI**

Score darts in images directly from the command line:

```bash
dart-image-scorer --help
```

### **Calibration Visualizer**

Visualize dartboard calibration and detection results:

```bash
dart-calibration-visualizer --help
```
An example can be seen below.

## 🎯 How It Works

The dart detection system uses a multi-stage pipeline:

1. **Image Preprocessing** - Optimizes input images for better model performance
2. **YOLO Detection** - Identifies dart locations using trained computer vision models
3. **Calibration** - Maps detected coordinates to dartboard scoring regions
4. **Scoring** - Calculates final scores based on dart positions

![Dart board transfomration](doc/images/visualization_example.png)
*Visualization of homogenous dartboard transformation with detected objects and scoring*

## 🙏 Acknowledgments

- Built with [Ultralytics YOLO](https://github.com/ultralytics/ultralytics) for object detection
- Uses OpenCV for image processing and computer vision operations
- Dart detection model and portions of the codebase adapted from [dart-sense](https://github.com/bnww/dart-sense) -
  special thanks to the original contributor for their excellent work on dart detection algorithms.

# 🎯 Dart Detection

A Python package for dart detection and scoring using computer vision and YOLO models. This package provides both
programmatic APIs and command-line tools for detecting darts in images and calculating scores with high accuracy.

Unlike other dart detection solutions on GitHub, this package is not designed to be a full-fledged dart game detection
service.
Instead, it focuses on providing interfaces for detecting darts in images and calculating scores, which can be
integrated into larger applications.
It is built with simplicity and ease of use in mind, allowing developers to quickly implement dart detection features
without needing to understand the underlying complexities of computer vision.

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

### **Basic Dart Detection from Image Path With Image Preprocessing**

```python
from dart_detection.model.configuration import ProcessingConfig
from dart_detection.entrypoint.dart_image_scorer import DartImageScorerPipeline

config = ProcessingConfig(
  confidence_threshold=0.7
)

scorer = DartImageScorerPipeline(config)
result = scorer.detect_darts("image.jpg")
print(f"Detected {len(result.detections)} darts with total score: {result.total_score}")
```

### **Usage with Raw Images**

For more control over the detection pipeline, use the `DartDetectionService` directly:

```python
import cv2
from detector.entrypoint.service.complete_dart_scoring_service import CompleteDartScoringService
from dart_detection.model.configuration import ProcessingConfig

image = cv2.imread("my_dart_image.jpg")

config = ProcessingConfig()
detection_service = CompleteDartScoringService(config)

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

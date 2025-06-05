# Dart Detection

A Python package for dart detection and scoring using computer vision and YOLO models.

## Features

## Installation

Install from PyPI:

```bash
pip install dart-detection
```

Or using uv:

```bash
uv add dart-detection
```

## Quick Start

### Basic Dart Detection

```python
from detector.entrypoint.dart_image_scorer import DartImageScorer
from pathlib import Path

# Initialize the scorer
scorer = DartImageScorer()

# Detect darts in an image
result = scorer.detect_darts("path/to/your/dart_image.jpg")

print(f"Detected {len(result.darts)} darts")
for dart in result.darts:
    print(f"Dart at position: {dart.position}, Score: {dart.score}")
```

### Using Configuration

```python
from detector.model.configuration import ProcessingConfig
from detector.entrypoint.dart_image_scorer import DartImageScorer

# Custom configuration
config = ProcessingConfig(
    # Add your custom settings here
)

scorer = DartImageScorer(config)
result = scorer.detect_darts("image.jpg")
```

## Acknowledgments

- Built with [Ultralytics YOLO](https://github.com/ultralytics/ultralytics)
- Uses OpenCV for image processing

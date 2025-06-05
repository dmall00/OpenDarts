"""Basic YOLO inference script."""

import cv2
from ultralytics import YOLO

from dart_detection import IMAGE_PATH
from detector.model import MODEL_PATH
from detector.util.file_utils import resize_image

model = YOLO(str(MODEL_PATH / "dartboard_detection.pt"))
image_path = str(IMAGE_PATH / "img_11.png")
image = cv2.imread(image_path)
results = model(resize_image(image=image))
results[0].show()

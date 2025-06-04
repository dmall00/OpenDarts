import cv2
from ultralytics import YOLO

from src.utils.file_utils import resize_image

model = YOLO("best.pt")
image_path = "../../images/img_11.png"
image = cv2.imread(image_path)
results = model(resize_image(image=image))
results[0].show()

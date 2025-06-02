from ultralytics import YOLO
import cv2

model = YOLO("weights.pt")
image_path = "data/img_1.png"
image = cv2.imread(image_path)
results = model(image)
results[0].show()

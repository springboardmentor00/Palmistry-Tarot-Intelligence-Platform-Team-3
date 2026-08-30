from ultralytics import YOLO
import os

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "runs",
    "palm_lines-3",
    "weights",
    "best.pt"
)

IMAGE_PATH = os.path.join(
    BASE_DIR,
    "test_images",
    "hand.jpeg"
)

model = YOLO(MODEL_PATH)

results = model.predict(
    source=IMAGE_PATH,
    save=True,
    conf=0.25
)

print("Prediction completed!")
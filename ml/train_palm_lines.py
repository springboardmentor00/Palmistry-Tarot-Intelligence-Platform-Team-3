import os
from ultralytics import YOLO

# Get the main project directory
BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

# Dataset YAML path
DATA_YAML = os.path.join(
    BASE_DIR,
    "datasets",
    "data.yaml"
)

print("datasets:", DATA_YAML)

# Load YOLOv8 Pose model
model = YOLO("yolov8n-pose.pt")

# Train
results = model.train(
    data=DATA_YAML,
    epochs=10,
    imgsz=640,
    batch=8,
    project=os.path.join(BASE_DIR, "runs"),
    name="palm_lines"
)

print("Training completed!")
from ultralytics import YOLO
import numpy as np
import os
import sys

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

IMAGE_NAME = (
    sys.argv[1]
    if len(sys.argv) > 1
    else "my_palm.jpg"
)

IMAGE_PATH = os.path.join(
    BASE_DIR,
    "test_images",
    IMAGE_NAME
)

print("Predicting:", IMAGE_PATH)

model = YOLO(MODEL_PATH)

results = model.predict(
    source=IMAGE_PATH,
    conf=0.50,
    verbose=False
)

result = results[0]

class_names = model.names

print("\n===== PALM LINE DETECTION =====")

if result.keypoints is None:
    print("No keypoints detected.")
    sys.exit()

keypoints = result.keypoints.xy.cpu().numpy()

classes = result.boxes.cls.cpu().numpy().astype(int)

confidences = result.boxes.conf.cpu().numpy()


# Store only the highest-confidence detection
# for each palm-line class
best_detections = {}

for i in range(len(classes)):

    class_id = classes[i]
    confidence = confidences[i]

    if (
        class_id not in best_detections
        or confidence > best_detections[class_id]["confidence"]
    ):
        best_detections[class_id] = {
            "index": i,
            "confidence": confidence
        }


# Print one detection per class
for class_id, data in best_detections.items():

    i = data["index"]

    class_name = class_names[class_id]

    points = keypoints[i]

    # Calculate approximate line length
    length = 0

    for j in range(len(points) - 1):

        x1, y1 = points[j]
        x2, y2 = points[j + 1]

        distance = np.sqrt(
            (x2 - x1) ** 2 +
            (y2 - y1) ** 2
        )

        length += distance

    print(
        f"{class_name.upper():6} | "
        f"confidence = {confidences[i]:.2f} | "
        f"length = {length:.2f} pixels"
    )

print("completed")
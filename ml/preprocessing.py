import cv2
import numpy as np

IMAGE_SIZE = (224, 224)


def preprocess_image(image_path):
    """
    Loads, resizes and normalizes a hand image.
    """

    image = cv2.imread(image_path)

    if image is None:
        raise ValueError(
            f"Could not read image: {image_path}"
        )

    # OpenCV BGR -> RGB
    image = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2RGB
    )

    # Resize
    image = cv2.resize(
        image,
        IMAGE_SIZE
    )

    # Convert to float
    image = image.astype(
        np.float32
    )

    # Normalize pixels
    image = image / 255.0

    return image
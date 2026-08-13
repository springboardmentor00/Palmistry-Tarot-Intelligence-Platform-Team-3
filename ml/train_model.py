import os
import json
import joblib
import numpy as np
import pandas as pd
import tensorflow as tf

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report

from tensorflow.keras import layers
from tensorflow.keras import models
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.callbacks import ModelCheckpoint



# PATHS


# Dataset CSV
DATASET_PATH = "datasets/HandInfo.csv"

# YOUR images are inside this folder
IMAGE_FOLDER = "datasets/Hands"

# ML models will be stored here
MODEL_FOLDER = "ml/models"

MODEL_PATH = os.path.join(
    MODEL_FOLDER,
    "palm_hand_model.keras"
)

ENCODER_PATH = os.path.join(
    MODEL_FOLDER,
    "label_encoder.pkl"
)

CLASS_NAMES_PATH = os.path.join(
    MODEL_FOLDER,
    "class_names.json"
)



# SETTINGS


IMAGE_SIZE = (224, 224)

BATCH_SIZE = 32

EPOCHS = 10

# Label available in HandInfo.csv
TARGET_COLUMN = "aspectOfHand"



# 1. LOAD DATASET



print("LOADING HAND DATASET")

if not os.path.exists(DATASET_PATH):

    raise FileNotFoundError(
        f"Dataset not found: {DATASET_PATH}"
    )

df = pd.read_csv(DATASET_PATH)

print("Dataset loaded successfully!")

print("Number of rows:", len(df))

print("Columns:")

print(df.columns.tolist())



# 2. CHECK REQUIRED COLUMNS


if "imageName" not in df.columns:

    raise ValueError(
        "imageName column not found in HandInfo.csv"
    )


if TARGET_COLUMN not in df.columns:

    raise ValueError(
        f"{TARGET_COLUMN} column not found in HandInfo.csv"
    )



# 3. CREATE IMAGE PATHS



print("CHECKING HAND IMAGES")


print(
    "Image folder:",
    IMAGE_FOLDER
)


if not os.path.exists(IMAGE_FOLDER):

    raise FileNotFoundError(
        f"""
Image folder not found:

{IMAGE_FOLDER}

Check that your images are inside:

datasets/Hands/Hands/
"""
    )


df["image_path"] = df["imageName"].apply(
    lambda x: os.path.join(
        IMAGE_FOLDER,
        str(x)
    )
)



# 4. CHECK WHICH IMAGES EXIST


df["image_exists"] = df["image_path"].apply(
    os.path.exists
)

total = len(df)

found = int(
    df["image_exists"].sum()
)

missing = total - found

print("\nTotal CSV records:", total)

print("Images found:", found)

print("Images missing:", missing)


if found == 0:

    print("\nNO IMAGES FOUND!")

    print(
        "Expected example:"
    )

    print(
        "datasets/Hands/Hands/Hand_0000002.jpg"
    )

    raise SystemExit


# Remove rows for missing images

df = df[
    df["image_exists"] == True
].copy()



# 5. DISPLAY LABELS



print("PREPARING LABELS")


print(
    "\nTarget column:",
    TARGET_COLUMN
)

print("\nAvailable labels:")

print(
    df[TARGET_COLUMN].value_counts()
)



# 6. ENCODE LABELS


label_encoder = LabelEncoder()

df["label"] = label_encoder.fit_transform(
    df[TARGET_COLUMN].astype(str)
)


print("\nEncoded labels:")

for number, name in enumerate(
    label_encoder.classes_
):

    print(
        number,
        "->",
        name
    )



# 7. TRAIN / TEST SPLIT



print("SPLITTING DATA")


train_df, test_df = train_test_split(

    df,

    test_size=0.20,

    random_state=42,

    stratify=df["label"]
)


print(
    "Training images:",
    len(train_df)
)

print(
    "Testing images:",
    len(test_df)
)



# 8. CREATE TENSORFLOW DATASET


def create_dataset(
    dataframe,
    shuffle=False
):

    image_paths = dataframe[
        "image_path"
    ].values

    labels = dataframe[
        "label"
    ].values.astype(
        np.int32
    )


    def load_image(
        path,
        label
    ):

        image = tf.io.read_file(
            path
        )

        image = tf.image.decode_image(
            image,
            channels=3,
            expand_animations=False
        )

        image = tf.image.resize(
            image,
            IMAGE_SIZE
        )

        image = tf.cast(
            image,
            tf.float32
        )

        image = image / 255.0

        return image, label


    dataset = tf.data.Dataset.from_tensor_slices(
        (
            image_paths,
            labels
        )
    )


    if shuffle:

        dataset = dataset.shuffle(
            buffer_size=len(dataframe)
        )


    dataset = dataset.map(
        load_image,
        num_parallel_calls=tf.data.AUTOTUNE
    )


    dataset = dataset.batch(
        BATCH_SIZE
    )


    dataset = dataset.prefetch(
        tf.data.AUTOTUNE
    )


    return dataset


train_dataset = create_dataset(
    train_df,
    shuffle=True
)


test_dataset = create_dataset(
    test_df,
    shuffle=False
)



# 9. BUILD MODEL



print("BUILDING MODEL")



number_of_classes = len(
    label_encoder.classes_
)


# MobileNetV2 pretrained model

base_model = MobileNetV2(

    input_shape=(
        224,
        224,
        3
    ),

    include_top=False,

    weights="imagenet"
)


# Freeze pretrained layers

base_model.trainable = False


# Our classification model

model = models.Sequential([

    layers.Input(
        shape=(
            224,
            224,
            3
        )
    ),

    base_model,

    layers.GlobalAveragePooling2D(),

    layers.Dense(
        128,
        activation="relu"
    ),

    layers.Dropout(
        0.3
    ),

    layers.Dense(
        number_of_classes,
        activation="softmax"
    )
])



# 10. COMPILE MODEL


model.compile(

    optimizer="adam",

    loss="sparse_categorical_crossentropy",

    metrics=[
        "accuracy"
    ]
)


print("\nModel created successfully!")

model.summary()



# 11. CREATE MODEL FOLDER


os.makedirs(
    MODEL_FOLDER,
    exist_ok=True
)



# 12. CALLBACKS


checkpoint = ModelCheckpoint(

    MODEL_PATH,

    monitor="val_accuracy",

    save_best_only=True,

    mode="max"
)


early_stopping = EarlyStopping(

    monitor="val_loss",

    patience=3,

    restore_best_weights=True
)



# 13. TRAIN MODEL



print("STARTING TRAINING")



history = model.fit(

    train_dataset,

    validation_data=test_dataset,

    epochs=EPOCHS,

    callbacks=[
        checkpoint,
        early_stopping
    ]

)



# 14. EVALUATE MODEL



print("EVALUATING MODEL")



loss, accuracy = model.evaluate(
    test_dataset
)


print(
    "\nTest Loss:",
    loss
)

print(
    "Test Accuracy:",
    accuracy
)



# 15. CLASSIFICATION REPORT


print("CLASSIFICATION REPORT")



predictions = model.predict(
    test_dataset
)


predicted_labels = np.argmax(
    predictions,
    axis=1
)


actual_labels = test_df[
    "label"
].values


print(
    classification_report(
        actual_labels,
        predicted_labels,
        target_names=label_encoder.classes_,
        zero_division=0
    )
)



# 16. SAVE LABEL ENCODER


joblib.dump(

    label_encoder,

    ENCODER_PATH
)



# 17. SAVE CLASS NAMES


with open(
    CLASS_NAMES_PATH,
    "w"
) as file:

    json.dump(
        label_encoder.classes_.tolist(),
        file,
        indent=4
    )



# 18. FINISHED



print("TRAINING COMPLETED")


print(
    "\nModel saved at:"
)

print(
    MODEL_PATH
)

print(
    "\nEncoder saved at:"
)

print(
    ENCODER_PATH
)

print(
    "\nClass names saved at:"
)

print(
    CLASS_NAMES_PATH
)
import os
import json
import numpy as np
import pandas as pd

from PIL import Image
from tensorflow.keras.models import load_model



# PATHS


BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "ml",
    "models",
    "palm_hand_model.keras"
)

CLASS_NAMES_PATH = os.path.join(
    BASE_DIR,
    "ml",
    "models",
    "class_names.json"
)

TAROT_PATH = os.path.join(
    BASE_DIR,
    "datasets",
    "tarot_card_meanings.csv"
    
)

# LOAD PALM MODEL


print("Loading palm model...")

model = load_model(MODEL_PATH)

print("Palm model loaded successfully!")

# LOAD CLASS NAMES


with open(
    CLASS_NAMES_PATH,
    "r",
    encoding="utf-8"
) as file:

    class_names = json.load(file)

print("Classes:", class_names)



# LOAD TAROT DATASET


print("\nLoading Tarot dataset...")

tarot_df = pd.read_csv(TAROT_PATH)

print(
    "Tarot cards loaded:",
    len(tarot_df)
)

print(
    "Columns:",
    list(tarot_df.columns)
)


# PREDICT HAND TYPE

def predict_hand(image_path):

    print("\nAnalyzing image:")
    print(image_path)

    # LOAD IMAGE

    image = Image.open(
        image_path
    ).convert("RGB")
    # RESIZE IMAGE


    image = image.resize(
        (224, 224)
    )
    # CONVERT TO NUMPY
    

    image_array = np.array(
        image
    ).astype("float32")

   
    # NORMALIZE
    

    image_array = (
        image_array / 255.0
    )

   
    # ADD BATCH DIMENSION
   

    image_array = np.expand_dims(
        image_array,
        axis=0
    )

    
    # MODEL PREDICTION
  

    prediction = model.predict(
        image_array,
        verbose=0
    )

    print(
        "Raw prediction:",
        prediction
    )

  
    # CURRENT MODEL HAS ONLY ONE CLASS
  

    if len(class_names) == 1:

        predicted_class = class_names[0]

        confidence = 1.0

    else:

        predicted_index = int(
            np.argmax(prediction[0])
        )

        predicted_class = (
            class_names[
                predicted_index
            ]
        )

        confidence = float(
            prediction[0][
                predicted_index
            ]
        )

    return {
        "hand_type": predicted_class,
        "confidence": confidence
    }


# ============================================================
# SELECT TAROT CARD
# ============================================================

def select_tarot_card():

    """
    CURRENT VERSION:

    Randomly selects one Tarot card from
    tarot_card_meanings.csv.

    IMPORTANT:
    This is NOT a machine-learning prediction.

    Later, this can be replaced with a model
    trained using palm-image -> tarot-card labels.
    """

    card = tarot_df.sample(
        1
    ).iloc[0]

    return card



# GET TAROT READING

def get_tarot_reading():

    card = select_tarot_card()

    
    # SAFELY GET VALUES FROM CSV

    card_number = card.get(
        "card_number",
        ""
    )

    card_name = card.get(
        "card_name",
        ""
    )

    arcana = card.get(
        "arcana",
        ""
    )

    suit = card.get(
        "suit",
        ""
    )

    element = card.get(
        "element",
        ""
    )

    upright_meaning = card.get(
        "upright_meaning",
        ""
    )

    love_meaning = card.get(
        "love_meaning",
        ""
    )

    career_meaning = card.get(
        "career_meaning",
        ""
    )

    yes_or_no = card.get(
        "yes_or_no",
        ""
    )

    zodiac_sign = card.get(
        "zodiac_sign",
        ""
    )

    guide_url = card.get(
        "guide_url",
        ""
    )

    return {

        "card_number":
            str(card_number),

        "card_name":
            str(card_name),

        "arcana":
            str(arcana),

        "suit":
            str(suit),

        "element":
            str(element),

        "general_meaning":
            str(upright_meaning),

        "love_meaning":
            str(love_meaning),

        "career_meaning":
            str(career_meaning),

        "yes_or_no":
            str(yes_or_no),

        "zodiac_sign":
            str(zodiac_sign),

        "guide_url":
            str(guide_url)
    }



# COMPLETE PALM + TAROT ANALYSIS

def analyze_palm_with_tarot(
    image_path
):

   
    # STEP 1
    # IMAGE → ML MODEL

    hand_prediction = predict_hand(
        image_path
    )

    # STEP 2
    # SELECT TAROT CARD

    tarot_reading = get_tarot_reading()

   
    # STEP 3
    # COMBINE RESULTS
 

    result = {

        "hand_analysis": {

            "hand_type":
                hand_prediction[
                    "hand_type"
                ],

            "confidence":
                hand_prediction[
                    "confidence"
                ]
        },

        "tarot_reading":
            tarot_reading
    }

    return result



# MAIN PROGRAM


if __name__ == "__main__":

    print("\n")
    print("=" * 55)
    print("        PALM + TAROT ANALYSIS")
    print("=" * 55)


   
    # TEST IMAGE
   

    TEST_IMAGE = os.path.join(
        BASE_DIR,
        "datasets",
        
        # "Hands",
        "test.jpg"
    )


  
    # CHECK IMAGE
    

    if not os.path.exists(
        TEST_IMAGE
    ):

        print("\nERROR!")
        print(
            "Test image was not found."
        )

        print("\nExpected location:")
        print(TEST_IMAGE)

        print("\nPlease put one image here:")
        print(
            "datasets/Hands/test.jpg"
        )

        exit()


   
    # RUN ANALYSIS
    

    result = analyze_palm_with_tarot(
        TEST_IMAGE
    )


    
    # PALM RESULT
    
    hand = result[
        "hand_analysis"
    ]

    print("\n")
    print("=" * 55)
    print("             PALM ANALYSIS")
    print("=" * 55)

    print(
        "\n🖐 Hand Type:"
    )

    print(
        hand[
            "hand_type"
        ]
    )

    print(
        "\nConfidence:"
    )

    print(
        f"{hand['confidence'] * 100:.2f}%"
    )


   
    # TAROT RESULT
    

    tarot = result[
        "tarot_reading"
    ]

    print("\n")
    print("=" * 55)
    print("             🔮 TAROT READING")
    print("=" * 55)

    print(
        "\n🃏 Tarot Card:"
    )

    print(
        tarot[
            "card_name"
        ]
    )

    print(
        "\n🔮 Arcana:"
    )

    print(
        tarot[
            "arcana"
        ]
    )

    print(
        "\n🌿 Element:"
    )

    print(
        tarot[
            "element"
        ]
    )

    print(
        "\n♈ Zodiac Sign:"
    )

    print(
        tarot[
            "zodiac_sign"
        ]
    )

    print(
        "\n❤️ Love / Relationship:"
    )

    print(
        tarot[
            "love_meaning"
        ]
    )

    print(
        "\n💼 Career:"
    )

    print(
        tarot[
            "career_meaning"
        ]
    )

    print(
        "\n✅ Yes / No:"
    )

    print(
        tarot[
            "yes_or_no"
        ]
    )

    print(
        "\n✨ Overall Meaning:"
    )

    print(
        tarot[
            "general_meaning"
        ]
    )

    print("\n")
    print("=" * 55)
    print("          ANALYSIS COMPLETED")
    print("=" * 55)

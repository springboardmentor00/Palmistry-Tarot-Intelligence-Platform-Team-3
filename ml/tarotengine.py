import pandas as pd
import os
import random

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TAROT_FILE = os.path.join(
    BASE_DIR,
    "datasets",
    "tarot_card_meanings.csv"
)

# Load Tarot dataset
tarot_df = pd.read_csv(TAROT_FILE)

print(f"Tarot cards loaded: {len(tarot_df)}")


def choose_card(focus):
    """
    Select a Tarot card based on the palm reading focus.
    """

    if focus == "Love and Emotional Life":
        suitable = tarot_df[
            tarot_df["love_meaning"].notna()
        ]

    elif focus == "Career and Decisions":
        suitable = tarot_df[
            tarot_df["career_meaning"].notna()
        ]

    elif focus == "Life Journey and Personal Growth":
        suitable = tarot_df[
            tarot_df["upright_meaning"].notna()
        ]

    else:
        suitable = tarot_df

    if len(suitable) == 0:
        suitable = tarot_df

    return suitable.sample(n=1).iloc[0]


def generate_reading(palm_features):
    """
    Generate a Tarot interpretation based on palm-line features.
    """

    print("\n===== TAROT READING =====")

    heart = palm_features.get("heart", 0)
    head = palm_features.get("head", 0)
    life = palm_features.get("life", 0)
    fate = palm_features.get("fate", 0)

    # Determine main area of reading
    if heart >= head and heart >= life:
        focus = "Love and Emotional Life"

    elif head >= heart and head >= life:
        focus = "Career and Decisions"

    elif life >= heart and life >= head:
        focus = "Life Journey and Personal Growth"

    else:
        focus = "Career and Life Direction"

    # Select Tarot card
    card = choose_card(focus)

    print(f"\nFocus Area: {focus}")

    print(f"Card: {card['card_name']}")

    print(f"Arcana: {card['arcana']}")

    print(f"Suit: {card['suit']}")

    print(f"Element: {card['element']}")

    print("\nLove Meaning:")
    print(card['love_meaning'])

    print("\nCareer Meaning:")
    print(card['career_meaning'])

    print("\nOverall Meaning:")
    print(card['upright_meaning'])

    print("\nYes / No:")
    print(card['yes_or_no'])

    print("tarot prediction")


if __name__ == "__main__":

    # Example palm features
    palm_features = {
        "heart": 96.66,
        "head": 98.14,
        "life": 105.89,
        "fate": 40.79
    }

    generate_reading(palm_features)
# ml/recommendation_engine.py

import pandas as pd
import os


class RecommendationEngine:

    def __init__(self, tarot_csv_path):
        self.tarot_csv_path = tarot_csv_path

        if not os.path.exists(tarot_csv_path):
            raise FileNotFoundError(
                f"Tarot dataset not found: {tarot_csv_path}"
            )

        self.tarot_data = pd.read_csv(tarot_csv_path)

    def get_tarot_data(self, card_name):
        """Find the selected tarot card in the dataset."""

        result = self.tarot_data[
            self.tarot_data["card_name"].str.lower()
            == card_name.lower()
        ]

        if result.empty:
            return None

        return result.iloc[0]

    def analyze_palm(self, heart_line, head_line, career_line):
        """Analyze palm results and identify strengths and improvement areas."""

        strengths = []
        weaknesses = []
        improvements = []
        how_to_improve = []
        tips = []

        # Analyze Heart Line
        heart = heart_line.lower()

        if heart in ["strong", "clear", "good"]:
            strengths.append("Emotional awareness and relationship potential")
        elif heart in ["weak", "unclear", "short"]:
            weaknesses.append("Emotional communication")
            improvements.append("Improve emotional communication")
            how_to_improve.append(
                "Express your feelings clearly and listen carefully to others."
            )
            tips.append(
                "Practice open communication instead of keeping feelings inside."
            )

        # Analyze Head Line
        head = head_line.lower()

        if head in ["strong", "clear", "good"]:
            strengths.append("Clear thinking and decision-making")
        elif head in ["weak", "unclear", "short"]:
            weaknesses.append("Decision-making and concentration")
            improvements.append("Improve focus and decision-making")
            how_to_improve.append(
                "Break large decisions into smaller steps and evaluate them calmly."
            )
            tips.append(
                "Create a daily priority list and focus on one important task at a time."
            )

        # Analyze Career Line
        career = career_line.lower()

        if career in ["strong", "clear", "good"]:
            strengths.append("Career direction and professional confidence")
        elif career in ["weak", "unclear", "short"]:
            weaknesses.append("Career direction and consistency")
            improvements.append("Improve career planning and skill development")
            how_to_improve.append(
                "Set clear career goals and consistently develop relevant skills."
            )
            tips.append(
                "Choose one skill to improve each month and build small projects around it."
            )

        # Provide default information if no result is detected
        if not strengths:
            strengths.append("Potential for personal development")

        if not weaknesses:
            weaknesses.append("No major improvement area identified")

        if not improvements:
            improvements.append(
                "Continue developing your existing strengths"
            )

        if not how_to_improve:
            how_to_improve.append(
                "Maintain your current habits while setting new personal goals."
            )

        if not tips:
            tips.append(
                "Review your goals regularly and track your progress."
            )

        return {
            "strengths": strengths,
            "weaknesses": weaknesses,
            "improvements": improvements,
            "how_to_improve": how_to_improve,
            "tips": tips
        }

    def generate_recommendations(
        self,
        heart_line,
        head_line,
        career_line,
        card_name
    ):
        """Generate personalized recommendations using palm + tarot."""

        # Get palm analysis
        palm_analysis = self.analyze_palm(
            heart_line,
            head_line,
            career_line
        )

        # Get tarot information
        tarot = self.get_tarot_data(card_name)

        if tarot is None:
            tarot_career = "No tarot career meaning available."
            tarot_love = "No tarot relationship meaning available."
            tarot_overall = "No tarot meaning available."
        else:
            tarot_career = str(
                tarot.get("career_meaning", "")
            )

            tarot_love = str(
                tarot.get("love_meaning", "")
            )

            tarot_overall = str(
                tarot.get("upright_meaning", "")
            )

        # Generate career recommendation
        if career_line.lower() in ["strong", "clear", "good"]:
            career_recommendation = (
                "Build on your existing strengths by developing "
                "professional skills and taking meaningful opportunities."
            )
        else:
            career_recommendation = (
                "Focus on career planning, consistency and skill development "
                "before making major professional decisions."
            )

        # Add tarot career meaning
        if tarot_career and tarot_career != "nan":
            career_recommendation += (
                f" Tarot guidance: {tarot_career}"
            )

        # Generate relationship recommendation
        if heart_line.lower() in ["strong", "clear", "good"]:
            relationship_recommendation = (
                "Maintain open communication and strengthen healthy relationships."
            )
        else:
            relationship_recommendation = (
                "Work on expressing emotions clearly, listening actively "
                "and building emotional understanding."
            )

        # Add tarot relationship meaning
        if tarot_love and tarot_love != "nan":
            relationship_recommendation += (
                f" Tarot guidance: {tarot_love}"
            )

        # Generate personal growth recommendation
        if head_line.lower() in ["strong", "clear", "good"]:
            personal_growth = (
                "Use your ability to think clearly by setting goals, "
                "learning consistently and making deliberate decisions."
            )
        else:
            personal_growth = (
                "Focus on concentration, confidence and structured "
                "decision-making."
            )

        # Generate overall guidance
        overall_guidance = (
            "Focus on your identified strengths while gradually improving "
            "the areas that need attention. Use the guidance as a tool "
            "for reflection and personal development."
        )

        return {
            "palm_analysis": palm_analysis,
            "tarot_card": card_name,
            "career_recommendation": career_recommendation,
            "relationship_recommendation":
                relationship_recommendation,
            "personal_growth": personal_growth,
            "overall_guidance": overall_guidance,
            "tarot_overall_meaning":
                tarot_overall
        }


# Test the recommendation engine

if __name__ == "__main__":

    # Get the project root directory
    BASE_DIR = os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )

    # Set the location of the tarot dataset
    TAROT_CSV = os.path.join(
        BASE_DIR,
        "datasets",
        "tarot_card_meanings.csv"
    )

    # Create the recommendation engine
    engine = RecommendationEngine(TAROT_CSV)

    # Test the recommendation system with sample results
    result = engine.generate_recommendations(
        heart_line="strong",
        head_line="clear",
        career_line="weak",
        card_name="The Magician"
    )

    print("\n========== RECOMMENDATION RESULT ==========\n")

    print("🌟 STRENGTHS:")
    for item in result["palm_analysis"]["strengths"]:
        print(" -", item)

    print("\n⚠️ WEAKNESSES:")
    for item in result["palm_analysis"]["weaknesses"]:
        print(" -", item)

    print("\n🎯 AREAS TO IMPROVE:")
    for item in result["palm_analysis"]["improvements"]:
        print(" -", item)

    print("\n🛠️ HOW TO IMPROVE:")
    for item in result["palm_analysis"]["how_to_improve"]:
        print(" -", item)

    print("\n💡 PRACTICAL TIPS:")
    for item in result["palm_analysis"]["tips"]:
        print(" -", item)

    print("\n💼 CAREER:")
    print(result["career_recommendation"])

    print("\n❤️ RELATIONSHIPS:")
    print(result["relationship_recommendation"])

    print("\n🌱 PERSONAL GROWTH:")
    print(result["personal_growth"])

    print("\n🔮 OVERALL GUIDANCE:")
    print(result["overall_guidance"])

    print("\n============================================")
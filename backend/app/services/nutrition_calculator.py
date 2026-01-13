"""
Nutrition Calculator Service
Auto-calculates nutrition values from ingredients
"""

from decimal import Decimal
from typing import List, Dict, Any

from app.schemas import NutritionSummary


# FDA Daily Values (2020 update)
# https://www.fda.gov/food/new-nutrition-facts-label/daily-value-new-nutrition-and-supplement-facts-labels
DAILY_VALUES = {
    "total_fat": Decimal("78"),        # g
    "saturated_fat": Decimal("20"),    # g
    "cholesterol": Decimal("300"),     # mg
    "sodium": Decimal("2300"),         # mg
    "total_carbs": Decimal("275"),     # g
    "dietary_fiber": Decimal("28"),    # g
    "added_sugars": Decimal("50"),     # g
    "vitamin_d": Decimal("20"),        # mcg
    "calcium": Decimal("1300"),        # mg
    "iron": Decimal("18"),             # mg
    "potassium": Decimal("4700"),      # mg
    "vitamin_a": Decimal("900"),       # mcg RAE
    "vitamin_c": Decimal("90"),        # mg
    "vitamin_e": Decimal("15"),        # mg
    "vitamin_k": Decimal("120"),       # mcg
    "thiamin": Decimal("1.2"),         # mg
    "riboflavin": Decimal("1.3"),      # mg
    "niacin": Decimal("16"),           # mg NE
    "vitamin_b6": Decimal("1.7"),      # mg
    "folate": Decimal("400"),          # mcg DFE
    "vitamin_b12": Decimal("2.4"),     # mcg
    "biotin": Decimal("30"),           # mcg
    "pantothenic_acid": Decimal("5"),  # mg
    "phosphorus": Decimal("1250"),     # mg
    "iodine": Decimal("150"),          # mcg
    "magnesium": Decimal("420"),       # mg
    "zinc": Decimal("11"),             # mg
    "selenium": Decimal("55"),         # mcg
    "copper": Decimal("0.9"),          # mg
    "manganese": Decimal("2.3"),       # mg
    "chromium": Decimal("35"),         # mcg
    "molybdenum": Decimal("45"),       # mcg
    "chloride": Decimal("2300"),       # mg
    "choline": Decimal("550"),         # mg
    "protein": Decimal("50"),          # g (not required on label but useful)
}


class NutritionCalculator:
    """
    Calculate nutrition values from product ingredients
    """
    
    @staticmethod
    def calculate_percent_dv(value: Decimal, nutrient: str) -> Decimal:
        """Calculate % Daily Value for a nutrient"""
        if nutrient not in DAILY_VALUES or DAILY_VALUES[nutrient] == 0:
            return Decimal("0")
        return round((value / DAILY_VALUES[nutrient]) * 100, 0)
    
    @staticmethod
    def calculate_from_ingredients(
        ingredients: List[Dict[str, Any]],
        serving_size: Decimal,
        serving_unit: str,
        total_recipe_weight: Decimal
    ) -> NutritionSummary:
        """
        Calculate nutrition per serving from ingredient list
        
        Args:
            ingredients: List of dicts with ingredient data and quantity
            serving_size: Serving size value
            serving_unit: Serving size unit
            total_recipe_weight: Total weight of recipe in grams
        
        Returns:
            NutritionSummary with calculated values
        """
        # Sum up all nutrients from ingredients
        totals = {
            "calories": Decimal("0"),
            "total_fat": Decimal("0"),
            "saturated_fat": Decimal("0"),
            "trans_fat": Decimal("0"),
            "cholesterol": Decimal("0"),
            "sodium": Decimal("0"),
            "total_carbs": Decimal("0"),
            "dietary_fiber": Decimal("0"),
            "total_sugars": Decimal("0"),
            "added_sugars": Decimal("0"),
            "protein": Decimal("0"),
            "vitamin_d": Decimal("0"),
            "calcium": Decimal("0"),
            "iron": Decimal("0"),
            "potassium": Decimal("0"),
        }
        
        for item in ingredients:
            ing = item.get("ingredient", {})
            quantity = Decimal(str(item.get("quantity", 0)))
            per_amount = Decimal(str(ing.get("per_amount", 100)))
            
            # Calculate multiplier based on quantity used
            if per_amount > 0:
                multiplier = quantity / per_amount
            else:
                multiplier = Decimal("0")
            
            # Add each nutrient
            for nutrient in totals.keys():
                value = Decimal(str(ing.get(nutrient, 0)))
                totals[nutrient] += value * multiplier
        
        # Calculate per serving
        if total_recipe_weight > 0:
            serving_multiplier = serving_size / total_recipe_weight
        else:
            serving_multiplier = Decimal("1")
        
        per_serving = {k: round(v * serving_multiplier, 2) for k, v in totals.items()}
        
        # Calculate % Daily Values
        return NutritionSummary(
            serving_size=serving_size,
            serving_unit=serving_unit,
            calories=per_serving["calories"],
            total_fat=per_serving["total_fat"],
            saturated_fat=per_serving["saturated_fat"],
            trans_fat=per_serving["trans_fat"],
            cholesterol=per_serving["cholesterol"],
            sodium=per_serving["sodium"],
            total_carbs=per_serving["total_carbs"],
            dietary_fiber=per_serving["dietary_fiber"],
            total_sugars=per_serving["total_sugars"],
            added_sugars=per_serving["added_sugars"],
            protein=per_serving["protein"],
            vitamin_d=per_serving["vitamin_d"],
            calcium=per_serving["calcium"],
            iron=per_serving["iron"],
            potassium=per_serving["potassium"],
            total_fat_dv=NutritionCalculator.calculate_percent_dv(per_serving["total_fat"], "total_fat"),
            saturated_fat_dv=NutritionCalculator.calculate_percent_dv(per_serving["saturated_fat"], "saturated_fat"),
            cholesterol_dv=NutritionCalculator.calculate_percent_dv(per_serving["cholesterol"], "cholesterol"),
            sodium_dv=NutritionCalculator.calculate_percent_dv(per_serving["sodium"], "sodium"),
            total_carbs_dv=NutritionCalculator.calculate_percent_dv(per_serving["total_carbs"], "total_carbs"),
            dietary_fiber_dv=NutritionCalculator.calculate_percent_dv(per_serving["dietary_fiber"], "dietary_fiber"),
            added_sugars_dv=NutritionCalculator.calculate_percent_dv(per_serving["added_sugars"], "added_sugars"),
            vitamin_d_dv=NutritionCalculator.calculate_percent_dv(per_serving["vitamin_d"], "vitamin_d"),
            calcium_dv=NutritionCalculator.calculate_percent_dv(per_serving["calcium"], "calcium"),
            iron_dv=NutritionCalculator.calculate_percent_dv(per_serving["iron"], "iron"),
            potassium_dv=NutritionCalculator.calculate_percent_dv(per_serving["potassium"], "potassium"),
        )
    
    @staticmethod
    def round_nutrient(value: Decimal, nutrient: str) -> str:
        """
        Round nutrient values according to FDA rounding rules
        https://www.fda.gov/files/food/published/Food-Labeling-Guide-%28PDF%29.pdf
        """
        v = float(value)
        
        # Calories
        if nutrient == "calories":
            if v < 5:
                return "0"
            elif v <= 50:
                return str(round(v / 5) * 5)  # Nearest 5
            else:
                return str(round(v / 10) * 10)  # Nearest 10
        
        # Fat, Carbs, Protein, Fiber
        if nutrient in ["total_fat", "saturated_fat", "trans_fat", "total_carbs", 
                        "dietary_fiber", "total_sugars", "added_sugars", "protein"]:
            if v < 0.5:
                return "0"
            elif v < 5:
                return f"{round(v * 2) / 2}g"  # Nearest 0.5
            else:
                return f"{round(v)}g"  # Nearest 1
        
        # Cholesterol (mg)
        if nutrient == "cholesterol":
            if v < 2:
                return "0mg"
            elif v <= 5:
                return "Less than 5mg"
            else:
                return f"{round(v / 5) * 5}mg"  # Nearest 5
        
        # Sodium (mg)
        if nutrient == "sodium":
            if v < 5:
                return "0mg"
            elif v <= 140:
                return f"{round(v / 5) * 5}mg"  # Nearest 5
            else:
                return f"{round(v / 10) * 10}mg"  # Nearest 10
        
        # Default: 2 decimal places
        return f"{round(v, 2)}"

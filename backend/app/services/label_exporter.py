"""
Label Exporter Service
Generate PNG, PDF, and SVG exports of nutrition labels
"""

import io
from typing import Optional, Dict, Any
from pathlib import Path

# Placeholder imports - implement with actual libraries
# from weasyprint import HTML
# from html2image import Html2Image
# import cairosvg


class LabelExporter:
    """
    Export nutrition labels to various formats
    """
    
    def __init__(self):
        self.template_dir = Path(__file__).parent.parent / "templates" / "labels"
    
    async def render_html(
        self,
        template_data: Dict[str, Any],
        product_data: Dict[str, Any],
        nutrition: Dict[str, Any]
    ) -> str:
        """
        Render label as HTML
        
        Args:
            template_data: Template configuration
            product_data: Product information
            nutrition: Calculated nutrition values
        
        Returns:
            HTML string
        """
        template_type = template_data.get("type", "vertical")
        language = template_data.get("language", "en")
        
        # TODO: Implement Jinja2 template rendering
        # For now, return a placeholder
        html = f"""
        <!DOCTYPE html>
        <html lang="{language}">
        <head>
            <meta charset="UTF-8">
            <style>
                {self._get_label_css(template_data)}
            </style>
        </head>
        <body>
            <div class="nutrition-label" style="width: {template_data.get('width', 400)}px;">
                {self._render_nutrition_box(nutrition, template_data)}
                {self._render_ingredients(product_data, template_data)}
                {self._render_allergens(product_data, template_data)}
            </div>
        </body>
        </html>
        """
        return html
    
    def _get_label_css(self, template_data: Dict[str, Any]) -> str:
        """Generate CSS for label styling"""
        styles = template_data.get("styles", {})
        font_family = styles.get("fontFamily", "Arial, sans-serif")
        
        return f"""
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        .nutrition-label {{
            font-family: {font_family};
            border: 1px solid #000;
            padding: 4px;
            background: #fff;
        }}
        .nutrition-title {{
            font-size: 24px;
            font-weight: 900;
            font-family: "Arial Black", Arial, sans-serif;
            border-bottom: 1px solid #000;
            padding-bottom: 2px;
        }}
        .serving-info {{
            font-size: 12px;
            border-bottom: 8px solid #000;
            padding: 4px 0;
        }}
        .calories-row {{
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            border-bottom: 4px solid #000;
            padding: 4px 0;
        }}
        .calories-label {{
            font-size: 14px;
            font-weight: bold;
        }}
        .calories-value {{
            font-size: 36px;
            font-weight: bold;
        }}
        .nutrient-row {{
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            padding: 2px 0;
            border-bottom: 1px solid #000;
        }}
        .nutrient-row.indent {{
            padding-left: 16px;
        }}
        .nutrient-row.bold {{
            font-weight: bold;
        }}
        .dv-header {{
            font-size: 10px;
            text-align: right;
            border-bottom: 1px solid #000;
            padding: 2px 0;
        }}
        .footnote {{
            font-size: 9px;
            padding-top: 4px;
            border-top: 4px solid #000;
        }}
        .ingredients {{
            font-size: 10px;
            margin-top: 8px;
            line-height: 1.4;
        }}
        .ingredients-label {{
            font-weight: bold;
        }}
        .allergens {{
            font-size: 10px;
            margin-top: 4px;
            font-weight: bold;
        }}
        """
    
    def _render_nutrition_box(
        self,
        nutrition: Dict[str, Any],
        template_data: Dict[str, Any]
    ) -> str:
        """Render the nutrition facts box"""
        lang = template_data.get("language", "en")
        title = "Nutrition Facts" if lang == "en" else "القيمة الغذائية"
        
        serving_size = nutrition.get("serving_size", 0)
        serving_unit = nutrition.get("serving_unit", "g")
        
        html = f"""
        <div class="nutrition-title">{title}</div>
        <div class="serving-info">
            <div>Serving size {serving_size}{serving_unit}</div>
        </div>
        <div class="calories-row">
            <span class="calories-label">Calories</span>
            <span class="calories-value">{int(nutrition.get('calories', 0))}</span>
        </div>
        <div class="dv-header">% Daily Value*</div>
        """
        
        # Add nutrient rows
        nutrients = [
            ("Total Fat", "total_fat", "g", "total_fat_dv", False, True),
            ("Saturated Fat", "saturated_fat", "g", "saturated_fat_dv", True, False),
            ("Trans Fat", "trans_fat", "g", None, True, False),
            ("Cholesterol", "cholesterol", "mg", "cholesterol_dv", False, True),
            ("Sodium", "sodium", "mg", "sodium_dv", False, True),
            ("Total Carbohydrate", "total_carbs", "g", "total_carbs_dv", False, True),
            ("Dietary Fiber", "dietary_fiber", "g", "dietary_fiber_dv", True, False),
            ("Total Sugars", "total_sugars", "g", None, True, False),
            ("Added Sugars", "added_sugars", "g", "added_sugars_dv", True, False),
            ("Protein", "protein", "g", None, False, True),
        ]
        
        for name, key, unit, dv_key, indent, bold in nutrients:
            value = nutrition.get(key, 0)
            dv = nutrition.get(dv_key, 0) if dv_key else None
            
            indent_class = "indent" if indent else ""
            bold_class = "bold" if bold else ""
            
            dv_str = f"{int(dv)}%" if dv is not None else ""
            
            html += f"""
            <div class="nutrient-row {indent_class} {bold_class}">
                <span>{name} {value}{unit}</span>
                <span>{dv_str}</span>
            </div>
            """
        
        # Micronutrients
        html += '<div style="border-top: 4px solid #000; padding-top: 4px;">'
        micros = [
            ("Vitamin D", "vitamin_d", "mcg", "vitamin_d_dv"),
            ("Calcium", "calcium", "mg", "calcium_dv"),
            ("Iron", "iron", "mg", "iron_dv"),
            ("Potassium", "potassium", "mg", "potassium_dv"),
        ]
        
        for name, key, unit, dv_key in micros:
            value = nutrition.get(key, 0)
            dv = nutrition.get(dv_key, 0)
            html += f"""
            <div class="nutrient-row">
                <span>{name} {value}{unit}</span>
                <span>{int(dv)}%</span>
            </div>
            """
        html += '</div>'
        
        # Footnote
        html += """
        <div class="footnote">
            * The % Daily Value (DV) tells you how much a nutrient in a serving of food 
            contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.
        </div>
        """
        
        return html
    
    def _render_ingredients(
        self,
        product_data: Dict[str, Any],
        template_data: Dict[str, Any]
    ) -> str:
        """Render ingredients list"""
        prefs = template_data.get("display_preferences", {})
        if prefs.get("hideIngredients", False):
            return ""
        
        ingredients = product_data.get("ingredients_text", "")
        if not ingredients:
            return ""
        
        return f"""
        <div class="ingredients">
            <span class="ingredients-label">Ingredients:</span> {ingredients}
        </div>
        """
    
    def _render_allergens(
        self,
        product_data: Dict[str, Any],
        template_data: Dict[str, Any]
    ) -> str:
        """Render allergens statement"""
        prefs = template_data.get("display_preferences", {})
        if prefs.get("hideAllergens", False):
            return ""
        
        allergens = product_data.get("allergens_text", "")
        if not allergens:
            return ""
        
        return f"""
        <div class="allergens">
            Contains: {allergens}
        </div>
        """
    
    async def export_png(
        self,
        template_data: Dict[str, Any],
        product_data: Dict[str, Any],
        nutrition: Dict[str, Any],
        dpi: int = 300
    ) -> bytes:
        """Export label as PNG image"""
        html = await self.render_html(template_data, product_data, nutrition)
        
        # TODO: Implement with html2image or playwright
        # hti = Html2Image()
        # hti.screenshot(html_str=html, save_as='label.png')
        
        # Placeholder
        return b""
    
    async def export_pdf(
        self,
        template_data: Dict[str, Any],
        product_data: Dict[str, Any],
        nutrition: Dict[str, Any]
    ) -> bytes:
        """Export label as PDF"""
        html = await self.render_html(template_data, product_data, nutrition)
        
        # TODO: Implement with WeasyPrint
        # return HTML(string=html).write_pdf()
        
        # Placeholder
        return b""
    
    async def export_svg(
        self,
        template_data: Dict[str, Any],
        product_data: Dict[str, Any],
        nutrition: Dict[str, Any]
    ) -> str:
        """Export label as SVG"""
        # TODO: Implement SVG generation
        # Could convert HTML to SVG or generate SVG directly
        
        # Placeholder
        return "<svg></svg>"

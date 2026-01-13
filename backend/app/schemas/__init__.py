"""
Pydantic Schemas for API validation and serialization
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from decimal import Decimal


# ============== Auth Schemas ==============

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    company_name: Optional[str] = None
    company_name_ar: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    company_name: Optional[str] = None
    company_name_ar: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ============== Ingredient Schemas ==============

class IngredientBase(BaseModel):
    name: str
    name_ar: Optional[str] = None
    category: Optional[str] = None
    
    # Macros
    calories: Decimal = 0
    total_fat: Decimal = 0
    saturated_fat: Decimal = 0
    trans_fat: Decimal = 0
    cholesterol: Decimal = 0
    sodium: Decimal = 0
    total_carbs: Decimal = 0
    dietary_fiber: Decimal = 0
    total_sugars: Decimal = 0
    added_sugars: Decimal = 0
    protein: Decimal = 0
    
    # Micros (mandatory)
    vitamin_d: Decimal = 0
    calcium: Decimal = 0
    iron: Decimal = 0
    potassium: Decimal = 0
    
    per_amount: Decimal = 100
    per_unit: str = "g"


class IngredientCreate(IngredientBase):
    pass


class IngredientUpdate(BaseModel):
    name: Optional[str] = None
    name_ar: Optional[str] = None
    category: Optional[str] = None
    calories: Optional[Decimal] = None
    total_fat: Optional[Decimal] = None
    saturated_fat: Optional[Decimal] = None
    trans_fat: Optional[Decimal] = None
    cholesterol: Optional[Decimal] = None
    sodium: Optional[Decimal] = None
    total_carbs: Optional[Decimal] = None
    dietary_fiber: Optional[Decimal] = None
    total_sugars: Optional[Decimal] = None
    added_sugars: Optional[Decimal] = None
    protein: Optional[Decimal] = None
    vitamin_d: Optional[Decimal] = None
    calcium: Optional[Decimal] = None
    iron: Optional[Decimal] = None
    potassium: Optional[Decimal] = None


class IngredientResponse(IngredientBase):
    id: UUID
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============== Product Schemas ==============

class ProductIngredientCreate(BaseModel):
    ingredient_id: UUID
    quantity: Decimal
    unit: str
    display_name: Optional[str] = None
    display_name_ar: Optional[str] = None
    display_order: int = 0


class ProductIngredientResponse(BaseModel):
    id: UUID
    ingredient_id: UUID
    ingredient_name: Optional[str] = None
    quantity: Decimal
    unit: str
    display_name: Optional[str] = None
    display_order: int

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    name: str
    name_ar: Optional[str] = None
    description: Optional[str] = None
    description_ar: Optional[str] = None
    serving_size: Decimal
    serving_unit: str
    serving_description: Optional[str] = None
    servings_per_container: Optional[Decimal] = None


class ProductCreate(ProductBase):
    ingredients: Optional[List[ProductIngredientCreate]] = []
    allergen_ids: Optional[List[UUID]] = []


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    name_ar: Optional[str] = None
    description: Optional[str] = None
    serving_size: Optional[Decimal] = None
    serving_unit: Optional[str] = None
    serving_description: Optional[str] = None
    servings_per_container: Optional[Decimal] = None


class NutritionSummary(BaseModel):
    """Calculated nutrition per serving"""
    serving_size: Decimal
    serving_unit: str
    calories: Decimal = 0
    total_fat: Decimal = 0
    saturated_fat: Decimal = 0
    trans_fat: Decimal = 0
    cholesterol: Decimal = 0
    sodium: Decimal = 0
    total_carbs: Decimal = 0
    dietary_fiber: Decimal = 0
    total_sugars: Decimal = 0
    added_sugars: Decimal = 0
    protein: Decimal = 0
    vitamin_d: Decimal = 0
    calcium: Decimal = 0
    iron: Decimal = 0
    potassium: Decimal = 0
    
    # % Daily Values
    total_fat_dv: Decimal = 0
    saturated_fat_dv: Decimal = 0
    cholesterol_dv: Decimal = 0
    sodium_dv: Decimal = 0
    total_carbs_dv: Decimal = 0
    dietary_fiber_dv: Decimal = 0
    added_sugars_dv: Decimal = 0
    vitamin_d_dv: Decimal = 0
    calcium_dv: Decimal = 0
    iron_dv: Decimal = 0
    potassium_dv: Decimal = 0


class ProductResponse(ProductBase):
    id: UUID
    user_id: UUID
    ingredients: List[ProductIngredientResponse] = []
    nutrition: Optional[NutritionSummary] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============== Template Schemas ==============

class LabelElement(BaseModel):
    id: str
    type: str  # nutrition-box, ingredients-list, allergens, text, line, rect
    x: float
    y: float
    width: float
    height: float
    properties: Dict[str, Any] = {}


class TemplateStyles(BaseModel):
    fontFamily: str = "Arial"
    fontSize: int = 12
    borderWidth: int = 1
    borderColor: str = "#000000"
    backgroundColor: str = "#ffffff"


class NutrientConfig(BaseModel):
    key: str
    show: bool = True
    indent: int = 0
    bold: bool = False


class NutritionConfig(BaseModel):
    showCalories: bool = True
    showServingSize: bool = True
    showDailyValue: bool = True
    nutrients: List[NutrientConfig] = []


class DisplayPreferences(BaseModel):
    hideIngredients: bool = False
    hideAllergens: bool = False
    hideBusinessDetails: bool = False
    hideSugarAlcohol: bool = True
    showAdditionalMicronutrients: bool = False
    preferSodiumOverSalt: bool = True
    preferCalorieOverJoule: bool = True


class TemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    type: str = "vertical"  # vertical, tabular, dual-column, linear, aggregate, simplified
    width: int = 400
    height: int = 600
    shape: str = "rectangle"  # rectangle, circle, oval, pill, rounded-rect
    corner_radius: int = 0  # For rounded-rect shape
    language: str = "en"


class TemplateCreate(TemplateBase):
    elements: List[LabelElement] = []
    styles: Optional[TemplateStyles] = None
    nutrition_config: Optional[NutritionConfig] = None
    display_preferences: Optional[DisplayPreferences] = None


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    shape: Optional[str] = None
    corner_radius: Optional[int] = None
    language: Optional[str] = None
    elements: Optional[List[LabelElement]] = None
    styles: Optional[TemplateStyles] = None
    nutrition_config: Optional[NutritionConfig] = None
    display_preferences: Optional[DisplayPreferences] = None


class TemplateResponse(TemplateBase):
    id: UUID
    user_id: Optional[UUID] = None
    elements: List[Dict[str, Any]] = []
    styles: Dict[str, Any] = {}
    nutrition_config: Dict[str, Any] = {}
    display_preferences: Dict[str, Any] = {}
    shape: str = "rectangle"
    corner_radius: int = 0
    is_preset: bool
    is_public: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============== Label Schemas ==============

class LabelCreate(BaseModel):
    product_id: UUID
    template_id: UUID
    name: Optional[str] = None


class LabelExportRequest(BaseModel):
    product_id: UUID
    template_id: UUID
    format: str = "png"  # png, pdf, svg


class LabelResponse(BaseModel):
    id: UUID
    product_id: UUID
    template_id: UUID
    name: Optional[str] = None
    version: str
    nutrition_snapshot: Optional[Dict[str, Any]] = None
    compliance_status: str
    compliance_issues: List[Dict[str, Any]] = []
    created_at: datetime

    class Config:
        from_attributes = True


# ============== Allergen Schemas ==============

class AllergenResponse(BaseModel):
    id: UUID
    name: str
    name_ar: Optional[str] = None
    is_major: bool

    class Config:
        from_attributes = True


# ============== Common Schemas ==============

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    pages: int


# ============== Admin - Nutrient Definition Schemas ==============

class NutrientDefinitionBase(BaseModel):
    key: str = Field(..., min_length=1, max_length=50)
    name_en: str = Field(..., min_length=1, max_length=100)
    name_ar: Optional[str] = Field(None, max_length=100)
    name_hi: Optional[str] = Field(None, max_length=100)
    name_zh: Optional[str] = Field(None, max_length=100)
    unit: str = Field(..., min_length=1, max_length=20)
    category: str = Field(..., min_length=1, max_length=50)  # energy, macro, vitamin, mineral, other
    parent_key: Optional[str] = Field(None, max_length=50)
    is_mandatory_global: bool = False
    default_order: int = 0


class NutrientDefinitionCreate(NutrientDefinitionBase):
    pass


class NutrientDefinitionUpdate(BaseModel):
    key: Optional[str] = Field(None, min_length=1, max_length=50)
    name_en: Optional[str] = Field(None, min_length=1, max_length=100)
    name_ar: Optional[str] = Field(None, max_length=100)
    name_hi: Optional[str] = Field(None, max_length=100)
    name_zh: Optional[str] = Field(None, max_length=100)
    unit: Optional[str] = Field(None, min_length=1, max_length=20)
    category: Optional[str] = Field(None, min_length=1, max_length=50)
    parent_key: Optional[str] = Field(None, max_length=50)
    is_mandatory_global: Optional[bool] = None
    default_order: Optional[int] = None
    is_active: Optional[bool] = None


class NutrientDefinitionResponse(NutrientDefinitionBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============== Admin - Label Type Schemas ==============

class TypographyConfig(BaseModel):
    fontFamily: str = "Arial, sans-serif"
    fontFamilyAr: Optional[str] = None
    titleFontSize: int = 24
    titleFontWeight: str = "bold"
    headerFontSize: int = 12
    bodyFontSize: int = 11
    footnoteSize: int = 8


class BorderConfig(BaseModel):
    width: int = 1
    color: str = "#000000"
    style: str = "solid"


class ColorScheme(BaseModel):
    background: str = "#ffffff"
    text: str = "#000000"
    accent: Optional[str] = "#000000"
    divider: Optional[str] = "#000000"
    lowColor: Optional[str] = None  # For traffic light
    mediumColor: Optional[str] = None
    highColor: Optional[str] = None


class FootnoteConfig(BaseModel):
    text: str
    textAr: Optional[str] = None
    required: bool = False


class LabelTypeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=50)
    category: str = Field(default="regulatory", max_length=50)  # regulatory, marketing, custom
    description: Optional[str] = None
    region: Optional[str] = Field(None, max_length=50)  # USA, GCC, EU, UK, etc.
    languages: List[str] = Field(default=["en"])
    display_modes: List[str] = Field(default=["per_serving"])  # per_serving, per_100g, per_container
    daily_calorie_base: int = Field(default=2000, ge=1000, le=5000)
    energy_unit: str = Field(default="kcal", max_length=10)  # kcal, kJ, both
    sodium_display: str = Field(default="sodium", max_length=10)  # sodium, salt
    default_width: int = Field(default=400, ge=100, le=2000)
    default_height: int = Field(default=600, ge=100, le=3000)
    typography: Optional[TypographyConfig] = None
    border_config: Optional[BorderConfig] = None
    color_scheme: Optional[ColorScheme] = None
    footnotes: List[FootnoteConfig] = []


class LabelTypeCreate(LabelTypeBase):
    pass


class LabelTypeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    category: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    region: Optional[str] = Field(None, max_length=50)
    languages: Optional[List[str]] = None
    display_modes: Optional[List[str]] = None
    daily_calorie_base: Optional[int] = Field(None, ge=1000, le=5000)
    energy_unit: Optional[str] = Field(None, max_length=10)
    sodium_display: Optional[str] = Field(None, max_length=10)
    default_width: Optional[int] = Field(None, ge=100, le=2000)
    default_height: Optional[int] = Field(None, ge=100, le=3000)
    typography: Optional[TypographyConfig] = None
    border_config: Optional[BorderConfig] = None
    color_scheme: Optional[ColorScheme] = None
    footnotes: Optional[List[FootnoteConfig]] = None
    is_active: Optional[bool] = None


class LabelTypeResponse(LabelTypeBase):
    id: UUID
    is_active: bool
    is_system: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LabelTypeDetailResponse(LabelTypeResponse):
    """Label type with nutrient configurations"""
    nutrient_configs: List["LabelTypeNutrientResponse"] = []


# ============== Admin - Label Type Nutrient Config Schemas ==============

class LabelTypeNutrientBase(BaseModel):
    nutrient_id: UUID
    is_mandatory: bool = False
    show_by_default: bool = True
    show_percent_dv: bool = True
    display_order: int = 0
    indent_level: int = Field(default=0, ge=0, le=3)
    is_bold: bool = False
    daily_value: Optional[Decimal] = None
    daily_value_unit: Optional[str] = Field(None, max_length=20)


class LabelTypeNutrientCreate(LabelTypeNutrientBase):
    pass


class LabelTypeNutrientUpdate(BaseModel):
    is_mandatory: Optional[bool] = None
    show_by_default: Optional[bool] = None
    show_percent_dv: Optional[bool] = None
    display_order: Optional[int] = None
    indent_level: Optional[int] = Field(None, ge=0, le=3)
    is_bold: Optional[bool] = None
    daily_value: Optional[Decimal] = None
    daily_value_unit: Optional[str] = Field(None, max_length=20)


class LabelTypeNutrientResponse(LabelTypeNutrientBase):
    id: UUID
    label_type_id: UUID
    nutrient_key: Optional[str] = None  # Populated from nutrient relation
    nutrient_name_en: Optional[str] = None  # Populated from nutrient relation

    class Config:
        from_attributes = True


class LabelTypeNutrientBulkUpdate(BaseModel):
    """Bulk update for nutrient configs on a label type"""
    nutrients: List[LabelTypeNutrientCreate]


# ============== Admin - RDA Table Schemas ==============

class RDATableBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    region: Optional[str] = Field(None, max_length=50)
    calorie_base: int = Field(default=2000, ge=1000, le=5000)
    values: Dict[str, Optional[Decimal]] = {}  # nutrient_key -> daily_value
    units: Dict[str, str] = {}  # nutrient_key -> unit


class RDATableCreate(RDATableBase):
    effective_date: Optional[datetime] = None
    is_default: bool = False


class RDATableUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    region: Optional[str] = Field(None, max_length=50)
    effective_date: Optional[datetime] = None
    calorie_base: Optional[int] = Field(None, ge=1000, le=5000)
    values: Optional[Dict[str, Optional[Decimal]]] = None
    units: Optional[Dict[str, str]] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None


class RDATableResponse(RDATableBase):
    id: UUID
    effective_date: datetime
    is_active: bool
    is_default: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Update forward references
LabelTypeDetailResponse.model_rebuild()

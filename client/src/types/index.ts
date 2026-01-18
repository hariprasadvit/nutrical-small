/**
 * NutriCal TypeScript Types
 */

// ============== Auth ==============

export interface User {
  id: string;
  email: string;
  name?: string;
  company_name?: string;
  company_name_ar?: string;
  is_active?: boolean;
  is_admin?: boolean;
  created_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

// ============== Ingredient ==============

export interface Ingredient {
  id: string;
  name: string;
  name_ar?: string;
  category?: string;
  calories: number;
  total_fat: number;
  saturated_fat: number;
  trans_fat: number;
  cholesterol: number;
  sodium: number;
  total_carbs: number;
  dietary_fiber: number;
  total_sugars: number;
  added_sugars: number;
  protein: number;
  vitamin_d: number;
  calcium: number;
  iron: number;
  potassium: number;
  per_amount: number;
  per_unit: string;
  is_verified: boolean;
  created_at: string;
}

export interface IngredientCreate {
  name: string;
  name_ar?: string;
  category?: string;
  calories?: number;
  total_fat?: number;
  saturated_fat?: number;
  trans_fat?: number;
  cholesterol?: number;
  sodium?: number;
  total_carbs?: number;
  dietary_fiber?: number;
  total_sugars?: number;
  added_sugars?: number;
  protein?: number;
  vitamin_d?: number;
  calcium?: number;
  iron?: number;
  potassium?: number;
  per_amount?: number;
  per_unit?: string;
}

// ============== Product ==============

export interface ProductIngredient {
  id: string;
  ingredient_id: string;
  ingredient_name?: string;
  quantity: number;
  unit: string;
  display_name?: string;
  display_order: number;
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  serving_size: number;
  serving_unit: string;
  serving_description?: string;
  servings_per_container?: number;
  ingredients: ProductIngredient[];
  nutrition?: NutritionSummary;
  created_at: string;
  updated_at: string;
}

export interface ProductCreate {
  name: string;
  name_ar?: string;
  description?: string;
  serving_size: number;
  serving_unit: string;
  serving_description?: string;
  servings_per_container?: number;
}

export interface NutritionSummary {
  serving_size: number;
  serving_unit: string;
  calories: number;
  total_fat: number;
  saturated_fat: number;
  trans_fat: number;
  cholesterol: number;
  sodium: number;
  total_carbs: number;
  dietary_fiber: number;
  total_sugars: number;
  added_sugars: number;
  protein: number;
  vitamin_d: number;
  calcium: number;
  iron: number;
  potassium: number;
  // % Daily Values
  total_fat_dv: number;
  saturated_fat_dv: number;
  cholesterol_dv: number;
  sodium_dv: number;
  total_carbs_dv: number;
  dietary_fiber_dv: number;
  added_sugars_dv: number;
  vitamin_d_dv: number;
  calcium_dv: number;
  iron_dv: number;
  potassium_dv: number;
}

// ============== Template ==============

export interface LabelElement {
  id: string;
  type: 'nutrition-box' | 'ingredients-list' | 'allergens' | 'business-info' | 'text' | 'line' | 'rect' | 'logo' | 'traffic-light' | 'curved-text' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  properties: Record<string, unknown>;
}

export interface TemplateStyles {
  fontFamily: string;
  fontSize: number;
  borderWidth: number;
  borderColor: string;
  backgroundColor: string;
}

export interface NutrientConfig {
  key: string;
  show: boolean;
  indent: number;
  bold: boolean;
}

export interface NutritionConfig {
  showCalories: boolean;
  showServingSize: boolean;
  showDailyValue: boolean;
  nutrients: NutrientConfig[];
}

export interface DisplayPreferences {
  hideIngredients: boolean;
  hideAllergens: boolean;
  hideBusinessDetails: boolean;
  hideSugarAlcohol: boolean;
  showAdditionalMicronutrients: boolean;
  preferSodiumOverSalt: boolean;
  preferCalorieOverJoule: boolean;
}

export interface Template {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  type: 'vertical' | 'tabular' | 'dual-column' | 'linear' | 'aggregate' | 'simplified';
  width: number;
  height: number;
  shape: 'rectangle' | 'circle' | 'oval' | 'pill' | 'rounded-rect';
  corner_radius: number;
  language: string;
  elements: LabelElement[];
  styles: TemplateStyles;
  nutrition_config: NutritionConfig;
  display_preferences: DisplayPreferences;
  is_preset: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateCreate {
  name: string;
  description?: string;
  type?: string;
  width?: number;
  height?: number;
  shape?: string;
  corner_radius?: number;
  language?: string;
  elements?: LabelElement[];
  styles?: Partial<TemplateStyles>;
  nutrition_config?: Partial<NutritionConfig>;
  display_preferences?: Partial<DisplayPreferences>;
}

// ============== Label ==============

export interface Label {
  id: string;
  product_id: string;
  template_id: string;
  name?: string;
  version: string;
  nutrition_snapshot?: NutritionSummary;
  compliance_status: 'pending' | 'passed' | 'failed';
  compliance_issues: Array<{ code: string; message: string }>;
  created_at: string;
}

export interface LabelExportRequest {
  product_id: string;
  template_id: string;
  format: 'png' | 'pdf' | 'svg';
}

// ============== Allergen ==============

export interface Allergen {
  id: string;
  name: string;
  name_ar?: string;
  is_major: boolean;
}

// ============== Fabric.js Types ==============

export interface FabricObject {
  id?: string;
  type: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

// ============== API Response ==============

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

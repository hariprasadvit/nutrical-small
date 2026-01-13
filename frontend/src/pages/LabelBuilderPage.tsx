import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { templatesApi, productsApi, labelsApi } from '../services/api';
import {
  Save,
  Download,
  Type,
  Square,
  Minus,
  List,
  AlertTriangle,
  Building,
  ZoomIn,
  ZoomOut,
  Move,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Palette,
  Settings,
  Globe,
  X,
  ChevronDown,
  Image,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { LabelElement, NutritionSummary } from '../types';

// ============================================================================
// DAILY VALUE (DV) REFERENCE SYSTEM
// Supports different countries, age groups, and regulatory standards
// ============================================================================

// Age group types for DV calculations
type AgeGroup = 'adults' | 'children_1_3' | 'children_4_plus' | 'infants_0_12m' | 'pregnant' | 'lactating';

// Region/Country types for regulatory compliance
type DVRegion = 'fda_us' | 'india_fssai' | 'eu' | 'gso_gcc' | 'codex' | 'custom';

// Interface for Daily Value configuration
interface DVConfig {
  region: DVRegion;
  ageGroup: AgeGroup;
  baselineCalories: number;
  values: Record<string, number | null>;
}

// FDA 2020 Daily Values - Adults (default)
const FDA_DV_ADULTS: Record<string, number | null> = {
  calories: 2000,
  total_fat: 78, // g
  saturated_fat: 20, // g
  trans_fat: null, // No DV established
  cholesterol: 300, // mg
  sodium: 2300, // mg
  total_carbs: 275, // g
  dietary_fiber: 28, // g
  total_sugars: null, // No DV established
  added_sugars: 50, // g
  protein: 50, // g
  vitamin_d: 20, // mcg
  calcium: 1300, // mg
  iron: 18, // mg
  potassium: 4700, // mg
  vitamin_a: 900, // mcg RAE
  vitamin_c: 90, // mg
  vitamin_e: 15, // mg
  vitamin_k: 120, // mcg
  thiamin: 1.2, // mg
  riboflavin: 1.3, // mg
  niacin: 16, // mg NE
  vitamin_b6: 1.7, // mg
  folate: 400, // mcg DFE
  vitamin_b12: 2.4, // mcg
  biotin: 30, // mcg
  pantothenic_acid: 5, // mg
  phosphorus: 1250, // mg
  iodine: 150, // mcg
  magnesium: 420, // mg
  zinc: 11, // mg
  selenium: 55, // mcg
  copper: 0.9, // mg
  manganese: 2.3, // mg
  chromium: 35, // mcg
  molybdenum: 45, // mcg
  chloride: 2300, // mg
  choline: 550, // mg
};

// FDA Daily Values - Children 1-3 years (21 CFR 101.36)
const FDA_DV_CHILDREN_1_3: Record<string, number | null> = {
  calories: 1000,
  total_fat: 39, // g
  saturated_fat: 10, // g
  trans_fat: null,
  cholesterol: 300, // mg
  sodium: 1500, // mg
  total_carbs: 150, // g
  dietary_fiber: 14, // g
  total_sugars: null,
  added_sugars: 25, // g
  protein: 13, // g
  vitamin_d: 15, // mcg
  calcium: 700, // mg
  iron: 7, // mg
  potassium: 2000, // mg
  vitamin_a: 300, // mcg RAE
  vitamin_c: 15, // mg
  vitamin_e: 6, // mg
  vitamin_k: 30, // mcg
  thiamin: 0.5, // mg
  riboflavin: 0.5, // mg
  niacin: 6, // mg NE
  vitamin_b6: 0.5, // mg
  folate: 150, // mcg DFE
  vitamin_b12: 0.9, // mcg
  biotin: 8, // mcg
  pantothenic_acid: 2, // mg
  phosphorus: 460, // mg
  iodine: 90, // mcg
  magnesium: 80, // mg
  zinc: 3, // mg
  selenium: 20, // mcg
  copper: 0.34, // mg
  manganese: 1.2, // mg
  chromium: 11, // mcg
  molybdenum: 17, // mcg
  chloride: 1500, // mg
  choline: 200, // mg
};

// FDA Daily Values - Infants 0-12 months
const FDA_DV_INFANTS: Record<string, number | null> = {
  calories: 820,
  total_fat: 30, // g (AI for infants)
  saturated_fat: null,
  trans_fat: null,
  cholesterol: null,
  sodium: 370, // mg
  total_carbs: 95, // g
  dietary_fiber: null,
  total_sugars: null,
  added_sugars: null,
  protein: 11, // g
  vitamin_d: 10, // mcg
  calcium: 260, // mg
  iron: 11, // mg
  potassium: 700, // mg
  vitamin_a: 500, // mcg RAE
  vitamin_c: 50, // mg
  vitamin_e: 5, // mg
  vitamin_k: 2.5, // mcg
  thiamin: 0.3, // mg
  riboflavin: 0.4, // mg
  niacin: 4, // mg NE
  vitamin_b6: 0.3, // mg
  folate: 80, // mcg DFE
  vitamin_b12: 0.5, // mcg
  biotin: 6, // mcg
  pantothenic_acid: 1.8, // mg
  phosphorus: 275, // mg
  iodine: 130, // mcg
  magnesium: 75, // mg
  zinc: 3, // mg
  selenium: 20, // mcg
  copper: 0.22, // mg
  manganese: 0.6, // mg
  chromium: 5.5, // mcg
  molybdenum: 3, // mcg
  chloride: 570, // mg
  choline: 150, // mg
};

// India FSSAI Daily Values - Adults (2000 kcal base)
const INDIA_DV_ADULTS: Record<string, number | null> = {
  calories: 2000,
  total_fat: 67, // g
  saturated_fat: 22, // g
  trans_fat: null,
  cholesterol: 300, // mg
  sodium: 2000, // mg (lower than FDA)
  total_carbs: 300, // g
  dietary_fiber: 30, // g
  total_sugars: null,
  added_sugars: 50, // g
  protein: 60, // g
  vitamin_d: 10, // mcg
  calcium: 1000, // mg
  iron: 17, // mg
  potassium: 3500, // mg
  vitamin_a: 800, // mcg RAE
  vitamin_c: 80, // mg
  vitamin_e: 10, // mg
  vitamin_k: 55, // mcg
  thiamin: 1.4, // mg
  riboflavin: 1.6, // mg
  niacin: 18, // mg NE
  vitamin_b6: 2, // mg
  folate: 200, // mcg
  vitamin_b12: 1, // mcg
  biotin: 30, // mcg
  pantothenic_acid: 5, // mg
  phosphorus: 800, // mg
  iodine: 150, // mcg
  magnesium: 340, // mg
  zinc: 12, // mg
  selenium: 40, // mcg
  copper: 2, // mg
  manganese: 3, // mg
  chromium: 50, // mcg
  molybdenum: 50, // mcg
  chloride: 2300, // mg
  choline: 400, // mg
};

// GSO/GCC Daily Values - Adults (2400 kcal base for some regions)
const GSO_DV_ADULTS: Record<string, number | null> = {
  calories: 2000, // GSO uses 2000 as reference
  total_fat: 65, // g
  saturated_fat: 20, // g
  trans_fat: null,
  cholesterol: 300, // mg
  sodium: 2400, // mg
  total_carbs: 300, // g
  dietary_fiber: 25, // g
  total_sugars: null,
  added_sugars: 50, // g
  protein: 50, // g
  vitamin_d: 15, // mcg
  calcium: 1000, // mg
  iron: 14, // mg
  potassium: 3500, // mg
  vitamin_a: 800, // mcg RAE
  vitamin_c: 80, // mg
  vitamin_e: 12, // mg
  vitamin_k: 80, // mcg
  thiamin: 1.2, // mg
  riboflavin: 1.4, // mg
  niacin: 16, // mg NE
  vitamin_b6: 1.4, // mg
  folate: 400, // mcg DFE
  vitamin_b12: 2.5, // mcg
  biotin: 50, // mcg
  pantothenic_acid: 6, // mg
  phosphorus: 700, // mg
  iodine: 150, // mcg
  magnesium: 375, // mg
  zinc: 10, // mg
  selenium: 55, // mcg
  copper: 1, // mg
  manganese: 2, // mg
  chromium: 40, // mcg
  molybdenum: 50, // mcg
  chloride: 800, // mg
  choline: 550, // mg
};

// DV Configuration Presets
export const DV_PRESETS: Record<string, DVConfig> = {
  'fda_adults': {
    region: 'fda_us',
    ageGroup: 'adults',
    baselineCalories: 2000,
    values: FDA_DV_ADULTS,
  },
  'fda_children_1_3': {
    region: 'fda_us',
    ageGroup: 'children_1_3',
    baselineCalories: 1000,
    values: FDA_DV_CHILDREN_1_3,
  },
  'fda_infants': {
    region: 'fda_us',
    ageGroup: 'infants_0_12m',
    baselineCalories: 820,
    values: FDA_DV_INFANTS,
  },
  'india_adults': {
    region: 'india_fssai',
    ageGroup: 'adults',
    baselineCalories: 2000,
    values: INDIA_DV_ADULTS,
  },
  'gso_adults': {
    region: 'gso_gcc',
    ageGroup: 'adults',
    baselineCalories: 2000,
    values: GSO_DV_ADULTS,
  },
};

// Get DV config based on region and age group
export function getDVConfig(region: DVRegion, ageGroup: AgeGroup): DVConfig {
  const key = `${region}_${ageGroup}`;
  if (DV_PRESETS[key]) {
    return DV_PRESETS[key];
  }
  // Default to FDA adults
  return DV_PRESETS['fda_adults'];
}

// Calculate %DV for a nutrient
export function calculatePercentDV(
  nutrientKey: string,
  value: number,
  dvConfig: DVConfig
): number | undefined {
  const dv = dvConfig.values[nutrientKey];
  if (dv === null || dv === undefined || dv === 0) {
    return undefined;
  }
  return (value / dv) * 100;
}

// Legacy export for backward compatibility
export const FDA_DAILY_VALUES = FDA_DV_ADULTS;

// Nutrient definitions with display properties and translations
const NUTRIENT_DEFINITIONS = [
  // Core nutrients (FDA required)
  { key: 'calories', nameEn: 'Calories', nameAr: 'السعرات الحرارية', nameHi: 'कैलोरी', nameZh: '卡路里', nameEs: 'Calorías', nameFr: 'Calories', unit: '', category: 'core', required: true, bold: true, indent: 0 },
  { key: 'total_fat', nameEn: 'Total Fat', nameAr: 'الدهون الكلية', nameHi: 'कुल वसा', nameZh: '总脂肪', nameEs: 'Grasa Total', nameFr: 'Lipides', unit: 'g', category: 'core', required: true, bold: true, indent: 0, showDV: true },
  { key: 'saturated_fat', nameEn: 'Saturated Fat', nameAr: 'الدهون المشبعة', nameHi: 'संतृप्त वसा', nameZh: '饱和脂肪', nameEs: 'Grasas Saturadas', nameFr: 'Acides gras saturés', unit: 'g', category: 'core', required: true, bold: false, indent: 1, showDV: true },
  { key: 'trans_fat', nameEn: 'Trans Fat', nameAr: 'الدهون المتحولة', nameHi: 'ट्रांस वसा', nameZh: '反式脂肪', nameEs: 'Grasas Trans', nameFr: 'Acides gras trans', unit: 'g', category: 'core', required: true, bold: false, indent: 1, showDV: false },
  { key: 'cholesterol', nameEn: 'Cholesterol', nameAr: 'الكوليسترول', nameHi: 'कोलेस्ट्रॉल', nameZh: '胆固醇', nameEs: 'Colesterol', nameFr: 'Cholestérol', unit: 'mg', category: 'core', required: true, bold: true, indent: 0, showDV: true },
  { key: 'sodium', nameEn: 'Sodium', nameAr: 'الصوديوم', nameHi: 'सोडियम', nameZh: '钠', nameEs: 'Sodio', nameFr: 'Sodium', unit: 'mg', category: 'core', required: true, bold: true, indent: 0, showDV: true },
  { key: 'total_carbs', nameEn: 'Total Carbohydrate', nameAr: 'الكربوهيدرات الكلية', nameHi: 'कुल कार्बोहाइड्रेट', nameZh: '总碳水化合物', nameEs: 'Carbohidratos Totales', nameFr: 'Glucides', unit: 'g', category: 'core', required: true, bold: true, indent: 0, showDV: true },
  { key: 'dietary_fiber', nameEn: 'Dietary Fiber', nameAr: 'الألياف الغذائية', nameHi: 'आहार फाइबर', nameZh: '膳食纤维', nameEs: 'Fibra Dietética', nameFr: 'Fibres alimentaires', unit: 'g', category: 'core', required: true, bold: false, indent: 1, showDV: true },
  { key: 'total_sugars', nameEn: 'Total Sugars', nameAr: 'السكريات الكلية', nameHi: 'कुल शर्करा', nameZh: '总糖', nameEs: 'Azúcares Totales', nameFr: 'Sucres totaux', unit: 'g', category: 'core', required: true, bold: false, indent: 1, showDV: false },
  { key: 'added_sugars', nameEn: 'Includes Added Sugars', nameAr: 'يشمل السكريات المضافة', nameHi: 'अतिरिक्त शर्करा शामिल', nameZh: '包含添加糖', nameEs: 'Incluye Azúcares Añadidos', nameFr: 'Dont sucres ajoutés', unit: 'g', category: 'core', required: true, bold: false, indent: 2, showDV: true },
  { key: 'protein', nameEn: 'Protein', nameAr: 'البروتين', nameHi: 'प्रोटीन', nameZh: '蛋白质', nameEs: 'Proteína', nameFr: 'Protéines', unit: 'g', category: 'core', required: true, bold: true, indent: 0, showDV: false },
  // Mandatory vitamins & minerals (FDA 2020)
  { key: 'vitamin_d', nameEn: 'Vitamin D', nameAr: 'فيتامين د', nameHi: 'विटामिन डी', nameZh: '维生素D', nameEs: 'Vitamina D', nameFr: 'Vitamine D', unit: 'mcg', category: 'vitamin', required: true, bold: false, indent: 0, showDV: true },
  { key: 'calcium', nameEn: 'Calcium', nameAr: 'الكالسيوم', nameHi: 'कैल्शियम', nameZh: '钙', nameEs: 'Calcio', nameFr: 'Calcium', unit: 'mg', category: 'mineral', required: true, bold: false, indent: 0, showDV: true },
  { key: 'iron', nameEn: 'Iron', nameAr: 'الحديد', nameHi: 'लोहा', nameZh: '铁', nameEs: 'Hierro', nameFr: 'Fer', unit: 'mg', category: 'mineral', required: true, bold: false, indent: 0, showDV: true },
  { key: 'potassium', nameEn: 'Potassium', nameAr: 'البوتاسيوم', nameHi: 'पोटेशियम', nameZh: '钾', nameEs: 'Potasio', nameFr: 'Potassium', unit: 'mg', category: 'mineral', required: true, bold: false, indent: 0, showDV: true },
  // Optional vitamins
  { key: 'vitamin_a', nameEn: 'Vitamin A', nameAr: 'فيتامين أ', nameHi: 'विटामिन ए', nameZh: '维生素A', nameEs: 'Vitamina A', nameFr: 'Vitamine A', unit: 'mcg', category: 'vitamin', required: false, bold: false, indent: 0, showDV: true },
  { key: 'vitamin_c', nameEn: 'Vitamin C', nameAr: 'فيتامين ج', nameHi: 'विटामिन सी', nameZh: '维生素C', nameEs: 'Vitamina C', nameFr: 'Vitamine C', unit: 'mg', category: 'vitamin', required: false, bold: false, indent: 0, showDV: true },
  { key: 'vitamin_e', nameEn: 'Vitamin E', nameAr: 'فيتامين هـ', nameHi: 'विटामिन ई', nameZh: '维生素E', nameEs: 'Vitamina E', nameFr: 'Vitamine E', unit: 'mg', category: 'vitamin', required: false, bold: false, indent: 0, showDV: true },
  { key: 'vitamin_k', nameEn: 'Vitamin K', nameAr: 'فيتامين ك', nameHi: 'विटामिन के', nameZh: '维生素K', nameEs: 'Vitamina K', nameFr: 'Vitamine K', unit: 'mcg', category: 'vitamin', required: false, bold: false, indent: 0, showDV: true },
  { key: 'thiamin', nameEn: 'Thiamin', nameAr: 'الثيامين', nameHi: 'थायमिन', nameZh: '硫胺素', nameEs: 'Tiamina', nameFr: 'Thiamine', unit: 'mg', category: 'vitamin', required: false, bold: false, indent: 0, showDV: true },
  { key: 'riboflavin', nameEn: 'Riboflavin', nameAr: 'الريبوفلافين', nameHi: 'राइबोफ्लेविन', nameZh: '核黄素', nameEs: 'Riboflavina', nameFr: 'Riboflavine', unit: 'mg', category: 'vitamin', required: false, bold: false, indent: 0, showDV: true },
  { key: 'niacin', nameEn: 'Niacin', nameAr: 'النياسين', nameHi: 'नियासिन', nameZh: '烟酸', nameEs: 'Niacina', nameFr: 'Niacine', unit: 'mg', category: 'vitamin', required: false, bold: false, indent: 0, showDV: true },
  { key: 'vitamin_b6', nameEn: 'Vitamin B6', nameAr: 'فيتامين ب6', nameHi: 'विटामिन बी6', nameZh: '维生素B6', nameEs: 'Vitamina B6', nameFr: 'Vitamine B6', unit: 'mg', category: 'vitamin', required: false, bold: false, indent: 0, showDV: true },
  { key: 'folate', nameEn: 'Folate', nameAr: 'حمض الفوليك', nameHi: 'फोलेट', nameZh: '叶酸', nameEs: 'Folato', nameFr: 'Folate', unit: 'mcg', category: 'vitamin', required: false, bold: false, indent: 0, showDV: true },
  { key: 'vitamin_b12', nameEn: 'Vitamin B12', nameAr: 'فيتامين ب12', nameHi: 'विटामिन बी12', nameZh: '维生素B12', nameEs: 'Vitamina B12', nameFr: 'Vitamine B12', unit: 'mcg', category: 'vitamin', required: false, bold: false, indent: 0, showDV: true },
  { key: 'biotin', nameEn: 'Biotin', nameAr: 'البيوتين', nameHi: 'बायोटिन', nameZh: '生物素', nameEs: 'Biotina', nameFr: 'Biotine', unit: 'mcg', category: 'vitamin', required: false, bold: false, indent: 0, showDV: true },
  { key: 'pantothenic_acid', nameEn: 'Pantothenic Acid', nameAr: 'حمض البانتوثنيك', nameHi: 'पैंटोथेनिक एसिड', nameZh: '泛酸', nameEs: 'Ácido Pantoténico', nameFr: 'Acide pantothénique', unit: 'mg', category: 'vitamin', required: false, bold: false, indent: 0, showDV: true },
  // Optional minerals
  { key: 'phosphorus', nameEn: 'Phosphorus', nameAr: 'الفوسفور', nameHi: 'फास्फोरस', nameZh: '磷', nameEs: 'Fósforo', nameFr: 'Phosphore', unit: 'mg', category: 'mineral', required: false, bold: false, indent: 0, showDV: true },
  { key: 'iodine', nameEn: 'Iodine', nameAr: 'اليود', nameHi: 'आयोडीन', nameZh: '碘', nameEs: 'Yodo', nameFr: 'Iode', unit: 'mcg', category: 'mineral', required: false, bold: false, indent: 0, showDV: true },
  { key: 'magnesium', nameEn: 'Magnesium', nameAr: 'المغنيسيوم', nameHi: 'मैग्नीशियम', nameZh: '镁', nameEs: 'Magnesio', nameFr: 'Magnésium', unit: 'mg', category: 'mineral', required: false, bold: false, indent: 0, showDV: true },
  { key: 'zinc', nameEn: 'Zinc', nameAr: 'الزنك', nameHi: 'जस्ता', nameZh: '锌', nameEs: 'Zinc', nameFr: 'Zinc', unit: 'mg', category: 'mineral', required: false, bold: false, indent: 0, showDV: true },
  { key: 'selenium', nameEn: 'Selenium', nameAr: 'السيلينيوم', nameHi: 'सेलेनियम', nameZh: '硒', nameEs: 'Selenio', nameFr: 'Sélénium', unit: 'mcg', category: 'mineral', required: false, bold: false, indent: 0, showDV: true },
  { key: 'copper', nameEn: 'Copper', nameAr: 'النحاس', nameHi: 'तांबा', nameZh: '铜', nameEs: 'Cobre', nameFr: 'Cuivre', unit: 'mg', category: 'mineral', required: false, bold: false, indent: 0, showDV: true },
  { key: 'manganese', nameEn: 'Manganese', nameAr: 'المنغنيز', nameHi: 'मैंगनीज', nameZh: '锰', nameEs: 'Manganeso', nameFr: 'Manganèse', unit: 'mg', category: 'mineral', required: false, bold: false, indent: 0, showDV: true },
  { key: 'chromium', nameEn: 'Chromium', nameAr: 'الكروم', nameHi: 'क्रोमियम', nameZh: '铬', nameEs: 'Cromo', nameFr: 'Chrome', unit: 'mcg', category: 'mineral', required: false, bold: false, indent: 0, showDV: true },
  { key: 'molybdenum', nameEn: 'Molybdenum', nameAr: 'الموليبدينوم', nameHi: 'मोलिब्डेनम', nameZh: '钼', nameEs: 'Molibdeno', nameFr: 'Molybdène', unit: 'mcg', category: 'mineral', required: false, bold: false, indent: 0, showDV: true },
  { key: 'chloride', nameEn: 'Chloride', nameAr: 'الكلوريد', nameHi: 'क्लोराइड', nameZh: '氯化物', nameEs: 'Cloruro', nameFr: 'Chlorure', unit: 'mg', category: 'mineral', required: false, bold: false, indent: 0, showDV: true },
  { key: 'choline', nameEn: 'Choline', nameAr: 'الكولين', nameHi: 'कोलीन', nameZh: '胆碱', nameEs: 'Colina', nameFr: 'Choline', unit: 'mg', category: 'other', required: false, bold: false, indent: 0, showDV: true },
];

// Element types for the toolbar
const ELEMENT_TYPES = [
  { type: 'nutrition-box', label: 'Nutrition Box', icon: Square },
  { type: 'ingredients-list', label: 'Ingredients', icon: List },
  { type: 'allergens', label: 'Allergens', icon: AlertTriangle },
  { type: 'business-info', label: 'Business Info', icon: Building },
  { type: 'text', label: 'Text', icon: Type },
  { type: 'line', label: 'Line', icon: Minus },
  { type: 'logo', label: 'Logo/Image', icon: Image },
];

// Canvas shape types (simplified to rectangle and rounded-rect only)
type CanvasShape = 'rectangle' | 'rounded-rect';

// Shape options for the picker
const CANVAS_SHAPES: { id: CanvasShape; label: string; icon: string }[] = [
  { id: 'rectangle', label: 'Rectangle', icon: '▭' },
  { id: 'rounded-rect', label: 'Rounded', icon: '▢' },
];

// Generate CSS clip-path for canvas shape
function getCanvasClipPath(shape: CanvasShape, _width: number, _height: number, cornerRadius: number = 20): string {
  switch (shape) {
    case 'rounded-rect':
      return `inset(0 round ${cornerRadius}px)`;
    default:
      return 'none';
  }
}

// Template presets - Sets canvas size AND nutrition box format together
interface TemplatePreset {
  type: string;
  label: string;
  width: number;
  height: number;
  description: string;
  shape?: CanvasShape;
  cornerRadius?: number;
  // Nutrition box format settings
  nutritionFormat: string;
  dvRegion?: string;
  dvAgeGroup?: string;
  dvAgeGroup2?: string;
  language?: string;
}

const TEMPLATE_PRESETS: TemplatePreset[] = [
  // FDA Standard Formats - Each preset creates a nutrition box with the appropriate FDA format
  { type: 'standard-vertical', label: 'Standard Vertical (FDA)', width: 280, height: 550, description: '21 CFR 101.9(d)(12) - Classic FDA vertical format', nutritionFormat: 'standard-vertical' },
  { type: 'vertical-micronutrients', label: 'Vertical (Micronutrients Side)', width: 280, height: 550, description: '21 CFR 101.9(d)(12) - Vitamins/minerals side-by-side', nutritionFormat: 'vertical-micronutrients-side' },
  { type: 'tabular', label: 'Tabular', width: 650, height: 200, description: '21 CFR 101.9(d)(11)(iii) - Horizontal tabular format', nutritionFormat: 'tabular' },
  { type: 'dual-column', label: 'Dual Column (Per Serving/Container)', width: 320, height: 550, description: '21 CFR 101.9(e)(6)(i) - Per serving and per container', nutritionFormat: 'dual-column' },
  { type: 'tabular-dual-column', label: 'Tabular Dual Column', width: 700, height: 200, description: '21 CFR 101.9(e)(6)(ii) - Tabular with dual columns', nutritionFormat: 'tabular-dual-column' },
  { type: 'linear', label: 'Linear (Small Packages)', width: 500, height: 80, description: '21 CFR 101.9(j)(13)(ii)(A)(2) - Compact linear format', nutritionFormat: 'linear' },
  { type: 'simplified', label: 'Simplified', width: 250, height: 350, description: '21 CFR 101.9(f) - Simplified for simple foods', nutritionFormat: 'simplified' },
  // Age-specific formats
  { type: 'infants', label: 'Infants (0-12 months)', width: 260, height: 450, description: '21 CFR 101.9(j)(5)(ii)(B) - For infant foods', nutritionFormat: 'infants', dvAgeGroup: 'infants_0_12m' },
  { type: 'children-1-3', label: 'Children (1-3 years)', width: 260, height: 500, description: '21 CFR 101.9(j)(5)(iii)(A) - For toddler foods', nutritionFormat: 'children-1-3', dvAgeGroup: 'children_1_3' },
  // Bilingual formats - language pair will be based on user's language configuration
  { type: 'bilingual-vertical', label: 'Bilingual Vertical', width: 350, height: 600, description: 'Bilingual vertical - uses configured languages', nutritionFormat: 'standard-vertical', language: 'bilingual' },
  { type: 'bilingual-tabular', label: 'Bilingual Tabular', width: 700, height: 250, description: 'Bilingual tabular - uses configured languages', nutritionFormat: 'tabular', language: 'bilingual' },
];

// Available languages
const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English', nameNative: 'English', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nameNative: 'العربية', dir: 'rtl' },
  { code: 'hi', name: 'Hindi', nameNative: 'हिन्दी', dir: 'ltr' },
  { code: 'zh', name: 'Chinese', nameNative: '中文', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nameNative: 'Español', dir: 'ltr' },
  { code: 'fr', name: 'French', nameNative: 'Français', dir: 'ltr' },
  { code: 'ur', name: 'Urdu', nameNative: 'اردو', dir: 'rtl' },
  { code: 'bn', name: 'Bengali', nameNative: 'বাংলা', dir: 'ltr' },
];

// Default design settings
interface DesignSettings {
  fontFamily: string;
  fontSize: number;
  titleFontSize: number;
  borderWidth: number;
  borderColor: string;
  backgroundColor: string;
  textColor: string;
  headerBgColor: string;
  headerTextColor: string;
}

const DEFAULT_DESIGN: DesignSettings = {
  fontFamily: 'Arial',
  fontSize: 10,
  titleFontSize: 18,
  borderWidth: 2,
  borderColor: '#000000',
  backgroundColor: '#ffffff',
  textColor: '#000000',
  headerBgColor: '#1a365d',
  headerTextColor: '#ffffff',
};

// Drag state interface
interface DragState {
  isDragging: boolean;
  elementId: string | null;
  startX: number;
  startY: number;
  elementStartX: number;
  elementStartY: number;
}

// Resize state interface
interface ResizeState {
  isResizing: boolean;
  elementId: string | null;
  handle: string;
  startX: number;
  startY: number;
  elementStartWidth: number;
  elementStartHeight: number;
  elementStartX: number;
  elementStartY: number;
}

export default function LabelBuilderPage() {
  const { templateId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);

  const productId = searchParams.get('product');

  // State
  const [templateName, setTemplateName] = useState('Untitled Template');
  const [canvasWidth, setCanvasWidth] = useState(400);
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [canvasShape, setCanvasShape] = useState<CanvasShape>('rectangle');
  const [cornerRadius, setCornerRadius] = useState(20);
  const [canvasBgColor, setCanvasBgColor] = useState('#ffffff');
  const [canvasBorderColor, setCanvasBorderColor] = useState('#d1d5db');
  const [canvasBorderWidth, setCanvasBorderWidth] = useState(1);
  // Local input state for controlled inputs (to avoid jumping values)
  const [widthInput, setWidthInput] = useState('400');
  const [heightInput, setHeightInput] = useState('600');
  const [elements, setElements] = useState<LabelElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [languageMode, setLanguageMode] = useState<'single' | 'multi'>('single');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en']);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [designSettings, setDesignSettings] = useState<DesignSettings>(DEFAULT_DESIGN);
  const [showDesignPanel, setShowDesignPanel] = useState(false);
  const [showShapePanel, setShowShapePanel] = useState(false);

  // Computed language for components
  const language = languageMode === 'multi' && selectedLanguages.length >= 2
    ? 'bilingual'
    : selectedLanguages[0] || 'en';

  // Drag state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    elementId: null,
    startX: 0,
    startY: 0,
    elementStartX: 0,
    elementStartY: 0,
  });

  // Resize state
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    elementId: null,
    handle: '',
    startX: 0,
    startY: 0,
    elementStartWidth: 0,
    elementStartHeight: 0,
    elementStartX: 0,
    elementStartY: 0,
  });

  // Display preferences
  const [preferences, setPreferences] = useState({
    hideIngredients: false,
    hideAllergens: false,
    hideBusinessDetails: false,
    preferSodiumOverSalt: true,
    preferCalorieOverJoule: true,
  });

  // Load existing template
  const { data: template } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => templatesApi.get(templateId!),
    enabled: !!templateId,
  });

  // Load product for preview
  const { data: product } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productsApi.get(productId!),
    enabled: !!productId,
  });

  // Load product nutrition
  const { data: nutrition } = useQuery({
    queryKey: ['product-nutrition', productId],
    queryFn: () => productsApi.getNutrition(productId!),
    enabled: !!productId,
  });

  // Initialize from template
  useEffect(() => {
    if (template) {
      setTemplateName(template.name);
      setCanvasWidth(template.width);
      setCanvasHeight(template.height);
      // Load shape settings
      if (template.shape) {
        setCanvasShape(template.shape as CanvasShape);
      }
      if (template.corner_radius !== undefined) {
        setCornerRadius(template.corner_radius);
      }
      // Load canvas style settings
      if (template.styles) {
        const styles = template.styles as unknown as Record<string, unknown>;
        if (styles.canvasBgColor) {
          setCanvasBgColor(styles.canvasBgColor as string);
        }
        if (styles.canvasBorderColor) {
          setCanvasBorderColor(styles.canvasBorderColor as string);
        }
        if (styles.canvasBorderWidth !== undefined) {
          setCanvasBorderWidth(styles.canvasBorderWidth as number);
        }
      }
      setElements(template.elements || []);
      if (template.language === 'bilingual') {
        setLanguageMode('multi');
        setSelectedLanguages(['en', 'ar']);
      } else {
        setLanguageMode('single');
        setSelectedLanguages([template.language || 'en']);
      }
      if (template.display_preferences) {
        setPreferences((prev) => ({ ...prev, ...template.display_preferences }));
      }
    }
  }, [template]);

  // Sync input fields when canvas dimensions change from external sources (presets, etc.)
  useEffect(() => {
    setWidthInput(String(canvasWidth));
  }, [canvasWidth]);

  useEffect(() => {
    setHeightInput(String(canvasHeight));
  }, [canvasHeight]);

  // Handle mouse move for dragging and resizing
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragState.isDragging && dragState.elementId) {
        const deltaX = (e.clientX - dragState.startX) / zoom;
        const deltaY = (e.clientY - dragState.startY) / zoom;

        setElements((els) =>
          els.map((el) =>
            el.id === dragState.elementId
              ? {
                  ...el,
                  x: Math.max(0, Math.min(canvasWidth - el.width, dragState.elementStartX + deltaX)),
                  y: Math.max(0, Math.min(canvasHeight - el.height, dragState.elementStartY + deltaY)),
                }
              : el
          )
        );
      }

      if (resizeState.isResizing && resizeState.elementId) {
        const deltaX = (e.clientX - resizeState.startX) / zoom;
        const deltaY = (e.clientY - resizeState.startY) / zoom;

        setElements((els) =>
          els.map((el) => {
            if (el.id !== resizeState.elementId) return el;

            let newWidth = el.width;
            let newHeight = el.height;
            let newX = el.x;
            let newY = el.y;

            // Handle different resize handles
            if (resizeState.handle.includes('e')) {
              newWidth = Math.max(50, resizeState.elementStartWidth + deltaX);
            }
            if (resizeState.handle.includes('w')) {
              newWidth = Math.max(50, resizeState.elementStartWidth - deltaX);
              newX = resizeState.elementStartX + deltaX;
            }
            if (resizeState.handle.includes('s')) {
              newHeight = Math.max(20, resizeState.elementStartHeight + deltaY);
            }
            if (resizeState.handle.includes('n')) {
              newHeight = Math.max(20, resizeState.elementStartHeight - deltaY);
              newY = resizeState.elementStartY + deltaY;
            }

            return { ...el, width: newWidth, height: newHeight, x: newX, y: newY };
          })
        );
      }
    },
    [dragState, resizeState, zoom, canvasWidth, canvasHeight]
  );

  // Snap value to grid
  const snapToGrid = (value: number, gridSize: number = 10) => {
    return Math.round(value / gridSize) * gridSize;
  };

  // Check if two elements overlap
  const elementsOverlap = (el1: LabelElement, el2: LabelElement) => {
    return !(
      el1.x + el1.width <= el2.x ||
      el2.x + el2.width <= el1.x ||
      el1.y + el1.height <= el2.y ||
      el2.y + el2.height <= el1.y
    );
  };

  // Auto-align element to avoid overlaps
  const autoAlignElement = (
    movedElement: LabelElement,
    allElements: LabelElement[]
  ): LabelElement => {
    const otherElements = allElements.filter((el) => el.id !== movedElement.id);
    let aligned = { ...movedElement };

    // Snap to grid first
    aligned.x = snapToGrid(aligned.x);
    aligned.y = snapToGrid(aligned.y);

    // Check for overlaps and find best position
    let hasOverlap = otherElements.some((el) => elementsOverlap(aligned, el));

    if (hasOverlap) {
      // Find the closest non-overlapping position
      // Try moving down first (most common case)
      let bestY = aligned.y;

      for (const other of otherElements) {
        if (elementsOverlap(aligned, other)) {
          // Check if we're closer to top or bottom of the other element
          const distToTop = Math.abs(aligned.y + aligned.height - other.y);
          const distToBottom = Math.abs(aligned.y - (other.y + other.height));

          if (distToTop < distToBottom) {
            // Snap above the other element
            bestY = Math.min(bestY, other.y - aligned.height - 5);
          } else {
            // Snap below the other element
            bestY = Math.max(bestY, other.y + other.height + 5);
          }
        }
      }

      aligned.y = snapToGrid(Math.max(0, Math.min(canvasHeight - aligned.height, bestY)));

      // If still overlapping, try horizontal adjustment
      hasOverlap = otherElements.some((el) => elementsOverlap(aligned, el));
      if (hasOverlap) {
        for (const other of otherElements) {
          if (elementsOverlap(aligned, other)) {
            // Move to right of the element
            aligned.x = snapToGrid(other.x + other.width + 5);
            if (aligned.x + aligned.width > canvasWidth) {
              // If doesn't fit, move below instead
              aligned.x = snapToGrid(movedElement.x);
              aligned.y = snapToGrid(other.y + other.height + 5);
            }
          }
        }
      }
    }

    // Ensure within canvas bounds
    aligned.x = Math.max(0, Math.min(canvasWidth - aligned.width, aligned.x));
    aligned.y = Math.max(0, Math.min(canvasHeight - aligned.height, aligned.y));

    return aligned;
  };

  // Handle mouse up to stop dragging/resizing
  const handleMouseUp = useCallback(() => {
    // Auto-align on drop
    if (dragState.isDragging && dragState.elementId) {
      setElements((els) => {
        const movedElement = els.find((el) => el.id === dragState.elementId);
        if (!movedElement) return els;

        const alignedElement = autoAlignElement(movedElement, els);
        return els.map((el) =>
          el.id === dragState.elementId ? alignedElement : el
        );
      });
    }

    setDragState((prev) => ({ ...prev, isDragging: false, elementId: null }));
    setResizeState((prev) => ({ ...prev, isResizing: false, elementId: null }));
  }, [dragState.isDragging, dragState.elementId, canvasWidth, canvasHeight]);

  // Add global mouse event listeners
  useEffect(() => {
    if (dragState.isDragging || resizeState.isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, resizeState.isResizing, handleMouseMove, handleMouseUp]);

  // Start dragging an element
  const startDrag = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    const element = elements.find((el) => el.id === elementId);
    if (!element) return;

    setSelectedElement(elementId);
    setDragState({
      isDragging: true,
      elementId,
      startX: e.clientX,
      startY: e.clientY,
      elementStartX: element.x,
      elementStartY: element.y,
    });
  };

  // Start resizing an element
  const startResize = (e: React.MouseEvent, elementId: string, handle: string) => {
    e.stopPropagation();
    const element = elements.find((el) => el.id === elementId);
    if (!element) return;

    setResizeState({
      isResizing: true,
      elementId,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      elementStartWidth: element.width,
      elementStartHeight: element.height,
      elementStartX: element.x,
      elementStartY: element.y,
    });
  };

  // Save template mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        name: templateName,
        type: 'vertical',
        width: canvasWidth,
        height: canvasHeight,
        shape: canvasShape,
        corner_radius: cornerRadius,
        language,
        elements,
        display_preferences: preferences,
        styles: {
          ...designSettings,
          canvasBgColor,
          canvasBorderColor,
          canvasBorderWidth,
        },
      };

      if (templateId && !template?.is_preset) {
        return templatesApi.update(templateId, data);
      } else {
        return templatesApi.create(data);
      }
    },
    onSuccess: (result) => {
      toast.success('Template saved!');
      if (!templateId) {
        navigate(`/label-builder/${result.id}`, { replace: true });
      }
    },
    onError: () => toast.error('Failed to save template'),
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async (format: 'png' | 'pdf' | 'svg') => {
      if (!productId || !templateId) {
        throw new Error('Select a product and save template first');
      }
      return labelsApi.export({
        product_id: productId,
        template_id: templateId,
        format,
      });
    },
    onSuccess: (blob, format) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `label.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()}`);
    },
    onError: (error: Error) => toast.error(error.message || 'Export failed'),
  });

  // Clear all elements
  const clearAllElements = () => {
    setElements([]);
    setSelectedElement(null);
  };

  // Auto-arrange elements vertically
  const autoArrangeElements = () => {
    if (elements.length === 0) return;

    const GAP = 15; // Gap between elements
    let currentY = 20;

    setElements((els) => {
      // Sort by current Y position to maintain relative order
      const sorted = [...els].sort((a, b) => a.y - b.y);

      return sorted.map((el) => {
        const newEl = {
          ...el,
          x: 20,
          y: currentY,
        };
        currentY += el.height + GAP;
        return newEl;
      });
    });
  };

  // Add element to canvas
  const addElement = (type: string) => {
    // Determine element dimensions based on type
    const getElementDimensions = () => {
      switch (type) {
        case 'nutrition-box':
          return { width: Math.min(canvasWidth - 40, 360), height: Math.min(280, canvasHeight - 40) };
        case 'line':
          return { width: canvasWidth - 40, height: 6 };
        case 'ingredients-list':
          return { width: Math.min(canvasWidth - 40, 360), height: 45 };
        case 'allergens':
          return { width: Math.min(canvasWidth - 40, 300), height: 30 };
        case 'business-info':
          return { width: Math.min(canvasWidth - 40, 280), height: 65 };
        case 'text':
          return { width: Math.min(canvasWidth - 40, 200), height: 24 };
        case 'logo':
          return { width: 80, height: 80 };
        case 'traffic-light':
          return { width: Math.min(canvasWidth - 40, 380), height: 140 };
        case 'curved-text':
          return { width: 200, height: 100 };
        default:
          return { width: Math.min(canvasWidth - 40, 200), height: 35 };
      }
    };

    const dims = getElementDimensions();
    const GAP = 15; // Gap between elements

    // Simple stacking algorithm - find the lowest point and place below
    let newX = 20;
    let newY = 20;

    if (elements.length > 0) {
      // Find the bottom of the lowest element
      let maxBottom = 0;
      elements.forEach((el) => {
        const elBottom = el.y + el.height;
        if (elBottom > maxBottom) {
          maxBottom = elBottom;
        }
      });

      // Place new element below with proper gap
      newY = maxBottom + GAP;

      // If it doesn't fit, try to find a gap or place at a reasonable position
      if (newY + dims.height > canvasHeight) {
        // Try to find horizontal space next to existing elements
        let foundSpace = false;
        for (const existingEl of elements) {
          const rightOfEl = existingEl.x + existingEl.width + GAP;
          if (rightOfEl + dims.width <= canvasWidth - 20) {
            // Check if this space is clear
            const testRect = { x: rightOfEl, y: existingEl.y, width: dims.width, height: dims.height };
            const hasOverlap = elements.some((el) => {
              return !(
                testRect.x + testRect.width <= el.x ||
                el.x + el.width <= testRect.x ||
                testRect.y + testRect.height <= el.y ||
                el.y + el.height <= testRect.y
              );
            });
            if (!hasOverlap) {
              newX = rightOfEl;
              newY = existingEl.y;
              foundSpace = true;
              break;
            }
          }
        }

        // If still no space, just place at the bottom
        if (!foundSpace) {
          newY = maxBottom + GAP;
        }
      }
    }

    // Get default properties based on element type
    // NOTE: We don't store designSettings values in properties so elements inherit from design settings
    const getDefaultProperties = () => {
      switch (type) {
        case 'nutrition-box':
          return {};
        case 'text':
          return {
            text: 'Click to edit text...',
            textAlign: 'left',
          };
        case 'line':
          return {
            thickness: 2,
          };
        case 'allergens':
          return {
            bgColor: '#fff3cd',
            textColor: '#856404',
            borderColor: '#ffc107',
            label: 'Contains',
            allergens: 'Milk, Wheat, Soy',
          };
        case 'business-info':
          return {
            companyName: 'Company Name',
            address: '123 Street, City',
            showAddress: true,
          };
        case 'traffic-light':
          return {
            style: 'boxes',
            showRI: true,
            language: 'en',
          };
        case 'logo':
          return {
            bgColor: 'transparent',
            objectFit: 'contain',
            opacity: 100,
          };
        case 'curved-text':
          return {
            text: 'CURVED TEXT',
            placement: 'top',
            fontSize: 16,
            fontWeight: 'bold',
            letterSpacing: 2,
          };
        default:
          return {};
      }
    };

    const newElement: LabelElement = {
      id: `${type}-${Date.now()}`,
      type: type as LabelElement['type'],
      x: newX,
      y: newY,
      width: dims.width,
      height: dims.height,
      properties: getDefaultProperties(),
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  // Apply preset - creates canvas and elements with proper nutrition format
  const applyPreset = (preset: TemplatePreset) => {
    setCanvasWidth(preset.width);
    setCanvasHeight(preset.height);

    // Apply shape from preset
    if (preset.shape) {
      setCanvasShape(preset.shape);
      if (preset.cornerRadius !== undefined) {
        setCornerRadius(preset.cornerRadius);
      }
    } else {
      setCanvasShape('rectangle');
    }

    // Apply language settings from preset
    if (preset.language === 'bilingual') {
      setLanguageMode('multi');
      setSelectedLanguages(['en', 'ar']);
    } else {
      setLanguageMode('single');
      setSelectedLanguages(['en']);
    }

    // Build nutrition box properties from preset
    const nutritionBoxProps: Record<string, unknown> = {
      format: preset.nutritionFormat || 'standard-vertical',
      dvRegion: 'fda_us',
      dvBaselineCalories: preset.dvAgeGroup === 'children_1_3' ? 1000 : preset.dvAgeGroup === 'infants_0_12m' ? 820 : 2000,
      servingsPerContainer: 8,
      showFootnote: true,
      showDailyValue: true,
    };

    // Determine layout based on preset format
    const padding = 10;
    const fullWidth = preset.width - (padding * 2);

    // Calculate nutrition box height based on format type
    let nutritionBoxHeight: number;
    switch (preset.nutritionFormat) {
      case 'linear':
        nutritionBoxHeight = preset.height - (padding * 2); // Linear takes full height
        break;
      case 'tabular':
      case 'tabular-dual-column':
        nutritionBoxHeight = preset.height - (padding * 2); // Tabular takes full height
        break;
      case 'simplified':
        nutritionBoxHeight = Math.min(320, preset.height - (padding * 2));
        break;
      default:
        nutritionBoxHeight = Math.min(480, preset.height - (padding * 2));
    }

    // Create elements - for label formats, just create the nutrition box
    const newElements: LabelElement[] = [];

    // Nutrition box - positioned to fit the canvas
    newElements.push({
      id: `nutrition-box-${preset.type}`,
      type: 'nutrition-box',
      x: padding,
      y: padding,
      width: fullWidth,
      height: nutritionBoxHeight,
      properties: nutritionBoxProps,
    });

    setElements(newElements);
    setSelectedElement(null);
  };

  // Delete selected element
  const deleteSelected = () => {
    if (selectedElement) {
      setElements((els) => els.filter((el) => el.id !== selectedElement));
      setSelectedElement(null);
    }
  };

  // Bring element forward (higher z-index)
  const bringForward = () => {
    if (!selectedElement) return;
    const index = elements.findIndex((el) => el.id === selectedElement);
    if (index < elements.length - 1) {
      const newElements = [...elements];
      [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]];
      setElements(newElements);
    }
  };

  // Send element backward (lower z-index)
  const sendBackward = () => {
    if (!selectedElement) return;
    const index = elements.findIndex((el) => el.id === selectedElement);
    if (index > 0) {
      const newElements = [...elements];
      [newElements[index], newElements[index - 1]] = [newElements[index - 1], newElements[index]];
      setElements(newElements);
    }
  };

  // Bring element to front
  const bringToFront = () => {
    if (!selectedElement) return;
    const element = elements.find((el) => el.id === selectedElement);
    if (element) {
      setElements([...elements.filter((el) => el.id !== selectedElement), element]);
    }
  };

  // Send element to back
  const sendToBack = () => {
    if (!selectedElement) return;
    const element = elements.find((el) => el.id === selectedElement);
    if (element) {
      setElements([element, ...elements.filter((el) => el.id !== selectedElement)]);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElement && document.activeElement?.tagName !== 'INPUT') {
          deleteSelected();
        }
      }
      if (e.key === 'Escape') {
        setSelectedElement(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement]);

  const selectedElementData = elements.find((e) => e.id === selectedElement);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="text-lg font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-500 outline-none px-1"
          />
          {template?.is_preset && (
            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
              Preset (Read Only)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
            className="p-2 hover:bg-gray-100 rounded"
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-sm text-gray-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
            className="p-2 hover:bg-gray-100 rounded"
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
          <div className="w-px h-6 bg-gray-200 mx-2" />
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || template?.is_preset}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm disabled:opacity-50"
          >
            <Save size={16} />
            Save
          </button>
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm">
              <Download size={16} />
              Export
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => exportMutation.mutate('png')}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
              >
                PNG Image
              </button>
              <button
                onClick={() => exportMutation.mutate('pdf')}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
              >
                PDF Document
              </button>
              <button
                onClick={() => exportMutation.mutate('svg')}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
              >
                SVG Vector
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Elements */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Elements</h3>
            <div className="space-y-2">
              {ELEMENT_TYPES.map((el) => (
                <button
                  key={el.type}
                  onClick={() => addElement(el.type)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <el.icon size={16} className="text-gray-500" />
                  {el.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Presets</h3>
            <div className="space-y-2">
              {TEMPLATE_PRESETS.map((preset) => (
                <button
                  key={preset.type}
                  onClick={() => applyPreset(preset)}
                  className="w-full px-3 py-2 text-sm text-left border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  {preset.label}
                  <span className="text-xs text-gray-400 ml-1">
                    ({preset.width}×{preset.height})
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Canvas Actions</h3>
            <div className="space-y-2">
              <button
                onClick={autoArrangeElements}
                disabled={elements.length === 0}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Auto Arrange Elements
              </button>
              <button
                onClick={clearAllElements}
                disabled={elements.length === 0}
                className="w-full px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear Canvas
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Globe size={14} />
              Language
            </h3>
            <div className="space-y-2">
              {languageMode === 'single' ? (
                <select
                  value={selectedLanguages[0] || 'en'}
                  onChange={(e) => setSelectedLanguages([e.target.value])}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                >
                  {AVAILABLE_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name} ({lang.nameNative})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-1">
                  <div className="text-xs text-gray-600 font-medium">
                    Bilingual: {selectedLanguages.slice(0, 2).map((code) =>
                      AVAILABLE_LANGUAGES.find((l) => l.code === code)?.name
                    ).join(' + ')}
                  </div>
                  <button
                    onClick={() => setShowLanguageModal(true)}
                    className="w-full py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center gap-1"
                  >
                    <Settings size={12} />
                    Configure Languages
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Palette size={14} />
              Design
            </h3>
            <button
              onClick={() => setShowDesignPanel(!showDesignPanel)}
              className="w-full py-2 text-xs border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center gap-1"
            >
              <Settings size={12} />
              {showDesignPanel ? 'Hide' : 'Show'} Design Settings
            </button>

            {showDesignPanel && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Font Family</label>
                  <select
                    value={designSettings.fontFamily}
                    onChange={(e) => setDesignSettings((s) => ({ ...s, fontFamily: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Font Size</label>
                    <input
                      type="number"
                      value={designSettings.fontSize}
                      onChange={(e) => setDesignSettings((s) => ({ ...s, fontSize: parseInt(e.target.value) || 10 }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Title Size</label>
                    <input
                      type="number"
                      value={designSettings.titleFontSize}
                      onChange={(e) => setDesignSettings((s) => ({ ...s, titleFontSize: parseInt(e.target.value) || 18 }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Border Width</label>
                    <input
                      type="number"
                      value={designSettings.borderWidth}
                      onChange={(e) => setDesignSettings((s) => ({ ...s, borderWidth: parseInt(e.target.value) || 2 }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Border Color</label>
                    <input
                      type="color"
                      value={designSettings.borderColor}
                      onChange={(e) => setDesignSettings((s) => ({ ...s, borderColor: e.target.value }))}
                      className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Background</label>
                    <input
                      type="color"
                      value={designSettings.backgroundColor}
                      onChange={(e) => setDesignSettings((s) => ({ ...s, backgroundColor: e.target.value }))}
                      className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Text Color</label>
                    <input
                      type="color"
                      value={designSettings.textColor}
                      onChange={(e) => setDesignSettings((s) => ({ ...s, textColor: e.target.value }))}
                      className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Header Bg</label>
                    <input
                      type="color"
                      value={designSettings.headerBgColor}
                      onChange={(e) => setDesignSettings((s) => ({ ...s, headerBgColor: e.target.value }))}
                      className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Header Text</label>
                    <input
                      type="color"
                      value={designSettings.headerTextColor}
                      onChange={(e) => setDesignSettings((s) => ({ ...s, headerTextColor: e.target.value }))}
                      className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setDesignSettings(DEFAULT_DESIGN)}
                  className="w-full py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50"
                >
                  Reset to Defaults
                </button>
              </div>
            )}
          </div>

          {/* Shape Panel */}
          <div className="border-t border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Square size={14} />
              Label Shape
            </h3>
            <button
              onClick={() => setShowShapePanel(!showShapePanel)}
              className="w-full py-2 text-xs border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center gap-1"
            >
              <Settings size={12} />
              {showShapePanel ? 'Hide' : 'Show'} Shape Settings
            </button>

            {showShapePanel && (
              <div className="mt-3 space-y-3">
                {/* Shape Selection */}
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">Canvas Shape</label>
                  <div className="grid grid-cols-5 gap-1">
                    {CANVAS_SHAPES.map((shape) => (
                      <button
                        key={shape.id}
                        onClick={() => {
                          setCanvasShape(shape.id);
                        }}
                        className={`p-2 text-lg rounded border transition-colors ${
                          canvasShape === shape.id
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        title={shape.label}
                      >
                        {shape.icon}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Current: {CANVAS_SHAPES.find(s => s.id === canvasShape)?.label}
                  </p>
                </div>

                {/* Corner Radius (only for rounded-rect) */}
                {canvasShape === 'rounded-rect' && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Corner Radius: {cornerRadius}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max={Math.min(canvasWidth, canvasHeight) / 2}
                      value={cornerRadius}
                      onChange={(e) => setCornerRadius(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Canvas Size */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Width</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={widthInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setWidthInput(val);
                      }}
                      onBlur={() => {
                        const newWidth = Math.max(100, Math.min(1200, parseInt(widthInput) || 100));
                        setCanvasWidth(newWidth);
                        setWidthInput(String(newWidth));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const newWidth = Math.max(100, Math.min(1200, parseInt(widthInput) || 100));
                          setCanvasWidth(newWidth);
                          setWidthInput(String(newWidth));
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Height</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={heightInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setHeightInput(val);
                      }}
                      onBlur={() => {
                        const newHeight = Math.max(100, Math.min(1200, parseInt(heightInput) || 100));
                        setCanvasHeight(newHeight);
                        setHeightInput(String(newHeight));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const newHeight = Math.max(100, Math.min(1200, parseInt(heightInput) || 100));
                          setCanvasHeight(newHeight);
                          setHeightInput(String(newHeight));
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400">Press Enter or click outside to apply</p>

                {/* Background & Border Colors */}
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <label className="text-xs text-gray-500 font-medium block">Colors</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-400 mb-1 block">Background</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={canvasBgColor}
                          onChange={(e) => setCanvasBgColor(e.target.value)}
                          className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={canvasBgColor}
                          onChange={(e) => setCanvasBgColor(e.target.value)}
                          className="flex-1 px-1 py-0.5 text-[10px] border border-gray-300 rounded uppercase"
                          maxLength={7}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 mb-1 block">Border</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={canvasBorderColor}
                          onChange={(e) => setCanvasBorderColor(e.target.value)}
                          className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={canvasBorderColor}
                          onChange={(e) => setCanvasBorderColor(e.target.value)}
                          className="flex-1 px-1 py-0.5 text-[10px] border border-gray-300 rounded uppercase"
                          maxLength={7}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 mb-1 block">
                      Border Width: {canvasBorderWidth}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={canvasBorderWidth}
                      onChange={(e) => setCanvasBorderWidth(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Shape Info */}
                {canvasShape !== 'rectangle' && (
                  <div className="p-2 bg-amber-50 rounded text-[10px] text-amber-700">
                    <strong>Note:</strong> Content outside the {canvasShape} shape will be clipped on export.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Display Options</h3>
            <div className="space-y-2">
              {[
                { key: 'hideIngredients', label: 'Hide Ingredients' },
                { key: 'hideAllergens', label: 'Hide Allergens' },
                { key: 'hideBusinessDetails', label: 'Hide Business' },
              ].map((pref) => (
                <label key={pref.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(preferences as Record<string, boolean>)[pref.key]}
                    onChange={(e) =>
                      setPreferences((p) => ({
                        ...p,
                        [pref.key]: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  {pref.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div
          className="flex-1 bg-gray-100 overflow-auto p-8"
          onClick={() => setSelectedElement(null)}
        >
          <div
            ref={canvasRef}
            className="mx-auto shadow-lg relative overflow-hidden"
            style={{
              width: canvasWidth,
              height: canvasHeight,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              marginBottom: canvasHeight * (zoom - 1),
              marginRight: canvasWidth * (zoom - 1),
              clipPath: getCanvasClipPath(canvasShape, canvasWidth, canvasHeight, cornerRadius),
              borderRadius: canvasShape === 'rounded-rect' ? `${cornerRadius}px` : '0',
              backgroundColor: canvasBgColor,
              border: `${canvasBorderWidth}px solid ${canvasBorderColor}`,
            }}
          >
            {/* Render elements */}
            {elements.map((el, index) => (
              <div
                key={el.id}
                onMouseDown={(e) => startDrag(e, el.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedElement(el.id);
                }}
                className={`absolute ${
                  dragState.isDragging && dragState.elementId === el.id
                    ? 'cursor-grabbing shadow-xl opacity-90'
                    : 'cursor-grab'
                } ${
                  selectedElement === el.id
                    ? 'ring-2 ring-primary-500 ring-offset-2'
                    : 'hover:ring-1 hover:ring-primary-300'
                }`}
                style={{
                  left: el.x,
                  top: el.y,
                  width: el.width,
                  height: el.height,
                  backgroundColor: el.type === 'line' || el.type === 'text' || el.type === 'logo'
                    ? 'transparent'
                    : String(el.properties?.bgColor || 'transparent'),
                  zIndex: dragState.isDragging && dragState.elementId === el.id
                    ? 100
                    : selectedElement === el.id
                      ? 10
                      : index + 1,
                }}
              >
                {/* Element content */}
                <div className={`w-full h-full ${el.type === 'curved-text' ? 'overflow-visible' : 'overflow-hidden'}`}>
                  {el.type === 'nutrition-box' && (
                    <NutritionBoxPreview
                      nutrition={nutrition}
                      language={language}
                      selectedLanguages={selectedLanguages}
                      selectedNutrients={el.properties?.selectedNutrients as string[] | undefined}
                      dvBaselineCalories={Number(el.properties?.dvBaselineCalories || 2000)}
                      servingSize={Number(el.properties?.servingSize || nutrition?.serving_size || 100)}
                      servingUnit={String(el.properties?.servingUnit || nutrition?.serving_unit || 'g')}
                      servingDescription={el.properties?.servingDescription ? String(el.properties.servingDescription) : undefined}
                      servingsPerContainer={Number(el.properties?.servingsPerContainer || 1)}
                      showDailyValue={el.properties?.showDailyValue !== false}
                      showFootnote={el.properties?.showFootnote !== false}
                      format={(el.properties?.format as NutritionLabelFormat) || 'standard-vertical'}
                      styles={{
                        fontFamily: String(el.properties?.fontFamily || designSettings.fontFamily),
                        fontSize: Number(el.properties?.fontSize || designSettings.fontSize),
                        titleFontSize: Number(el.properties?.titleFontSize || designSettings.titleFontSize),
                        borderColor: String(el.properties?.borderColor || designSettings.borderColor),
                        borderWidth: Number(el.properties?.borderWidth || designSettings.borderWidth),
                        bgColor: String(el.properties?.bgColor || designSettings.backgroundColor),
                        textColor: String(el.properties?.textColor || designSettings.textColor),
                      }}
                    />
                  )}
                  {el.type === 'ingredients-list' && (
                    <div className="h-full text-xs p-2 border border-dashed border-gray-400 bg-gray-50 rounded">
                      <strong>Ingredients:</strong> {product?.name || 'Sample ingredients list...'}
                    </div>
                  )}
                  {el.type === 'allergens' && (
                    <div
                      className="h-full text-xs p-2 overflow-hidden rounded"
                      style={{
                        backgroundColor: String(el.properties?.bgColor || '#fff3cd'),
                        color: String(el.properties?.textColor || '#856404'),
                        borderWidth: Number(el.properties?.borderWidth || 1),
                        borderStyle: 'solid',
                        borderColor: String(el.properties?.borderColor || '#ffc107'),
                        fontFamily: String(el.properties?.fontFamily || 'Arial'),
                        fontSize: `${Number(el.properties?.fontSize || 10)}px`,
                      }}
                    >
                      <strong>{String(el.properties?.label || 'Contains')}:</strong>{' '}
                      {String(el.properties?.allergens || 'Milk, Wheat, Soy')}
                    </div>
                  )}
                  {el.type === 'text' && (
                    <div
                      className="h-full p-1 overflow-hidden whitespace-pre-wrap border border-transparent hover:border-gray-300 rounded"
                      style={{
                        backgroundColor: String(el.properties?.bgColor || 'transparent'),
                        color: String(el.properties?.textColor || '#000000'),
                        fontFamily: String(el.properties?.fontFamily || 'Arial'),
                        fontSize: `${Number(el.properties?.fontSize || 12)}px`,
                        fontWeight: el.properties?.bold ? 'bold' : 'normal',
                        fontStyle: el.properties?.italic ? 'italic' : 'normal',
                        textAlign: (el.properties?.textAlign as 'left' | 'center' | 'right') || 'left',
                      }}
                    >
                      {String(el.properties?.text || 'Click to edit text...')}
                    </div>
                  )}
                  {el.type === 'line' && (
                    <div className="w-full h-full flex items-center px-1">
                      <div
                        className="w-full"
                        style={{
                          height: `${Number(el.properties?.thickness || 2)}px`,
                          backgroundColor: String(el.properties?.color || '#000000'),
                          borderRadius: el.properties?.rounded ? '2px' : '0',
                        }}
                      />
                    </div>
                  )}
                  {el.type === 'business-info' && (
                    <div
                      className="h-full p-2 overflow-hidden border border-gray-300 rounded"
                      style={{
                        backgroundColor: String(el.properties?.bgColor || '#ffffff'),
                        color: String(el.properties?.textColor || '#000000'),
                        fontFamily: String(el.properties?.fontFamily || 'Arial'),
                        fontSize: `${Number(el.properties?.fontSize || 10)}px`,
                        textAlign: (el.properties?.textAlign as 'left' | 'center' | 'right') || 'left',
                      }}
                    >
                      <div style={{ fontWeight: 'bold' }}>{String(el.properties?.companyName || 'Company Name')}</div>
                      {el.properties?.showAddress !== false && (
                        <div>{String(el.properties?.address || '123 Street, City')}</div>
                      )}
                      {el.properties?.phone ? <div>Tel: {String(el.properties.phone)}</div> : null}
                      {el.properties?.email ? <div>{String(el.properties.email)}</div> : null}
                      {el.properties?.website ? <div>{String(el.properties.website)}</div> : null}
                    </div>
                  )}
                  {el.type === 'logo' && (
                    <div
                      className="h-full w-full flex items-center justify-center overflow-hidden rounded"
                      style={{
                        backgroundColor: String(el.properties?.bgColor || 'transparent'),
                        border: el.properties?.showBorder ? `1px solid ${String(el.properties?.borderColor || '#cccccc')}` : 'none',
                        borderRadius: `${Number(el.properties?.borderRadius || 0)}px`,
                      }}
                    >
                      {el.properties?.imageUrl ? (
                        <img
                          src={String(el.properties.imageUrl)}
                          alt="Logo"
                          className="max-w-full max-h-full"
                          style={{
                            objectFit: (el.properties?.objectFit as 'contain' | 'cover' | 'fill') || 'contain',
                            opacity: Number(el.properties?.opacity || 100) / 100,
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400 text-xs">
                          <Image size={24} className="mb-1" />
                          <span>Upload Logo</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Resize handles (only show when selected) */}
                {selectedElement === el.id && (
                  <>
                    {/* Corner handles */}
                    <div
                      className="absolute -top-1 -left-1 w-3 h-3 bg-primary-500 border border-white cursor-nw-resize rounded-sm"
                      onMouseDown={(e) => startResize(e, el.id, 'nw')}
                    />
                    <div
                      className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 border border-white cursor-ne-resize rounded-sm"
                      onMouseDown={(e) => startResize(e, el.id, 'ne')}
                    />
                    <div
                      className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary-500 border border-white cursor-sw-resize rounded-sm"
                      onMouseDown={(e) => startResize(e, el.id, 'sw')}
                    />
                    <div
                      className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary-500 border border-white cursor-se-resize rounded-sm"
                      onMouseDown={(e) => startResize(e, el.id, 'se')}
                    />
                    {/* Edge handles */}
                    <div
                      className="absolute top-1/2 -left-1 w-2 h-4 -translate-y-1/2 bg-primary-500 border border-white cursor-w-resize rounded-sm"
                      onMouseDown={(e) => startResize(e, el.id, 'w')}
                    />
                    <div
                      className="absolute top-1/2 -right-1 w-2 h-4 -translate-y-1/2 bg-primary-500 border border-white cursor-e-resize rounded-sm"
                      onMouseDown={(e) => startResize(e, el.id, 'e')}
                    />
                    <div
                      className="absolute -top-1 left-1/2 w-4 h-2 -translate-x-1/2 bg-primary-500 border border-white cursor-n-resize rounded-sm"
                      onMouseDown={(e) => startResize(e, el.id, 'n')}
                    />
                    <div
                      className="absolute -bottom-1 left-1/2 w-4 h-2 -translate-x-1/2 bg-primary-500 border border-white cursor-s-resize rounded-sm"
                      onMouseDown={(e) => startResize(e, el.id, 's')}
                    />

                    {/* Move indicator */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-[10px] px-1 py-0.5 rounded flex items-center gap-1">
                      <Move size={10} />
                      Drag to move
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Empty state */}
            {elements.length === 0 && (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <p className="mb-2">Click elements to add them</p>
                  <p className="text-sm">or select a preset</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Properties */}
        <div className="w-72 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Properties</h3>

            {selectedElementData ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500">Element Type</label>
                  <p className="font-medium capitalize">
                    {selectedElementData.type.replace('-', ' ')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Width</label>
                    <input
                      type="number"
                      value={Math.round(selectedElementData.width)}
                      onChange={(e) => {
                        const newW = parseInt(e.target.value) || 50;
                        setElements((els) =>
                          els.map((el) =>
                            el.id === selectedElement ? { ...el, width: newW } : el
                          )
                        );
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Height</label>
                    <input
                      type="number"
                      value={Math.round(selectedElementData.height)}
                      onChange={(e) => {
                        const newH = parseInt(e.target.value) || 20;
                        setElements((els) =>
                          els.map((el) =>
                            el.id === selectedElement ? { ...el, height: newH } : el
                          )
                        );
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </div>

                {/* Nutrition Box element properties */}
                {selectedElementData.type === 'nutrition-box' && (
                  <div className="space-y-3 border-t border-gray-200 pt-3">
                    <h4 className="text-xs font-semibold text-gray-600">Nutrition Box Settings</h4>

                    {/* Label Format Selector */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Label Format</label>
                      <select
                        value={String(selectedElementData.properties?.format || 'standard-vertical')}
                        onChange={(e) => {
                          setElements((els) =>
                            els.map((el) =>
                              el.id === selectedElement
                                ? { ...el, properties: { ...el.properties, format: e.target.value } }
                                : el
                            )
                          );
                        }}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded"
                      >
                        {NUTRITION_FORMAT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {NUTRITION_FORMAT_OPTIONS.find(o => o.value === (selectedElementData.properties?.format || 'standard-vertical'))?.description}
                      </p>
                    </div>

                    {/* Serving Information */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Serving Information</label>
                      <div className="space-y-2">
                        {/* Serving Size */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-gray-400 mb-0.5 block">Serving Size</label>
                            <input
                              type="number"
                              min="1"
                              value={Number(selectedElementData.properties?.servingSize || 100)}
                              onChange={(e) => {
                                setElements((els) =>
                                  els.map((el) =>
                                    el.id === selectedElement
                                      ? { ...el, properties: { ...el.properties, servingSize: parseInt(e.target.value) || 100 } }
                                      : el
                                  )
                                );
                              }}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 mb-0.5 block">Unit</label>
                            <select
                              value={String(selectedElementData.properties?.servingUnit || 'g')}
                              onChange={(e) => {
                                setElements((els) =>
                                  els.map((el) =>
                                    el.id === selectedElement
                                      ? { ...el, properties: { ...el.properties, servingUnit: e.target.value } }
                                      : el
                                  )
                                );
                              }}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            >
                              <option value="g">g (grams)</option>
                              <option value="ml">ml (milliliters)</option>
                              <option value="oz">oz (ounces)</option>
                              <option value="cup">cup</option>
                              <option value="tbsp">tbsp</option>
                              <option value="tsp">tsp</option>
                              <option value="piece">piece(s)</option>
                              <option value="serving">serving</option>
                            </select>
                          </div>
                        </div>

                        {/* Serving Description (optional) */}
                        <div>
                          <label className="text-[10px] text-gray-400 mb-0.5 block">Serving Description (optional)</label>
                          <input
                            type="text"
                            value={String(selectedElementData.properties?.servingDescription || '')}
                            onChange={(e) => {
                              setElements((els) =>
                                els.map((el) =>
                                  el.id === selectedElement
                                    ? { ...el, properties: { ...el.properties, servingDescription: e.target.value } }
                                    : el
                                )
                              );
                            }}
                            placeholder="e.g., About 2 cookies, 1 cup prepared"
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          />
                        </div>

                        {/* Servings Per Container */}
                        <div>
                          <label className="text-[10px] text-gray-400 mb-0.5 block">Servings Per Container</label>
                          <input
                            type="number"
                            min="1"
                            step="0.5"
                            value={Number(selectedElementData.properties?.servingsPerContainer || 1)}
                            onChange={(e) => {
                              setElements((els) =>
                                els.map((el) =>
                                  el.id === selectedElement
                                    ? { ...el, properties: { ...el.properties, servingsPerContainer: parseFloat(e.target.value) || 1 } }
                                    : el
                                )
                              );
                            }}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Display Options */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Display Options</label>
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedElementData.properties?.showServingSize !== false}
                            onChange={(e) => {
                              setElements((els) =>
                                els.map((el) =>
                                  el.id === selectedElement
                                    ? { ...el, properties: { ...el.properties, showServingSize: e.target.checked } }
                                    : el
                                )
                              );
                            }}
                            className="rounded border-gray-300"
                          />
                          Show Serving Size
                        </label>
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedElementData.properties?.showCalories !== false}
                            onChange={(e) => {
                              setElements((els) =>
                                els.map((el) =>
                                  el.id === selectedElement
                                    ? { ...el, properties: { ...el.properties, showCalories: e.target.checked } }
                                    : el
                                )
                              );
                            }}
                            className="rounded border-gray-300"
                          />
                          Show Calories
                        </label>
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedElementData.properties?.showDailyValue !== false}
                            onChange={(e) => {
                              setElements((els) =>
                                els.map((el) =>
                                  el.id === selectedElement
                                    ? { ...el, properties: { ...el.properties, showDailyValue: e.target.checked } }
                                    : el
                                )
                              );
                            }}
                            className="rounded border-gray-300"
                          />
                          Show % Daily Value
                        </label>
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedElementData.properties?.showFootnote !== false}
                            onChange={(e) => {
                              setElements((els) =>
                                els.map((el) =>
                                  el.id === selectedElement
                                    ? { ...el, properties: { ...el.properties, showFootnote: e.target.checked } }
                                    : el
                                )
                              );
                            }}
                            className="rounded border-gray-300"
                          />
                          Show Footnote
                        </label>
                      </div>
                    </div>

                    {/* Daily Value Baseline */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Daily Value Baseline (kcal/day)</label>
                      <input
                        type="number"
                        min="500"
                        max="5000"
                        step="100"
                        value={Number(selectedElementData.properties?.dvBaselineCalories || 2000)}
                        onChange={(e) => {
                          setElements((els) =>
                            els.map((el) =>
                              el.id === selectedElement
                                ? { ...el, properties: { ...el.properties, dvBaselineCalories: parseInt(e.target.value) || 2000, dvRegion: 'custom' } }
                                : el
                            )
                          );
                        }}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      />
                      <p className="text-[10px] text-gray-400 mt-0.5">Reference calorie intake for % daily value calculations</p>
                    </div>

                    {/* Nutrient Selection */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Nutrients to Display</label>
                      <details className="border border-gray-200 rounded">
                        <summary className="px-2 py-1.5 text-xs cursor-pointer hover:bg-gray-50 flex items-center gap-1">
                          <ChevronDown size={12} />
                          Configure Nutrients ({
                            (selectedElementData.properties?.selectedNutrients as string[] ||
                              NUTRIENT_DEFINITIONS.filter(n => n.required).map(n => n.key)
                            ).length
                          } selected)
                        </summary>
                        <div className="p-2 border-t border-gray-200 max-h-48 overflow-y-auto">
                          {/* Core Nutrients */}
                          <div className="mb-2">
                            <div className="text-[10px] font-semibold text-gray-500 mb-1">Core (Required)</div>
                            {NUTRIENT_DEFINITIONS.filter(n => n.category === 'core').map((nutrient) => (
                              <label key={nutrient.key} className="flex items-center gap-1.5 text-[11px] py-0.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={
                                    (selectedElementData.properties?.selectedNutrients as string[] ||
                                      NUTRIENT_DEFINITIONS.filter(n => n.required).map(n => n.key)
                                    ).includes(nutrient.key)
                                  }
                                  onChange={(e) => {
                                    const current = (selectedElementData.properties?.selectedNutrients as string[]) ||
                                      NUTRIENT_DEFINITIONS.filter(n => n.required).map(n => n.key);
                                    const updated = e.target.checked
                                      ? [...current, nutrient.key]
                                      : current.filter(k => k !== nutrient.key);
                                    setElements((els) =>
                                      els.map((el) =>
                                        el.id === selectedElement
                                          ? { ...el, properties: { ...el.properties, selectedNutrients: updated } }
                                          : el
                                      )
                                    );
                                  }}
                                  className="rounded border-gray-300"
                                />
                                <span style={{ paddingLeft: `${nutrient.indent * 8}px` }}>
                                  {nutrient.nameEn}
                                </span>
                              </label>
                            ))}
                          </div>

                          {/* Vitamins & Minerals */}
                          <div className="mb-2">
                            <div className="text-[10px] font-semibold text-gray-500 mb-1">Vitamins & Minerals</div>
                            {NUTRIENT_DEFINITIONS.filter(n => n.category === 'vitamin' || n.category === 'mineral').map((nutrient) => (
                              <label key={nutrient.key} className="flex items-center gap-1.5 text-[11px] py-0.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={
                                    (selectedElementData.properties?.selectedNutrients as string[] ||
                                      NUTRIENT_DEFINITIONS.filter(n => n.required).map(n => n.key)
                                    ).includes(nutrient.key)
                                  }
                                  onChange={(e) => {
                                    const current = (selectedElementData.properties?.selectedNutrients as string[]) ||
                                      NUTRIENT_DEFINITIONS.filter(n => n.required).map(n => n.key);
                                    const updated = e.target.checked
                                      ? [...current, nutrient.key]
                                      : current.filter(k => k !== nutrient.key);
                                    setElements((els) =>
                                      els.map((el) =>
                                        el.id === selectedElement
                                          ? { ...el, properties: { ...el.properties, selectedNutrients: updated } }
                                          : el
                                      )
                                    );
                                  }}
                                  className="rounded border-gray-300"
                                />
                                {nutrient.nameEn}
                                {nutrient.required && <span className="text-[9px] text-amber-600">(FDA req.)</span>}
                              </label>
                            ))}
                          </div>
                        </div>
                      </details>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          const requiredNutrients = NUTRIENT_DEFINITIONS.filter(n => n.required).map(n => n.key);
                          setElements((els) =>
                            els.map((el) =>
                              el.id === selectedElement
                                ? { ...el, properties: { ...el.properties, selectedNutrients: requiredNutrients } }
                                : el
                            )
                          );
                        }}
                        className="flex-1 py-1 text-[10px] border border-gray-300 rounded hover:bg-gray-50"
                      >
                        FDA Required Only
                      </button>
                      <button
                        onClick={() => {
                          const allNutrients = NUTRIENT_DEFINITIONS.map(n => n.key);
                          setElements((els) =>
                            els.map((el) =>
                              el.id === selectedElement
                                ? { ...el, properties: { ...el.properties, selectedNutrients: allNutrients } }
                                : el
                            )
                          );
                        }}
                        className="flex-1 py-1 text-[10px] border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Show All
                      </button>
                    </div>
                  </div>
                )}

                {/* Text element properties */}
                {selectedElementData.type === 'text' && (
                  <div className="space-y-3 border-t border-gray-200 pt-3">
                    <h4 className="text-xs font-semibold text-gray-600">Text Properties</h4>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Content</label>
                      <textarea
                        value={String(selectedElementData.properties?.text ?? '')}
                        onChange={(e) => {
                          setElements((els) =>
                            els.map((el) =>
                              el.id === selectedElement
                                ? { ...el, properties: { ...el.properties, text: e.target.value } }
                                : el
                            )
                          );
                        }}
                        placeholder="Enter your text here..."
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded resize-none"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Font Size</label>
                        <input
                          type="number"
                          value={Number(selectedElementData.properties?.fontSize || 12)}
                          onChange={(e) => {
                            setElements((els) =>
                              els.map((el) =>
                                el.id === selectedElement
                                  ? { ...el, properties: { ...el.properties, fontSize: parseInt(e.target.value) || 12 } }
                                  : el
                              )
                            );
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Text Color</label>
                        <input
                          type="color"
                          value={String(selectedElementData.properties?.textColor || '#000000')}
                          onChange={(e) => {
                            setElements((els) =>
                              els.map((el) =>
                                el.id === selectedElement
                                  ? { ...el, properties: { ...el.properties, textColor: e.target.value } }
                                  : el
                              )
                            );
                          }}
                          className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Background</label>
                      <input
                        type="color"
                        value={String(selectedElementData.properties?.bgColor || '#ffffff')}
                        onChange={(e) => {
                          setElements((els) =>
                            els.map((el) =>
                              el.id === selectedElement
                                ? { ...el, properties: { ...el.properties, bgColor: e.target.value } }
                                : el
                            )
                          );
                        }}
                        className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Alignment</label>
                      <div className="flex gap-1">
                        {['left', 'center', 'right'].map((align) => (
                          <button
                            key={align}
                            onClick={() => {
                              setElements((els) =>
                                els.map((el) =>
                                  el.id === selectedElement
                                    ? { ...el, properties: { ...el.properties, textAlign: align } }
                                    : el
                                )
                              );
                            }}
                            className={`flex-1 py-1 text-xs border rounded capitalize ${
                              (selectedElementData.properties?.textAlign || 'left') === align
                                ? 'bg-primary-500 text-white border-primary-500'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <label className="flex items-center gap-1 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!selectedElementData.properties?.bold}
                          onChange={(e) => {
                            setElements((els) =>
                              els.map((el) =>
                                el.id === selectedElement
                                  ? { ...el, properties: { ...el.properties, bold: e.target.checked } }
                                  : el
                              )
                            );
                          }}
                          className="rounded"
                        />
                        <span className="font-bold">Bold</span>
                      </label>
                      <label className="flex items-center gap-1 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!selectedElementData.properties?.italic}
                          onChange={(e) => {
                            setElements((els) =>
                              els.map((el) =>
                                el.id === selectedElement
                                  ? { ...el, properties: { ...el.properties, italic: e.target.checked } }
                                  : el
                              )
                            );
                          }}
                          className="rounded"
                        />
                        <span className="italic">Italic</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Allergens element properties */}
                {selectedElementData.type === 'allergens' && (
                  <div className="space-y-3 border-t border-gray-200 pt-3">
                    <h4 className="text-xs font-semibold text-gray-600">Allergen Properties</h4>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Label Text</label>
                      <input
                        type="text"
                        value={String(selectedElementData.properties?.label || 'Contains')}
                        onChange={(e) => {
                          setElements((els) =>
                            els.map((el) =>
                              el.id === selectedElement
                                ? { ...el, properties: { ...el.properties, label: e.target.value } }
                                : el
                            )
                          );
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Allergens (comma separated)</label>
                      <textarea
                        value={String(selectedElementData.properties?.allergens || '')}
                        onChange={(e) => {
                          setElements((els) =>
                            els.map((el) =>
                              el.id === selectedElement
                                ? { ...el, properties: { ...el.properties, allergens: e.target.value } }
                                : el
                            )
                          );
                        }}
                        placeholder="Milk, Wheat, Soy, Nuts..."
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded resize-none"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Font Size</label>
                        <input
                          type="number"
                          value={Number(selectedElementData.properties?.fontSize || 10)}
                          onChange={(e) => {
                            setElements((els) =>
                              els.map((el) =>
                                el.id === selectedElement
                                  ? { ...el, properties: { ...el.properties, fontSize: parseInt(e.target.value) || 10 } }
                                  : el
                              )
                            );
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Border Width</label>
                        <input
                          type="number"
                          value={Number(selectedElementData.properties?.borderWidth || 1)}
                          onChange={(e) => {
                            setElements((els) =>
                              els.map((el) =>
                                el.id === selectedElement
                                  ? { ...el, properties: { ...el.properties, borderWidth: parseInt(e.target.value) || 1 } }
                                  : el
                              )
                            );
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Background</label>
                        <input
                          type="color"
                          value={String(selectedElementData.properties?.bgColor || '#fff3cd')}
                          onChange={(e) => {
                            setElements((els) =>
                              els.map((el) =>
                                el.id === selectedElement
                                  ? { ...el, properties: { ...el.properties, bgColor: e.target.value } }
                                  : el
                              )
                            );
                          }}
                          className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Text</label>
                        <input
                          type="color"
                          value={String(selectedElementData.properties?.textColor || '#856404')}
                          onChange={(e) => {
                            setElements((els) =>
                              els.map((el) =>
                                el.id === selectedElement
                                  ? { ...el, properties: { ...el.properties, textColor: e.target.value } }
                                  : el
                              )
                            );
                          }}
                          className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Border</label>
                        <input
                          type="color"
                          value={String(selectedElementData.properties?.borderColor || '#ffc107')}
                          onChange={(e) => {
                            setElements((els) =>
                              els.map((el) =>
                                el.id === selectedElement
                                  ? { ...el, properties: { ...el.properties, borderColor: e.target.value } }
                                  : el
                              )
                            );
                          }}
                          className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Line element properties */}
                {selectedElementData.type === 'line' && (
                  <div className="space-y-3 border-t border-gray-200 pt-3">
                    <h4 className="text-xs font-semibold text-gray-600">Line Properties</h4>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Thickness (px)</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={Number(selectedElementData.properties?.thickness || 2)}
                        onChange={(e) => {
                          setElements((els) =>
                            els.map((el) =>
                              el.id === selectedElement
                                ? { ...el, properties: { ...el.properties, thickness: parseInt(e.target.value) || 2 } }
                                : el
                            )
                          );
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Color</label>
                      <input
                        type="color"
                        value={String(selectedElementData.properties?.color || '#000000')}
                        onChange={(e) => {
                          setElements((els) =>
                            els.map((el) =>
                              el.id === selectedElement
                                ? { ...el, properties: { ...el.properties, color: e.target.value } }
                                : el
                            )
                          );
                        }}
                        className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!selectedElementData.properties?.rounded}
                        onChange={(e) => {
                          setElements((els) =>
                            els.map((el) =>
                              el.id === selectedElement
                                ? { ...el, properties: { ...el.properties, rounded: e.target.checked } }
                                : el
                            )
                          );
                        }}
                        className="rounded"
                      />
                      Rounded ends
                    </label>
                  </div>
                )}

                {/* Business info element properties */}
                {selectedElementData.type === 'business-info' && (
                  <div className="space-y-3 border-t border-gray-200 pt-3">
                    <h4 className="text-xs font-semibold text-gray-600">Business Info</h4>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Company Name</label>
                      <input
                        type="text"
                        value={String(selectedElementData.properties?.companyName || '')}
                        onChange={(e) => {
                          setElements((els) =>
                            els.map((el) =>
                              el.id === selectedElement
                                ? { ...el, properties: { ...el.properties, companyName: e.target.value } }
                                : el
                            )
                          );
                        }}
                        placeholder="Your Company Name"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Address</label>
                      <textarea
                        value={String(selectedElementData.properties?.address || '')}
                        onChange={(e) => {
                          setElements((els) =>
                            els.map((el) =>
                              el.id === selectedElement
                                ? { ...el, properties: { ...el.properties, address: e.target.value } }
                                : el
                            )
                          );
                        }}
                        placeholder="123 Street, City, Country"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded resize-none"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Phone</label>
                      <input
                        type="text"
                        value={String(selectedElementData.properties?.phone || '')}
                        onChange={(e) => {
                          setElements((els) =>
                            els.map((el) =>
                              el.id === selectedElement
                                ? { ...el, properties: { ...el.properties, phone: e.target.value } }
                                : el
                            )
                          );
                        }}
                        placeholder="+1 234 567 890"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Email</label>
                      <input
                        type="email"
                        value={String(selectedElementData.properties?.email || '')}
                        onChange={(e) => {
                          setElements((els) =>
                            els.map((el) =>
                              el.id === selectedElement
                                ? { ...el, properties: { ...el.properties, email: e.target.value } }
                                : el
                            )
                          );
                        }}
                        placeholder="contact@company.com"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Website</label>
                      <input
                        type="text"
                        value={String(selectedElementData.properties?.website || '')}
                        onChange={(e) => {
                          setElements((els) =>
                            els.map((el) =>
                              el.id === selectedElement
                                ? { ...el, properties: { ...el.properties, website: e.target.value } }
                                : el
                            )
                          );
                        }}
                        placeholder="www.company.com"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Font Size</label>
                        <input
                          type="number"
                          value={Number(selectedElementData.properties?.fontSize || 10)}
                          onChange={(e) => {
                            setElements((els) =>
                              els.map((el) =>
                                el.id === selectedElement
                                  ? { ...el, properties: { ...el.properties, fontSize: parseInt(e.target.value) || 10 } }
                                  : el
                              )
                            );
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Text Color</label>
                        <input
                          type="color"
                          value={String(selectedElementData.properties?.textColor || '#000000')}
                          onChange={(e) => {
                            setElements((els) =>
                              els.map((el) =>
                                el.id === selectedElement
                                  ? { ...el, properties: { ...el.properties, textColor: e.target.value } }
                                  : el
                              )
                            );
                          }}
                          className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Alignment</label>
                      <div className="flex gap-1">
                        {['left', 'center', 'right'].map((align) => (
                          <button
                            key={align}
                            onClick={() => {
                              setElements((els) =>
                                els.map((el) =>
                                  el.id === selectedElement
                                    ? { ...el, properties: { ...el.properties, textAlign: align } }
                                    : el
                                )
                              );
                            }}
                            className={`flex-1 py-1 text-xs border rounded capitalize ${
                              (selectedElementData.properties?.textAlign || 'left') === align
                                ? 'bg-primary-500 text-white border-primary-500'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Logo element properties */}
                {selectedElementData.type === 'logo' && (
                  <div className="space-y-3 border-t border-gray-200 pt-3">
                    <h4 className="text-xs font-semibold text-gray-600">Logo/Image Settings</h4>

                    {/* Image URL or Upload */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Image Source</label>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={String(selectedElementData.properties?.imageUrl || '')}
                          onChange={(e) => {
                            setElements((els) =>
                              els.map((el) =>
                                el.id === selectedElement
                                  ? { ...el, properties: { ...el.properties, imageUrl: e.target.value } }
                                  : el
                              )
                            );
                          }}
                          placeholder="Paste image URL..."
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                        <div className="text-center text-[10px] text-gray-400">or</div>
                        <label className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
                          <Upload size={14} />
                          <span className="text-xs">Upload Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const dataUrl = event.target?.result as string;
                                  setElements((els) =>
                                    els.map((el) =>
                                      el.id === selectedElement
                                        ? { ...el, properties: { ...el.properties, imageUrl: dataUrl } }
                                        : el
                                    )
                                  );
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Object Fit */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Image Fit</label>
                      <select
                        value={String(selectedElementData.properties?.objectFit || 'contain')}
                        onChange={(e) => {
                          setElements((els) =>
                            els.map((el) =>
                              el.id === selectedElement
                                ? { ...el, properties: { ...el.properties, objectFit: e.target.value } }
                                : el
                            )
                          );
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      >
                        <option value="contain">Contain (fit inside)</option>
                        <option value="cover">Cover (fill area)</option>
                        <option value="fill">Stretch to fill</option>
                      </select>
                    </div>

                    {/* Opacity */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Opacity: {String(Math.round(Number(selectedElementData.properties?.opacity) || 100))}%
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={Math.round(Number(selectedElementData.properties?.opacity) || 100)}
                        onChange={(e) => {
                          setElements((els) =>
                            els.map((el) =>
                              el.id === selectedElement
                                ? { ...el, properties: { ...el.properties, opacity: parseInt(e.target.value) } }
                                : el
                            )
                          );
                        }}
                        className="w-full"
                      />
                    </div>

                    {/* Border Settings */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!selectedElementData.properties?.showBorder}
                          onChange={(e) => {
                            setElements((els) =>
                              els.map((el) =>
                                el.id === selectedElement
                                  ? { ...el, properties: { ...el.properties, showBorder: e.target.checked } }
                                  : el
                              )
                            );
                          }}
                          className="rounded border-gray-300"
                        />
                        Show Border
                      </label>
                      {!!selectedElementData.properties?.showBorder && (
                        <div className="grid grid-cols-2 gap-2 pl-5">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Color</label>
                            <input
                              type="color"
                              value={String(selectedElementData.properties?.borderColor || '#cccccc')}
                              onChange={(e) => {
                                setElements((els) =>
                                  els.map((el) =>
                                    el.id === selectedElement
                                      ? { ...el, properties: { ...el.properties, borderColor: e.target.value } }
                                      : el
                                  )
                                );
                              }}
                              className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Radius</label>
                            <input
                              type="number"
                              min="0"
                              max="50"
                              value={Number(selectedElementData.properties?.borderRadius || 0)}
                              onChange={(e) => {
                                setElements((els) =>
                                  els.map((el) =>
                                    el.id === selectedElement
                                      ? { ...el, properties: { ...el.properties, borderRadius: parseInt(e.target.value) || 0 } }
                                      : el
                                  )
                                );
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Background Color */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Background</label>
                      <input
                        type="color"
                        value={String(selectedElementData.properties?.bgColor || '#ffffff')}
                        onChange={(e) => {
                          setElements((els) =>
                            els.map((el) =>
                              el.id === selectedElement
                                ? { ...el, properties: { ...el.properties, bgColor: e.target.value } }
                                : el
                            )
                          );
                        }}
                        className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                      />
                    </div>

                    {/* Clear Image */}
                    {!!selectedElementData.properties?.imageUrl && (
                      <button
                        onClick={() => {
                          setElements((els) =>
                            els.map((el) =>
                              el.id === selectedElement
                                ? { ...el, properties: { ...el.properties, imageUrl: '' } }
                                : el
                            )
                          );
                        }}
                        className="w-full py-1.5 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>
                )}

                {/* Layer controls */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Layer Order</label>
                  <div className="flex gap-1">
                    <button
                      onClick={sendToBack}
                      className="flex-1 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50"
                      title="Send to Back"
                    >
                      To Back
                    </button>
                    <button
                      onClick={sendBackward}
                      className="flex-1 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center"
                      title="Send Backward"
                    >
                      <ArrowDown size={12} />
                    </button>
                    <button
                      onClick={bringForward}
                      className="flex-1 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center"
                      title="Bring Forward"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      onClick={bringToFront}
                      className="flex-1 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50"
                      title="Bring to Front"
                    >
                      To Front
                    </button>
                  </div>
                </div>

                <button
                  onClick={deleteSelected}
                  className="w-full py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200 flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete Element
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Select an element to edit its properties
              </p>
            )}
          </div>

          {/* Elements List */}
          <div className="border-t border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Layers size={14} />
              Layers ({elements.length})
            </h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {[...elements].reverse().map((el, idx) => (
                <div
                  key={el.id}
                  onClick={() => setSelectedElement(el.id)}
                  className={`px-2 py-1.5 text-xs rounded cursor-pointer flex items-center justify-between ${
                    selectedElement === el.id
                      ? 'bg-primary-100 text-primary-700 border border-primary-300'
                      : 'hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <span className="capitalize truncate">{el.type.replace('-', ' ')}</span>
                  <span className="text-gray-400 text-[10px]">#{elements.length - idx}</span>
                </div>
              ))}
              {elements.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">No elements</p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Canvas Size</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">Width</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={widthInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setWidthInput(val);
                  }}
                  onBlur={() => {
                    const newWidth = Math.max(100, Math.min(1200, parseInt(widthInput) || 400));
                    setCanvasWidth(newWidth);
                    setWidthInput(String(newWidth));
                    // Adjust elements to fit
                    setElements((els) =>
                      els.map((el) => {
                        const constrainedWidth = Math.min(el.width, newWidth - 40);
                        const constrainedX = Math.max(20, Math.min(el.x, newWidth - constrainedWidth - 20));
                        return { ...el, x: constrainedX, width: constrainedWidth };
                      })
                    );
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Height</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={heightInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setHeightInput(val);
                  }}
                  onBlur={() => {
                    const newHeight = Math.max(100, Math.min(1200, parseInt(heightInput) || 600));
                    setCanvasHeight(newHeight);
                    setHeightInput(String(newHeight));
                    // Adjust elements to fit
                    setElements((els) =>
                      els.map((el) => {
                        const constrainedHeight = Math.min(el.height, newHeight - 40);
                        const constrainedY = Math.max(20, Math.min(el.y, newHeight - constrainedHeight - 20));
                        return { ...el, y: constrainedY, height: constrainedHeight };
                      })
                    );
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Press Enter to apply. Elements auto-adjust.</p>
          </div>

          <div className="border-t border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Tips</h3>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Drag elements to reposition</li>
              <li>• Use corner handles to resize</li>
              <li>• Press Delete to remove selected</li>
              <li>• Press Escape to deselect</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Language Selection Modal - Bilingual (exactly 2 languages) */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Select 2 Languages for Bilingual Label</h3>
              <button
                onClick={() => setShowLanguageModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Select exactly 2 languages for your bilingual label. The first language will be primary.
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {AVAILABLE_LANGUAGES.map((lang) => {
                  const isSelected = selectedLanguages.includes(lang.code);
                  const isDisabled = !isSelected && selectedLanguages.length >= 2;
                  return (
                    <label
                      key={lang.code}
                      className={`flex items-center gap-3 p-2 rounded border ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 cursor-pointer'
                          : isDisabled
                          ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                          : 'border-gray-200 hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={(e) => {
                          if (e.target.checked && selectedLanguages.length < 2) {
                            setSelectedLanguages([...selectedLanguages, lang.code]);
                          } else if (!e.target.checked) {
                            setSelectedLanguages(selectedLanguages.filter((c) => c !== lang.code));
                          }
                        }}
                        className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{lang.name}</div>
                        <div className="text-xs text-gray-500">{lang.nameNative} ({lang.dir.toUpperCase()})</div>
                      </div>
                      {isSelected && (
                        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
                          {selectedLanguages.indexOf(lang.code) === 0 ? 'Primary' : 'Secondary'}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
              {selectedLanguages.length < 2 && (
                <p className="mt-3 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  Please select exactly 2 languages for the bilingual label.
                </p>
              )}
              {selectedLanguages.length === 2 && (
                <p className="mt-3 text-xs text-green-600 bg-green-50 p-2 rounded">
                  ✓ 2 languages selected: {selectedLanguages.map(c => AVAILABLE_LANGUAGES.find(l => l.code === c)?.name).join(' + ')}
                </p>
              )}
            </div>
            <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowLanguageModal(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedLanguages.length === 2) {
                    setShowLanguageModal(false);
                  }
                }}
                disabled={selectedLanguages.length !== 2}
                className="px-4 py-2 text-sm bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// FDA NUTRITION LABEL FORMAT TYPES
// ============================================================================
type NutritionLabelFormat =
  | 'standard-vertical'      // Standard FDA vertical format (21 CFR 101.9(d)(12))
  | 'vertical-micronutrients-side' // Micronutrients listed side-by-side
  | 'tabular'                // Horizontal tabular format (21 CFR 101.9(d)(11)(iii))
  | 'dual-column'            // Per serving and per container (21 CFR 101.9(e)(6)(i))
  | 'linear'                 // Linear format for small packages (21 CFR 101.9(j)(13)(ii)(A)(2))
  | 'simplified'             // Simplified format (21 CFR 101.9(f))
  | 'tabular-dual-column'    // Tabular with dual columns (21 CFR 101.9(e)(6)(ii))
  | 'infants'                // Infants 0-12 months (21 CFR 101.9(j)(5)(ii)(B))
  | 'children-1-3';          // Children 1-3 years (21 CFR 101.9(j)(5)(iii)(A))

// Format options for the dropdown
const NUTRITION_FORMAT_OPTIONS: { value: NutritionLabelFormat; label: string; description: string }[] = [
  { value: 'standard-vertical', label: 'Standard Vertical', description: 'Classic FDA vertical format' },
  { value: 'vertical-micronutrients-side', label: 'Vertical (Micronutrients Side)', description: 'Vitamins/minerals listed side-by-side' },
  { value: 'tabular', label: 'Tabular', description: 'Horizontal format for wide packages' },
  { value: 'dual-column', label: 'Dual Column', description: 'Per serving and per container' },
  { value: 'linear', label: 'Linear', description: 'Compact format for small packages' },
  { value: 'simplified', label: 'Simplified', description: 'Minimal format for simple foods' },
  { value: 'tabular-dual-column', label: 'Tabular Dual Column', description: 'Tabular with serving/container columns' },
  { value: 'infants', label: 'Infants (0-12 months)', description: 'FDA format for infant foods' },
  { value: 'children-1-3', label: 'Children (1-3 years)', description: 'FDA format for toddler foods' },
];

// Common props interface for all nutrition box formats
interface NutritionBoxProps {
  nutrition?: NutritionSummary;
  language?: string; // 'en', 'ar', 'hi', 'bilingual', etc.
  selectedLanguages?: string[]; // Array of selected language codes for bilingual/multilingual mode
  selectedNutrients?: string[];
  styles?: {
    fontFamily?: string;
    fontSize?: number;
    titleFontSize?: number;
    borderColor?: string;
    borderWidth?: number;
    bgColor?: string;
    textColor?: string;
  };
  dvBaselineCalories?: number;
  servingSize?: number;
  servingUnit?: string;
  servingDescription?: string;
  servingsPerContainer?: number;
  showDailyValue?: boolean;
  showFootnote?: boolean;
  format?: NutritionLabelFormat;
}

// Helper: Get nutrient name by language code
function getNutrientName(nutrient: typeof NUTRIENT_DEFINITIONS[0], langCode: string): string {
  switch (langCode) {
    case 'ar': return nutrient.nameAr || nutrient.nameEn;
    case 'hi': return nutrient.nameHi || nutrient.nameEn;
    case 'zh': return nutrient.nameZh || nutrient.nameEn;
    case 'es': return nutrient.nameEs || nutrient.nameEn;
    case 'fr': return nutrient.nameFr || nutrient.nameEn;
    case 'en':
    default: return nutrient.nameEn;
  }
}

// Helper: Get nutrient value from nutrition object
function getNutrientValue(nutrition: NutritionSummary | undefined, key: string): number {
  if (!nutrition) return 0;
  return (nutrition as unknown as Record<string, number>)[key] || 0;
}

// Helper: Calculate %DV
function calculateDV(key: string, value: number, dvBaselineCalories: number = 2000): number | undefined {
  const dvValues: Record<string, number | null> = {
    total_fat: 78,
    saturated_fat: 20,
    trans_fat: null,
    cholesterol: 300,
    sodium: 2300,
    total_carbs: 275,
    dietary_fiber: 28,
    total_sugars: null,
    added_sugars: 50,
    protein: 50,
    vitamin_d: 20,
    calcium: 1300,
    iron: 18,
    potassium: 4700,
    vitamin_a: 900,
    vitamin_c: 90,
    thiamin: 1.2,
    riboflavin: 1.3,
    niacin: 16,
    vitamin_b6: 1.7,
    folate: 400,
    vitamin_b12: 2.4,
    phosphorus: 1250,
    magnesium: 420,
    zinc: 11,
    choline: 550,
  };

  const dv = dvValues[key];
  if (dv === null || dv === undefined || dv === 0) return undefined;
  const adjustedDV = dv * (dvBaselineCalories / 2000);
  return (value / adjustedDV) * 100;
}

// Helper: Format number for display
function formatValue(value: number, decimals: number = 0): string {
  if (value < 1 && value > 0) {
    return value < 0.5 ? '<1' : '1';
  }
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals) + '';
}

// ============================================================================
// STANDARD VERTICAL FORMAT - FDA 21 CFR 101.9(d)(12)
// The classic nutrition facts panel with bilingual support
// ============================================================================
function StandardVerticalFormat({
  nutrition,
  language = 'en',
  selectedLanguages = ['en'],
  selectedNutrients,
  styles = {},
  dvBaselineCalories = 2000,
  servingSize = 100,
  servingUnit = 'g',
  servingDescription,
  servingsPerContainer = 8,
  showFootnote = true,
}: NutritionBoxProps) {
  const isBilingual = language === 'bilingual';
  const borderColor = styles.borderColor || '#000000';

  // For bilingual mode, get the two selected languages
  const primaryLang = selectedLanguages[0] || 'en';
  const secondaryLang = selectedLanguages[1] || selectedLanguages[0] || 'en';

  // Translation helpers
  const translations: Record<string, Record<string, string>> = {
    title: { en: 'Nutrition Facts', ar: 'الحقائق الغذائية', hi: 'पोषण तथ्य', zh: '营养成分', es: 'Información Nutricional', fr: 'Valeur Nutritive', ur: 'غذائی حقائق', bn: 'পুষ্টি তথ্য' },
    servingsPerContainer: { en: 'servings per container', ar: 'حصص لكل عبوة', hi: 'प्रति कंटेनर सर्विंग्स', zh: '每容器份数', es: 'porciones por envase', fr: 'portions par contenant' },
    servingSize: { en: 'Serving size', ar: 'حجم الحصة', hi: 'सर्विंग का आकार', zh: '每份含量', es: 'Tamaño por porción', fr: 'Portion' },
    amountPerServing: { en: 'Amount per serving', ar: 'الكمية لكل حصة', hi: 'प्रति सर्विंग मात्रा', zh: '每份含量', es: 'Cantidad por porción', fr: 'Quantité par portion' },
    calories: { en: 'Calories', ar: 'السعرات الحرارية', hi: 'कैलोरी', zh: '卡路里', es: 'Calorías', fr: 'Calories' },
    dailyValue: { en: '% Daily Value*', ar: '* % القيمة اليومية', hi: '% दैनिक मूल्य*', zh: '% 每日摄入量*', es: '% Valor Diario*', fr: '% Valeur quotidienne*' },
  };

  const t = (key: string, lang: string) => translations[key]?.[lang] || translations[key]?.['en'] || key;

  const getDirByLang = (langCode: string) => {
    return ['ar', 'ur'].includes(langCode) ? 'rtl' : 'ltr';
  };

  const isSelected = (key: string) => {
    if (!selectedNutrients || selectedNutrients.length === 0) return true;
    return selectedNutrients.includes(key);
  };

  const servingSizeDisplay = servingDescription
    ? `${servingDescription} (${servingSize}${servingUnit})`
    : `${servingSize}${servingUnit}`;

  // Core nutrients for vertical format
  const coreNutrients = NUTRIENT_DEFINITIONS.filter(n => n.category === 'core' && isSelected(n.key));
  const vitaminsAndMinerals = NUTRIENT_DEFINITIONS.filter(n =>
    (n.category === 'vitamin' || n.category === 'mineral') && isSelected(n.key)
  );

  return (
    <div
      className="h-full overflow-auto p-1"
      style={{
        fontFamily: styles.fontFamily || 'Helvetica, Arial, sans-serif',
        fontSize: `${styles.fontSize || 9}px`,
        backgroundColor: styles.bgColor || '#ffffff',
        color: styles.textColor || '#000000',
        border: `${styles.borderWidth || 1}px solid ${borderColor}`,
      }}
    >
      {/* Title */}
      <div className="text-[22px] font-black leading-tight" style={{ fontFamily: 'Franklin Gothic Heavy, Arial Black, sans-serif' }}>
        {isBilingual ? (
          <div className="flex justify-between">
            <span dir={getDirByLang(primaryLang)}>{t('title', primaryLang)}</span>
            <span dir={getDirByLang(secondaryLang)}>{t('title', secondaryLang)}</span>
          </div>
        ) : (
          <span dir={getDirByLang(language || 'en')}>{t('title', language || 'en')}</span>
        )}
      </div>

      {/* Servings info */}
      <div className="text-[8px] border-b-[8px] pb-1" style={{ borderColor }}>
        {isBilingual ? (
          <>
            <div>{servingsPerContainer} {t('servingsPerContainer', primaryLang)} / {t('servingsPerContainer', secondaryLang)}</div>
            <div className="flex justify-between">
              <span className="font-bold">{t('servingSize', primaryLang)} / {t('servingSize', secondaryLang)}</span>
              <span className="font-bold">{servingSizeDisplay}</span>
            </div>
          </>
        ) : (
          <>
            <div>{servingsPerContainer} {t('servingsPerContainer', language || 'en')}</div>
            <div className="flex justify-between">
              <span className="font-bold">{t('servingSize', language || 'en')}</span>
              <span className="font-bold">{servingSizeDisplay}</span>
            </div>
          </>
        )}
      </div>

      {/* Amount per serving & Calories */}
      <div className="border-b-[4px] py-1" style={{ borderColor }}>
        <div className="text-[8px] font-bold">
          {isBilingual ? `${t('amountPerServing', primaryLang)} / ${t('amountPerServing', secondaryLang)}` : t('amountPerServing', language || 'en')}
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[18px] font-black">
            {isBilingual ? `${t('calories', primaryLang)} / ${t('calories', secondaryLang)}` : t('calories', language || 'en')}
          </span>
          <span className="text-[32px] font-black leading-none">{Math.round(getNutrientValue(nutrition, 'calories'))}</span>
        </div>
      </div>

      {/* % Daily Value header */}
      <div className="text-[8px] text-right font-bold border-b py-0.5" style={{ borderColor }}>
        {isBilingual ? `${t('dailyValue', primaryLang)} / ${t('dailyValue', secondaryLang)}` : t('dailyValue', language || 'en')}
      </div>

      {/* Main nutrients */}
      {coreNutrients.filter(n => n.key !== 'calories').map((nutrient) => {
        const value = getNutrientValue(nutrition, nutrient.key);
        const dv = nutrient.showDV ? calculateDV(nutrient.key, value, dvBaselineCalories) : undefined;
        const displayName = isBilingual
          ? `${getNutrientName(nutrient, primaryLang)} / ${getNutrientName(nutrient, secondaryLang)}`
          : getNutrientName(nutrient, language || 'en');

        return (
          <div
            key={nutrient.key}
            className="flex justify-between border-b py-[2px]"
            style={{
              borderColor,
              paddingLeft: nutrient.indent ? `${nutrient.indent * 12}px` : '0',
            }}
          >
            <span className={nutrient.bold ? 'font-bold' : ''}>
              {nutrient.key === 'added_sugars' ? 'Includes ' : ''}
              {nutrient.key === 'trans_fat' ? <em>Trans</em> : ''}
              {nutrient.key === 'trans_fat' ? ' Fat' : displayName} {formatValue(value)}{nutrient.unit}
            </span>
            <span className="font-bold">{dv !== undefined ? `${Math.round(dv)}%` : ''}</span>
          </div>
        );
      })}

      {/* Thick divider before vitamins/minerals */}
      <div className="border-b-[8px] mt-1" style={{ borderColor }}></div>

      {/* Vitamins and Minerals */}
      {vitaminsAndMinerals.map((nutrient) => {
        const value = getNutrientValue(nutrition, nutrient.key);
        const dv = calculateDV(nutrient.key, value, dvBaselineCalories);
        const displayName = isBilingual
          ? `${getNutrientName(nutrient, primaryLang)} / ${getNutrientName(nutrient, secondaryLang)}`
          : getNutrientName(nutrient, language || 'en');

        return (
          <div
            key={nutrient.key}
            className="flex justify-between border-b py-[2px]"
            style={{ borderColor }}
          >
            <span>{displayName} {formatValue(value, 1)}{nutrient.unit}</span>
            <span>{dv !== undefined ? `${Math.round(dv)}%` : ''}</span>
          </div>
        );
      })}

      {/* Footnote */}
      {showFootnote && (
        <div className="text-[7px] pt-1 leading-tight">
          * The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. {dvBaselineCalories} calories a day is used for general nutrition advice.
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TABULAR FORMAT - FDA 21 CFR 101.9(d)(11)(iii)
// Horizontal layout for wide packages - matches FDA example exactly
// ============================================================================
function TabularFormat({
  nutrition,
  language = 'en',
  selectedLanguages = ['en'],
  selectedNutrients,
  styles = {},
  dvBaselineCalories = 2000,
  servingSize = 56,
  servingUnit = 'g',
  servingDescription = '2 slices',
  servingsPerContainer = 10,
  showFootnote = true,
}: NutritionBoxProps) {
  const borderColor = styles.borderColor || '#000000';
  const isBilingual = language === 'bilingual';
  const primaryLang = selectedLanguages[0] || 'en';
  const secondaryLang = selectedLanguages[1] || selectedLanguages[0] || 'en';

  // Translation helpers
  const translations: Record<string, Record<string, string>> = {
    title: { en: 'Nutrition Facts', ar: 'الحقائق الغذائية', hi: 'पोषण तथ्य', zh: '营养成分', es: 'Información Nutricional', fr: 'Valeur Nutritive', ur: 'غذائی حقائق', bn: 'পুষ্টি তথ্য' },
    servingsPerContainer: { en: 'servings per container', ar: 'حصص لكل عبوة', hi: 'प्रति कंटेनर सर्विंग्स', zh: '每容器份数', es: 'porciones por envase', fr: 'portions par contenant', ur: 'فی کنٹینر سرونگز', bn: 'প্রতি কন্টেইনার সার্ভিং' },
    servingSize: { en: 'Serving size', ar: 'حجم الحصة', hi: 'सर्विंग का आकार', zh: '每份含量', es: 'Tamaño por porción', fr: 'Portion', ur: 'سرونگ سائز', bn: 'পরিবেশন মাপ' },
    calories: { en: 'Calories', ar: 'السعرات الحرارية', hi: 'कैलोरी', zh: '卡路里', es: 'Calorías', fr: 'Calories', ur: 'کیلوریز', bn: 'ক্যালোরি' },
    perServing: { en: 'per serving', ar: 'لكل حصة', hi: 'प्रति सर्विंग', zh: '每份', es: 'por porción', fr: 'par portion', ur: 'فی سرونگ', bn: 'প্রতি পরিবেশন' },
    amountServing: { en: 'Amount/serving', ar: 'الكمية/حصة', hi: 'मात्रा/सर्विंग', zh: '每份含量', es: 'Cantidad/porción', fr: 'Quantité/portion', ur: 'مقدار/سرونگ', bn: 'পরিমাণ/পরিবেশন' },
    dailyValue: { en: '% Daily Value*', ar: '* % القيمة اليومية', hi: '% दैनिक मूल्य*', zh: '% 每日摄入量*', es: '% Valor Diario*', fr: '% Valeur quotidienne*', ur: '* % روزانہ قدر', bn: '% দৈনিক মূল্য*' },
    footnote: { en: '*The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet.', ar: '*تخبرك النسبة المئوية للقيمة اليومية بمدى مساهمة المغذيات في الحصة الواحدة في النظام الغذائي اليومي.', hi: '*% दैनिक मूल्य (DV) आपको बताता है कि भोजन की एक सर्विंग में पोषक तत्व दैनिक आहार में कितना योगदान देता है।', zh: '*每日摄入量百分比告诉您一份食物中的营养素对日常饮食的贡献。', es: '*El % Valor Diario (VD) le indica cuánto contribuye un nutriente en una porción de alimento a una dieta diaria.', fr: '*Le % de la valeur quotidienne (VQ) vous indique la contribution d\'un nutriment dans une portion d\'aliment à un régime quotidien.', ur: '*% روزانہ قدر آپ کو بتاتی ہے کہ کھانے کی ایک سرونگ میں غذائی اجزاء روزانہ کی خوراک میں کتنا حصہ ڈالتے ہیں۔', bn: '*% দৈনিক মূল্য (DV) আপনাকে জানায় যে খাবারের এক পরিবেশনে পুষ্টি উপাদান দৈনিক খাদ্যে কতটা অবদান রাখে।' },
    caloriesAdvice: { en: 'calories a day is used for general nutrition advice', ar: 'سعرة حرارية يوميا للنصائح الغذائية العامة', hi: 'कैलोरी प्रति दिन सामान्य पोषण सलाह के लिए उपयोग किया जाता है', zh: '卡路里/天用于一般营养建议', es: 'calorías al día se usa para consejos de nutrición general', fr: 'calories par jour est utilisé pour les conseils nutritionnels généraux', ur: 'کیلوریز فی دن عمومی غذائی مشورے کے لیے استعمال ہوتی ہیں', bn: 'ক্যালোরি প্রতিদিন সাধারণ পুষ্টি পরামর্শের জন্য ব্যবহৃত হয়' },
  };

  const t = (key: string, lang: string) => translations[key]?.[lang] || translations[key]?.['en'] || key;

  const getDirByLang = (langCode: string) => {
    return ['ar', 'ur'].includes(langCode) ? 'rtl' : 'ltr';
  };

  const getDisplayName = (nutrient: typeof NUTRIENT_DEFINITIONS[0]) => {
    if (isBilingual) {
      return `${getNutrientName(nutrient, primaryLang)} / ${getNutrientName(nutrient, secondaryLang)}`;
    }
    return getNutrientName(nutrient, language || 'en');
  };

  const isSelected = (key: string) => {
    if (!selectedNutrients || selectedNutrients.length === 0) return true;
    return selectedNutrients.includes(key);
  };

  const servingSizeDisplay = servingDescription
    ? `${servingDescription} (${servingSize}${servingUnit})`
    : `${servingSize}${servingUnit}`;

  // Left column nutrients (with their sub-items)
  const leftNutrients = ['total_fat', 'saturated_fat', 'trans_fat', 'cholesterol', 'sodium'];
  // Right column nutrients
  const rightNutrients = ['total_carbs', 'dietary_fiber', 'total_sugars', 'added_sugars', 'protein'];

  // Bottom vitamins/minerals - shown inline
  const bottomVitamins = NUTRIENT_DEFINITIONS.filter(n =>
    (n.category === 'vitamin' || n.category === 'mineral') && isSelected(n.key)
  ).slice(0, 7);

  return (
    <div
      className="h-full overflow-hidden flex"
      style={{
        fontFamily: styles.fontFamily || 'Helvetica Neue, Helvetica, Arial, sans-serif',
        backgroundColor: styles.bgColor || '#ffffff',
        color: styles.textColor || '#000000',
        border: `${styles.borderWidth || 1}px solid ${borderColor}`,
      }}
    >
      {/* Left section - Title, servings, and calories */}
      <div className="flex-shrink-0 p-2 flex flex-col justify-between overflow-hidden" dir={getDirByLang(isBilingual ? primaryLang : (language || 'en'))} style={{ width: isBilingual ? '150px' : '130px', borderRight: `1px solid ${borderColor}` }}>
        {/* Title */}
        <div className="overflow-hidden">
          {isBilingual ? (
            <>
              <div className="text-[16px] font-black leading-[0.9] truncate" dir={getDirByLang(primaryLang)} style={{ fontFamily: 'Franklin Gothic Heavy, Impact, Arial Black, sans-serif' }}>
                {t('title', primaryLang)}
              </div>
              <div className="text-[14px] font-black leading-[1.1] truncate" dir={getDirByLang(secondaryLang)} style={{ fontFamily: 'Franklin Gothic Heavy, Impact, Arial Black, sans-serif' }}>
                {t('title', secondaryLang)}
              </div>
            </>
          ) : (
            <div className="text-[24px] font-black leading-[0.9]" dir={getDirByLang(language || 'en')} style={{ fontFamily: 'Franklin Gothic Heavy, Impact, Arial Black, sans-serif' }}>
              {t('title', language || 'en')}
            </div>
          )}
        </div>

        {/* Servings info */}
        <div className="text-[8px] mt-2 overflow-hidden" style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '4px' }}>
          <div className="truncate">{servingsPerContainer} {t('servingsPerContainer', language || 'en')}</div>
          <div className="font-bold truncate">{t('servingSize', language || 'en')}</div>
          <div className="font-bold">{servingSizeDisplay}</div>
        </div>

        {/* Calories */}
        <div className="mt-2" style={{ borderTop: `8px solid ${borderColor}`, paddingTop: '4px' }}>
          <div className="text-[12px] font-bold truncate">{t('calories', language || 'en')}</div>
          <div className="text-[7px] truncate">{t('perServing', language || 'en')}</div>
          <div className="text-[36px] font-black leading-none">{Math.round(getNutrientValue(nutrition, 'calories'))}</div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 min-w-0 flex flex-col p-2 overflow-hidden">
        {/* Nutrients table */}
        <div className="flex-1 flex gap-2">
          {/* Left nutrients column */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-[7px] font-bold pb-1" style={{ borderBottom: `2px solid ${borderColor}` }}>
              <span className="truncate">{t('amountServing', language || 'en')}</span>
              <span className="truncate ml-1">{t('dailyValue', language || 'en')}</span>
            </div>
            {leftNutrients.filter(key => isSelected(key)).map(key => {
              const nutrient = NUTRIENT_DEFINITIONS.find(n => n.key === key);
              if (!nutrient) return null;
              const value = getNutrientValue(nutrition, key);
              const dv = nutrient.showDV ? calculateDV(key, value, dvBaselineCalories) : undefined;
              const isIndented = nutrient.indent && nutrient.indent > 0;
              return (
                <div
                  key={key}
                  className="flex justify-between text-[9px] py-[2px]"
                  style={{
                    borderBottom: `1px solid ${borderColor}`,
                    paddingLeft: isIndented ? '12px' : '0'
                  }}
                >
                  <span className={nutrient.bold ? 'font-bold' : ''}>
                    {key === 'trans_fat' ? <><em>Trans</em> Fat {formatValue(value)}{nutrient.unit}</> :
                     <><span className={nutrient.bold ? 'font-bold' : ''}>{getDisplayName(nutrient)}</span> {formatValue(value)}{nutrient.unit}</>}
                  </span>
                  <span className="font-bold">{dv !== undefined ? `${Math.round(dv)}%` : ''}</span>
                </div>
              );
            })}
          </div>

          {/* Right nutrients column */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-[7px] font-bold pb-1" style={{ borderBottom: `2px solid ${borderColor}` }}>
              <span className="truncate">{t('amountServing', language || 'en')}</span>
              <span className="truncate ml-1">{t('dailyValue', language || 'en')}</span>
            </div>
            {rightNutrients.filter(key => isSelected(key)).map(key => {
              const nutrient = NUTRIENT_DEFINITIONS.find(n => n.key === key);
              if (!nutrient) return null;
              const value = getNutrientValue(nutrition, key);
              const dv = nutrient.showDV ? calculateDV(key, value, dvBaselineCalories) : undefined;
              const isIndented = nutrient.indent && nutrient.indent > 0;
              return (
                <div
                  key={key}
                  className="flex justify-between text-[9px] py-[2px]"
                  style={{
                    borderBottom: `1px solid ${borderColor}`,
                    paddingLeft: isIndented ? '12px' : '0'
                  }}
                >
                  <span className={nutrient.bold ? 'font-bold' : ''}>
                    {key === 'added_sugars' ?
                      <>Includes {formatValue(value)}{nutrient.unit} Added Sugars</> :
                      <><span className={nutrient.bold ? 'font-bold' : ''}>{getDisplayName(nutrient)}</span> {formatValue(value)}{nutrient.unit}</>}
                  </span>
                  <span className="font-bold">{dv !== undefined ? `${Math.round(dv)}%` : ''}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom vitamins row */}
        <div className="text-[8px] pt-1 mt-1" style={{ borderTop: `1px solid ${borderColor}` }}>
          {bottomVitamins.map((nutrient, idx) => {
            const value = getNutrientValue(nutrition, nutrient.key);
            const dv = calculateDV(nutrient.key, value, dvBaselineCalories);
            return (
              <span key={nutrient.key}>
                {getDisplayName(nutrient)} {formatValue(value, nutrient.unit === 'mcg' ? 0 : 1)}{nutrient.unit} {dv !== undefined ? `${Math.round(dv)}%` : '0%'}
                {idx < bottomVitamins.length - 1 ? ' • ' : ''}
              </span>
            );
          })}
        </div>
      </div>

      {/* Footnote on right side */}
      {showFootnote && (
        <div className="flex-shrink-0 p-1 text-[6px] leading-tight overflow-hidden" dir={getDirByLang(isBilingual ? primaryLang : (language || 'en'))} style={{ width: '100px', borderLeft: `1px solid ${borderColor}` }}>
          {t('footnote', language || 'en')} {dvBaselineCalories} {t('caloriesAdvice', language || 'en')}.
        </div>
      )}
    </div>
  );
}

// ============================================================================
// DUAL COLUMN FORMAT - FDA 21 CFR 101.9(e)(6)(i)
// Shows per serving and per container
// ============================================================================
function DualColumnFormat({
  nutrition,
  language = 'en',
  selectedLanguages = ['en'],
  selectedNutrients,
  styles = {},
  dvBaselineCalories = 2000,
  servingSize = 100,
  servingUnit = 'g',
  servingDescription,
  servingsPerContainer = 2,
  showFootnote = true,
}: NutritionBoxProps) {
  const borderColor = styles.borderColor || '#000000';
  const isBilingual = language === 'bilingual';
  const primaryLang = isBilingual ? (selectedLanguages[0] || 'en') : (language || 'en');
  const secondaryLang = selectedLanguages[1] || 'en';

  // Translation helpers
  const translations: Record<string, Record<string, string>> = {
    title: { en: 'Nutrition Facts', ar: 'الحقائق الغذائية', hi: 'पोषण तथ्य', zh: '营养成分', es: 'Información Nutricional', fr: 'Valeur Nutritive', ur: 'غذائی حقائق', bn: 'পুষ্টি তথ্য' },
    servingsPerContainer: { en: 'servings per container', ar: 'حصص لكل عبوة', hi: 'प्रति कंटेनर सर्विंग्स', zh: '每容器份数', es: 'porciones por envase', fr: 'portions par contenant', ur: 'فی کنٹینر سرونگز', bn: 'প্রতি কন্টেইনার সার্ভিং' },
    servingSize: { en: 'Serving size', ar: 'حجم الحصة', hi: 'सर्विंग का आकार', zh: '每份含量', es: 'Tamaño por porción', fr: 'Portion', ur: 'سرونگ سائز', bn: 'পরিবেশন মাপ' },
    amountPerServing: { en: 'Amount per serving', ar: 'الكمية لكل حصة', hi: 'प्रति सर्विंग मात्रा', zh: '每份含量', es: 'Cantidad por porción', fr: 'Quantité par portion', ur: 'فی سرونگ مقدار', bn: 'প্রতি পরিবেশনে পরিমাণ' },
    calories: { en: 'Calories', ar: 'السعرات الحرارية', hi: 'कैलोरी', zh: '卡路里', es: 'Calorías', fr: 'Calories', ur: 'کیلوریز', bn: 'ক্যালোরি' },
    perServing: { en: 'Per serving', ar: 'لكل حصة', hi: 'प्रति सर्विंग', zh: '每份', es: 'Por porción', fr: 'Par portion', ur: 'فی سرونگ', bn: 'প্রতি পরিবেশন' },
    perContainer: { en: 'Per container', ar: 'لكل عبوة', hi: 'प्रति कंटेनर', zh: '每容器', es: 'Por envase', fr: 'Par contenant', ur: 'فی کنٹینر', bn: 'প্রতি কন্টেইনার' },
    dailyValue: { en: '% DV*', ar: '* % ق.ي', hi: '% दै.मू.*', zh: '% 日*', es: '% VD*', fr: '% VQ*', ur: '* % ر.ق', bn: '% দ.মূ.*' },
    footnote: { en: '* The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet.', ar: '*تخبرك النسبة المئوية للقيمة اليومية بمدى مساهمة المغذيات في الحصة الواحدة في النظام الغذائي اليومي.', hi: '*% दैनिक मूल्य (DV) आपको बताता है कि भोजन की एक सर्विंग में पोषक तत्व दैनिक आहार में कितना योगदान देता है।', zh: '*每日摄入量百分比告诉您一份食物中的营养素对日常饮食的贡献。', es: '*El % Valor Diario (VD) le indica cuánto contribuye un nutriente en una porción de alimento a una dieta diaria.', fr: '*Le % de la valeur quotidienne (VQ) vous indique la contribution d\'un nutriment dans une portion d\'aliment à un régime quotidien.', ur: '*% روزانہ قدر آپ کو بتاتی ہے کہ کھانے کی ایک سرونگ میں غذائی اجزاء روزانہ کی خوراک میں کتنا حصہ ڈالتے ہیں۔', bn: '*% দৈনিক মূল্য (DV) আপনাকে জানায় যে খাবারের এক পরিবেশনে পুষ্টি উপাদান দৈনিক খাদ্যে কতটা অবদান রাখে।' },
    caloriesAdvice: { en: 'calories a day is used for general nutrition advice', ar: 'سعرة حرارية يوميا للنصائح الغذائية العامة', hi: 'कैलोरी प्रति दिन सामान्य पोषण सलाह के लिए', zh: '卡路里/天用于一般营养建议', es: 'calorías al día para consejos de nutrición', fr: 'calories par jour pour conseils nutritionnels', ur: 'کیلوریز فی دن عمومی غذائی مشورے کے لیے', bn: 'ক্যালোরি প্রতিদিন সাধারণ পুষ্টি পরামর্শের জন্য' },
  };

  const t = (key: string) => {
    if (isBilingual) {
      return `${translations[key]?.[primaryLang] || translations[key]?.['en']} / ${translations[key]?.[secondaryLang] || translations[key]?.['en']}`;
    }
    return translations[key]?.[primaryLang] || translations[key]?.['en'] || key;
  };

  const getDirByLang = (langCode: string) => ['ar', 'ur'].includes(langCode) ? 'rtl' : 'ltr';

  const getDisplayName = (nutrient: typeof NUTRIENT_DEFINITIONS[0]) => {
    if (isBilingual) {
      return `${getNutrientName(nutrient, primaryLang)} / ${getNutrientName(nutrient, secondaryLang)}`;
    }
    return getNutrientName(nutrient, primaryLang);
  };

  const isSelected = (key: string) => {
    if (!selectedNutrients || selectedNutrients.length === 0) return true;
    return selectedNutrients.includes(key);
  };

  const servingSizeDisplay = servingDescription
    ? `${servingDescription} (${servingSize}${servingUnit})`
    : `${servingSize}${servingUnit}`;

  const coreNutrients = NUTRIENT_DEFINITIONS.filter(n => n.category === 'core' && isSelected(n.key) && n.key !== 'calories');
  const vitaminsAndMinerals = NUTRIENT_DEFINITIONS.filter(n =>
    (n.category === 'vitamin' || n.category === 'mineral') && isSelected(n.key)
  ).slice(0, 4);

  return (
    <div
      className="h-full overflow-auto p-1"
      dir={getDirByLang(primaryLang)}
      style={{
        fontFamily: styles.fontFamily || 'Helvetica, Arial, sans-serif',
        fontSize: `${styles.fontSize || 8}px`,
        backgroundColor: styles.bgColor || '#ffffff',
        color: styles.textColor || '#000000',
        border: `${styles.borderWidth || 1}px solid ${borderColor}`,
      }}
    >
      {/* Title */}
      <div className="text-[20px] font-black leading-tight" style={{ fontFamily: 'Franklin Gothic Heavy, Arial Black, sans-serif' }}>
        {t('title')}
      </div>

      {/* Servings info */}
      <div className="text-[7px] border-b-[6px] pb-1" style={{ borderColor }}>
        <div>{servingsPerContainer} {t('servingsPerContainer')}</div>
        <div className="flex justify-between">
          <span className="font-bold">{t('servingSize')}</span>
          <span className="font-bold">{servingSizeDisplay}</span>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_60px_30px_60px_30px] text-[7px] border-b-[4px] py-1" style={{ borderColor }}>
        <span></span>
        <span className="text-center font-bold">{t('perServing')}</span>
        <span></span>
        <span className="text-center font-bold">{t('perContainer')}</span>
        <span></span>
      </div>

      {/* Calories row */}
      <div className="grid grid-cols-[1fr_60px_30px_60px_30px] border-b-[4px] py-1" style={{ borderColor }}>
        <span className="text-[14px] font-black">{t('calories')}</span>
        <span className="text-[24px] font-black text-center leading-none">{Math.round(getNutrientValue(nutrition, 'calories'))}</span>
        <span></span>
        <span className="text-[24px] font-black text-center leading-none">{Math.round(getNutrientValue(nutrition, 'calories') * servingsPerContainer)}</span>
        <span></span>
      </div>

      {/* DV header row */}
      <div className="grid grid-cols-[1fr_40px_20px_40px_20px] text-[6px] border-b py-0.5" style={{ borderColor }}>
        <span></span>
        <span></span>
        <span className="font-bold">{t('dailyValue')}</span>
        <span></span>
        <span className="font-bold">{t('dailyValue')}</span>
      </div>

      {/* Nutrients */}
      {coreNutrients.map((nutrient) => {
        const value = getNutrientValue(nutrition, nutrient.key);
        const containerValue = value * servingsPerContainer;
        const dv = nutrient.showDV ? calculateDV(nutrient.key, value, dvBaselineCalories) : undefined;
        const containerDv = nutrient.showDV ? calculateDV(nutrient.key, containerValue, dvBaselineCalories) : undefined;

        return (
          <div
            key={nutrient.key}
            className="grid grid-cols-[1fr_40px_20px_40px_20px] text-[7px] border-b py-[1px]"
            style={{ borderColor, paddingLeft: nutrient.indent ? `${nutrient.indent * 10}px` : '0' }}
          >
            <span className={nutrient.bold ? 'font-bold' : ''}>
              {getDisplayName(nutrient)}
            </span>
            <span>{formatValue(value)}{nutrient.unit}</span>
            <span className="font-bold">{dv !== undefined ? `${Math.round(dv)}%` : ''}</span>
            <span>{formatValue(containerValue)}{nutrient.unit}</span>
            <span className="font-bold">{containerDv !== undefined ? `${Math.round(containerDv)}%` : ''}</span>
          </div>
        );
      })}

      {/* Vitamins/Minerals */}
      <div className="border-b-[6px] mt-1" style={{ borderColor }}></div>
      {vitaminsAndMinerals.map((nutrient) => {
        const value = getNutrientValue(nutrition, nutrient.key);
        const containerValue = value * servingsPerContainer;
        const dv = calculateDV(nutrient.key, value, dvBaselineCalories);
        const containerDv = calculateDV(nutrient.key, containerValue, dvBaselineCalories);

        return (
          <div key={nutrient.key} className="grid grid-cols-[1fr_40px_20px_40px_20px] text-[7px] border-b py-[1px]" style={{ borderColor }}>
            <span>{getDisplayName(nutrient)}</span>
            <span>{formatValue(value, 1)}{nutrient.unit}</span>
            <span>{dv !== undefined ? `${Math.round(dv)}%` : ''}</span>
            <span>{formatValue(containerValue, 1)}{nutrient.unit}</span>
            <span>{containerDv !== undefined ? `${Math.round(containerDv)}%` : ''}</span>
          </div>
        );
      })}

      {/* Footnote */}
      {showFootnote && (
        <div className="text-[6px] pt-1 leading-tight">
          {t('footnote')} {dvBaselineCalories} {t('caloriesAdvice')}.
        </div>
      )}
    </div>
  );
}

// ============================================================================
// LINEAR FORMAT - FDA 21 CFR 101.9(j)(13)(ii)(A)(2)
// Single line format for very small packages - with rounded border
// ============================================================================
function LinearFormat({
  nutrition,
  language = 'en',
  selectedLanguages = ['en'],
  selectedNutrients,
  styles = {},
  dvBaselineCalories = 2000,
  servingSize = 100,
  servingUnit = 'g',
  servingDescription,
  servingsPerContainer = 12,
}: NutritionBoxProps) {
  const borderColor = styles.borderColor || '#000000';
  const isBilingual = language === 'bilingual';
  const primaryLang = isBilingual ? (selectedLanguages[0] || 'en') : (language || 'en');
  const secondaryLang = selectedLanguages[1] || 'en';

  // Translation helpers
  const translations: Record<string, Record<string, string>> = {
    title: { en: 'Nutrition Facts', ar: 'الحقائق الغذائية', hi: 'पोषण तथ्य', zh: '营养成分', es: 'Información Nutricional', fr: 'Valeur Nutritive', ur: 'غذائی حقائق' },
    servSize: { en: 'Serv. Size', ar: 'حجم الحصة', hi: 'सर्विंग', zh: '每份', es: 'Porción', fr: 'Portion', ur: 'حصہ' },
    servings: { en: 'Servings', ar: 'الحصص', hi: 'सर्विंग्स', zh: '份数', es: 'Porciones', fr: 'Portions', ur: 'حصے' },
    calories: { en: 'Calories', ar: 'السعرات', hi: 'कैलोरी', zh: '卡路里', es: 'Calorías', fr: 'Calories', ur: 'کیلوریز' },
    dvNote: { en: '*Percent Daily Values (DV) are based on a', ar: '*تستند النسب المئوية للقيم اليومية على', hi: '*दैनिक मूल्य प्रतिशत आधारित है', zh: '*每日摄入量百分比基于', es: '*Los porcentajes de Valores Diarios se basan en', fr: '*Les pourcentages des Valeurs quotidiennes sont basés sur', ur: '*روزانہ اقدار فیصد پر مبنی ہے' },
    caloriesDiet: { en: 'calorie diet', ar: 'سعرة حرارية', hi: 'कैलोरी आहार', zh: '卡路里饮食', es: 'calorías', fr: 'calories', ur: 'کیلوری غذا' },
  };

  const t = (key: string) => {
    if (isBilingual) {
      return `${translations[key]?.[primaryLang] || translations[key]?.['en']} / ${translations[key]?.[secondaryLang] || translations[key]?.['en']}`;
    }
    return translations[key]?.[primaryLang] || translations[key]?.['en'] || key;
  };

  const isSelected = (key: string) => {
    if (!selectedNutrients || selectedNutrients.length === 0) return true;
    return selectedNutrients.includes(key);
  };

  const servingSizeDisplay = servingDescription
    ? `${servingDescription} (${servingSize}${servingUnit})`
    : `${servingSize}${servingUnit}`;

  // Nutrients to show in linear format
  const linearNutrientKeys = ['total_fat', 'saturated_fat', 'trans_fat', 'cholesterol', 'sodium', 'total_carbs', 'dietary_fiber', 'total_sugars', 'protein'];
  const vitaminKeys = ['vitamin_d', 'calcium', 'iron', 'potassium'];

  // Build the linear text content
  const buildNutrientText = () => {
    const parts: string[] = [];

    linearNutrientKeys.filter(key => isSelected(key)).forEach(key => {
      const nutrient = NUTRIENT_DEFINITIONS.find(nd => nd.key === key);
      if (!nutrient) return;
      const value = getNutrientValue(nutrition, key);
      const name = isBilingual
        ? `${getNutrientName(nutrient, primaryLang)}/${getNutrientName(nutrient, secondaryLang)}`
        : getNutrientName(nutrient, primaryLang);
      parts.push(`${name} ${formatValue(value)}${nutrient.unit}`);
    });

    return parts.join(', ');
  };

  const buildVitaminText = () => {
    const parts: string[] = [];

    vitaminKeys.filter(key => isSelected(key)).forEach(key => {
      const nutrient = NUTRIENT_DEFINITIONS.find(nd => nd.key === key);
      if (!nutrient) return;
      const value = getNutrientValue(nutrition, key);
      const dv = calculateDV(key, value, dvBaselineCalories);
      const name = isBilingual
        ? `${getNutrientName(nutrient, primaryLang)}/${getNutrientName(nutrient, secondaryLang)}`
        : getNutrientName(nutrient, primaryLang);
      parts.push(`${name} ${dv !== undefined ? Math.round(dv) : 0}%`);
    });

    return parts.join(' • ');
  };

  const getDirByLang = (langCode: string) => ['ar', 'ur'].includes(langCode) ? 'rtl' : 'ltr';

  return (
    <div
      className="h-full overflow-auto p-2"
      dir={getDirByLang(primaryLang)}
      style={{
        fontFamily: styles.fontFamily || 'Helvetica, Arial, sans-serif',
        fontSize: `${styles.fontSize || 8}px`,
        backgroundColor: styles.bgColor || '#ffffff',
        color: styles.textColor || '#000000',
        border: `${styles.borderWidth || 2}px solid ${borderColor}`,
        borderRadius: '8px',
      }}
    >
      <div className="leading-snug" style={{ fontSize: `${styles.fontSize || 8}px` }}>
        <span className="font-black" style={{ fontSize: `${(styles.fontSize || 8) + 2}px` }}>{t('title')} </span>
        <span>{t('servSize')}: {servingSizeDisplay}, </span>
        <span>{t('servings')}: {servingsPerContainer}, </span>
        <span className="font-bold">{t('calories')} </span>
        <span className="font-black" style={{ fontSize: `${(styles.fontSize || 8) + 1}px` }}>{Math.round(getNutrientValue(nutrition, 'calories'))}</span>
        <span>, {buildNutrientText()}</span>
        {vitaminKeys.filter(key => isSelected(key)).length > 0 && (
          <span>. {buildVitaminText()}.</span>
        )}
        <span className="ml-1">{t('dvNote')} {dvBaselineCalories.toLocaleString()} {t('caloriesDiet')}.</span>
      </div>
    </div>
  );
}

// ============================================================================
// SIMPLIFIED FORMAT - FDA 21 CFR 101.9(f)
// For foods with insignificant amounts of many nutrients
// ============================================================================
function SimplifiedFormat({
  nutrition,
  language = 'en',
  selectedLanguages = ['en'],
  selectedNutrients,
  styles = {},
  dvBaselineCalories = 2000,
  servingSize = 100,
  servingUnit = 'g',
  servingDescription,
  servingsPerContainer = 64,
  showFootnote = true,
}: NutritionBoxProps) {
  const borderColor = styles.borderColor || '#000000';
  const isBilingual = language === 'bilingual';
  const primaryLang = isBilingual ? (selectedLanguages[0] || 'en') : (language || 'en');
  const secondaryLang = selectedLanguages[1] || 'en';

  // Translation helpers
  const translations: Record<string, Record<string, string>> = {
    title: { en: 'Nutrition Facts', ar: 'الحقائق الغذائية', hi: 'पोषण तथ्य', zh: '营养成分', es: 'Información Nutricional', fr: 'Valeur Nutritive', ur: 'غذائی حقائق', bn: 'পুষ্টি তথ্য' },
    servingsPerContainer: { en: 'servings per container', ar: 'حصص لكل عبوة', hi: 'प्रति कंटेनर सर्विंग्स', zh: '每容器份数', es: 'porciones por envase', fr: 'portions par contenant', ur: 'فی کنٹینر سرونگز', bn: 'প্রতি কন্টেইনার সার্ভিং' },
    servingSize: { en: 'Serving size', ar: 'حجم الحصة', hi: 'सर्विंग का आकार', zh: '每份含量', es: 'Tamaño por porción', fr: 'Portion', ur: 'سرونگ سائز', bn: 'পরিবেশন মাপ' },
    amountPerServing: { en: 'Amount per serving', ar: 'الكمية لكل حصة', hi: 'प्रति सर्विंग मात्रा', zh: '每份含量', es: 'Cantidad por porción', fr: 'Quantité par portion', ur: 'فی سرونگ مقدار', bn: 'প্রতি পরিবেশনে পরিমাণ' },
    calories: { en: 'Calories', ar: 'السعرات الحرارية', hi: 'कैलोरी', zh: '卡路里', es: 'Calorías', fr: 'Calories', ur: 'کیلوریز', bn: 'ক্যালোরি' },
    dailyValue: { en: '% DV*', ar: '* % ق.ي', hi: '% दै.मू.*', zh: '% 日*', es: '% VD*', fr: '% VQ*', ur: '* % ر.ق', bn: '% দ.মূ.*' },
    notSignificant: { en: 'Not a significant source of', ar: 'ليس مصدراً مهماً لـ', hi: 'का महत्वपूर्ण स्रोत नहीं है', zh: '非重要来源', es: 'No es una fuente significativa de', fr: 'N\'est pas une source significative de', ur: 'اہم ذریعہ نہیں ہے', bn: 'উল্লেখযোগ্য উৎস নয়' },
    footnote: { en: '* %DV = %Daily Value', ar: '* % ق.ي = النسبة المئوية للقيمة اليومية', hi: '* % दै.मू. = % दैनिक मूल्य', zh: '* % 日 = 每日摄入量百分比', es: '* %VD = %Valor Diario', fr: '* %VQ = %Valeur Quotidienne', ur: '* % ر.ق = % روزانہ قدر', bn: '* % দ.মূ. = % দৈনিক মূল্য' },
  };

  const t = (key: string) => {
    if (isBilingual) {
      return `${translations[key]?.[primaryLang] || translations[key]?.['en']} / ${translations[key]?.[secondaryLang] || translations[key]?.['en']}`;
    }
    return translations[key]?.[primaryLang] || translations[key]?.['en'] || key;
  };

  const getDirByLang = (langCode: string) => ['ar', 'ur'].includes(langCode) ? 'rtl' : 'ltr';

  const getDisplayName = (nutrient: typeof NUTRIENT_DEFINITIONS[0]) => {
    if (isBilingual) {
      return `${getNutrientName(nutrient, primaryLang)} / ${getNutrientName(nutrient, secondaryLang)}`;
    }
    return getNutrientName(nutrient, primaryLang);
  };

  const isSelected = (key: string) => {
    if (!selectedNutrients || selectedNutrients.length === 0) return true;
    return selectedNutrients.includes(key);
  };

  const servingSizeDisplay = servingDescription
    ? `${servingDescription} (${servingSize}${servingUnit})`
    : `${servingSize}${servingUnit}`;

  // Only show nutrients with significant amounts
  const simplifiedNutrients = ['total_fat', 'saturated_fat', 'trans_fat', 'sodium', 'total_carbs', 'protein'];
  const insignificantNutrients = ['cholesterol', 'dietary_fiber', 'total_sugars', 'added_sugars', 'vitamin_d', 'calcium', 'iron', 'potassium'];

  return (
    <div
      className="h-full overflow-auto p-1"
      dir={getDirByLang(primaryLang)}
      style={{
        fontFamily: styles.fontFamily || 'Helvetica, Arial, sans-serif',
        fontSize: `${styles.fontSize || 8}px`,
        backgroundColor: styles.bgColor || '#ffffff',
        color: styles.textColor || '#000000',
        border: `${styles.borderWidth || 1}px solid ${borderColor}`,
      }}
    >
      {/* Title */}
      <div className="text-[18px] font-black leading-tight" style={{ fontFamily: 'Franklin Gothic Heavy, Arial Black, sans-serif' }}>
        {t('title')}
      </div>

      {/* Servings info */}
      <div className="text-[7px] border-b-[6px] pb-1" style={{ borderColor }}>
        <div>{servingsPerContainer} {t('servingsPerContainer')}</div>
        <div className="flex justify-between">
          <span className="font-bold">{t('servingSize')}</span>
          <span className="font-bold">{servingSizeDisplay}</span>
        </div>
      </div>

      {/* Calories */}
      <div className="border-b-[4px] py-1" style={{ borderColor }}>
        <div className="text-[7px]">{t('amountPerServing')}</div>
        <div className="flex justify-between items-baseline">
          <span className="text-[14px] font-black">{t('calories')}</span>
          <span className="text-[24px] font-black leading-none">{Math.round(getNutrientValue(nutrition, 'calories'))}</span>
        </div>
      </div>

      {/* % DV header */}
      <div className="text-[6px] text-right font-bold border-b py-0.5" style={{ borderColor }}>
        {t('dailyValue')}
      </div>

      {/* Simplified nutrients */}
      {simplifiedNutrients.filter(key => isSelected(key)).map(key => {
        const nutrient = NUTRIENT_DEFINITIONS.find(n => n.key === key);
        if (!nutrient) return null;
        const value = getNutrientValue(nutrition, key);
        const dv = nutrient.showDV ? calculateDV(key, value, dvBaselineCalories) : undefined;
        return (
          <div key={key} className="flex justify-between text-[7px] border-b py-[1px]" style={{ borderColor, paddingLeft: nutrient.indent ? '10px' : '0' }}>
            <span className={nutrient.bold ? 'font-bold' : ''}>
              {getDisplayName(nutrient)} {formatValue(value)}{nutrient.unit}
            </span>
            <span className="font-bold">{dv !== undefined ? `${Math.round(dv)}%` : ''}</span>
          </div>
        );
      })}

      {/* Thick divider */}
      <div className="border-b-[6px] mt-1" style={{ borderColor }}></div>

      {/* Not significant source statement */}
      <div className="text-[6px] pt-1 leading-tight">
        {t('notSignificant')} {insignificantNutrients.map((key, idx) => {
          const nutrient = NUTRIENT_DEFINITIONS.find(n => n.key === key);
          const name = isBilingual
            ? `${getNutrientName(nutrient!, primaryLang).toLowerCase()}/${getNutrientName(nutrient!, secondaryLang).toLowerCase()}`
            : getNutrientName(nutrient!, primaryLang).toLowerCase();
          return idx === insignificantNutrients.length - 1 ? `${name}` : `${name}, `;
        })}
      </div>

      {/* Footnote */}
      {showFootnote && (
        <div className="text-[5px] pt-1">
          {t('footnote')}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// VERTICAL WITH MICRONUTRIENTS SIDE-BY-SIDE
// ============================================================================
function VerticalMicronutrientsSideFormat({
  nutrition,
  language = 'en',
  selectedLanguages = ['en'],
  selectedNutrients,
  styles = {},
  dvBaselineCalories = 2000,
  servingSize = 100,
  servingUnit = 'g',
  servingDescription,
  servingsPerContainer = 8,
  showFootnote = true,
}: NutritionBoxProps) {
  const borderColor = styles.borderColor || '#000000';
  const isBilingual = language === 'bilingual';
  const primaryLang = isBilingual ? (selectedLanguages[0] || 'en') : (language || 'en');
  const secondaryLang = selectedLanguages[1] || 'en';

  // Translation helpers
  const translations: Record<string, Record<string, string>> = {
    title: { en: 'Nutrition Facts', ar: 'الحقائق الغذائية', hi: 'पोषण तथ्य', zh: '营养成分', es: 'Información Nutricional', fr: 'Valeur Nutritive', ur: 'غذائی حقائق', bn: 'পুষ্টি তথ্য' },
    servingsPerContainer: { en: 'servings per container', ar: 'حصص لكل عبوة', hi: 'प्रति कंटेनर सर्विंग्स', zh: '每容器份数', es: 'porciones por envase', fr: 'portions par contenant', ur: 'فی کنٹینر سرونگز', bn: 'প্রতি কন্টেইনার সার্ভিং' },
    servingSize: { en: 'Serving size', ar: 'حجم الحصة', hi: 'सर्विंग का आकार', zh: '每份含量', es: 'Tamaño por porción', fr: 'Portion', ur: 'سرونگ سائز', bn: 'পরিবেশন মাপ' },
    amountPerServing: { en: 'Amount per serving', ar: 'الكمية لكل حصة', hi: 'प्रति सर्विंग मात्रा', zh: '每份含量', es: 'Cantidad por porción', fr: 'Quantité par portion', ur: 'فی سرونگ مقدار', bn: 'প্রতি পরিবেশনে পরিমাণ' },
    calories: { en: 'Calories', ar: 'السعرات الحرارية', hi: 'कैलोरी', zh: '卡路里', es: 'Calorías', fr: 'Calories', ur: 'کیلوریز', bn: 'ক্যালোরি' },
    dailyValue: { en: '% Daily Value*', ar: '* % القيمة اليومية', hi: '% दैनिक मूल्य*', zh: '% 每日摄入量*', es: '% Valor Diario*', fr: '% Valeur quotidienne*', ur: '* % روزانہ قدر', bn: '% দৈনিক মূল্য*' },
    footnote: { en: '* The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet.', ar: '*تخبرك النسبة المئوية للقيمة اليومية بمدى مساهمة المغذيات في الحصة الواحدة في النظام الغذائي اليومي.', hi: '*% दैनिक मूल्य (DV) आपको बताता है कि भोजन की एक सर्विंग में पोषक तत्व दैनिक आहार में कितना योगदान देता है।', zh: '*每日摄入量百分比告诉您一份食物中的营养素对日常饮食的贡献。', es: '*El % Valor Diario (VD) le indica cuánto contribuye un nutriente en una porción de alimento a una dieta diaria.', fr: '*Le % de la valeur quotidienne (VQ) vous indique la contribution d\'un nutriment dans une portion d\'aliment à un régime quotidien.', ur: '*% روزانہ قدر آپ کو بتاتی ہے کہ کھانے کی ایک سرونگ میں غذائی اجزاء روزانہ کی خوراک میں کتنا حصہ ڈالتے ہیں۔', bn: '*% দৈনিক মূল্য (DV) আপনাকে জানায় যে খাবারের এক পরিবেশনে পুষ্টি উপাদান দৈনিক খাদ্যে কতটা অবদান রাখে।' },
    caloriesAdvice: { en: 'calories a day is used for general nutrition advice', ar: 'سعرة حرارية يوميا للنصائح الغذائية العامة', hi: 'कैलोरी प्रति दिन सामान्य पोषण सलाह के लिए', zh: '卡路里/天用于一般营养建议', es: 'calorías al día para consejos de nutrición', fr: 'calories par jour pour conseils nutritionnels', ur: 'کیلوریز فی دن عمومی غذائی مشورے کے لیے', bn: 'ক্যালোরি প্রতিদিন সাধারণ পুষ্টি পরামর্শের জন্য' },
  };

  const t = (key: string) => {
    if (isBilingual) {
      return `${translations[key]?.[primaryLang] || translations[key]?.['en']} / ${translations[key]?.[secondaryLang] || translations[key]?.['en']}`;
    }
    return translations[key]?.[primaryLang] || translations[key]?.['en'] || key;
  };

  const getDirByLang = (langCode: string) => ['ar', 'ur'].includes(langCode) ? 'rtl' : 'ltr';

  const getDisplayName = (nutrient: typeof NUTRIENT_DEFINITIONS[0]) => {
    if (isBilingual) {
      return `${getNutrientName(nutrient, primaryLang)} / ${getNutrientName(nutrient, secondaryLang)}`;
    }
    return getNutrientName(nutrient, primaryLang);
  };

  const isSelected = (key: string) => {
    if (!selectedNutrients || selectedNutrients.length === 0) return true;
    return selectedNutrients.includes(key);
  };

  const servingSizeDisplay = servingDescription
    ? `${servingDescription} (${servingSize}${servingUnit})`
    : `${servingSize}${servingUnit}`;

  const coreNutrients = NUTRIENT_DEFINITIONS.filter(n => n.category === 'core' && isSelected(n.key));
  const vitaminsAndMinerals = NUTRIENT_DEFINITIONS.filter(n =>
    (n.category === 'vitamin' || n.category === 'mineral') && isSelected(n.key)
  );

  return (
    <div
      className="h-full overflow-auto p-1"
      dir={getDirByLang(primaryLang)}
      style={{
        fontFamily: styles.fontFamily || 'Helvetica, Arial, sans-serif',
        fontSize: `${styles.fontSize || 8}px`,
        backgroundColor: styles.bgColor || '#ffffff',
        color: styles.textColor || '#000000',
        border: `${styles.borderWidth || 1}px solid ${borderColor}`,
      }}
    >
      {/* Title */}
      <div className="text-[20px] font-black leading-tight" style={{ fontFamily: 'Franklin Gothic Heavy, Arial Black, sans-serif' }}>
        {t('title')}
      </div>

      {/* Servings info */}
      <div className="text-[7px] border-b-[6px] pb-1" style={{ borderColor }}>
        <div>{servingsPerContainer} {t('servingsPerContainer')}</div>
        <div className="flex justify-between">
          <span className="font-bold">{t('servingSize')}</span>
          <span className="font-bold">{servingSizeDisplay}</span>
        </div>
      </div>

      {/* Calories */}
      <div className="border-b-[4px] py-1" style={{ borderColor }}>
        <div className="text-[7px]">{t('amountPerServing')}</div>
        <div className="flex justify-between items-baseline">
          <span className="text-[16px] font-black">{t('calories')}</span>
          <span className="text-[28px] font-black leading-none">{Math.round(getNutrientValue(nutrition, 'calories'))}</span>
        </div>
      </div>

      {/* % DV header */}
      <div className="text-[6px] text-right font-bold border-b py-0.5" style={{ borderColor }}>
        {t('dailyValue')}
      </div>

      {/* Core nutrients */}
      {coreNutrients.filter(n => n.key !== 'calories').map((nutrient) => {
        const value = getNutrientValue(nutrition, nutrient.key);
        const dv = nutrient.showDV ? calculateDV(nutrient.key, value, dvBaselineCalories) : undefined;

        return (
          <div
            key={nutrient.key}
            className="flex justify-between border-b py-[1px]"
            style={{ borderColor, paddingLeft: nutrient.indent ? `${nutrient.indent * 10}px` : '0' }}
          >
            <span className={nutrient.bold ? 'font-bold' : ''}>
              {getDisplayName(nutrient)} {formatValue(value)}{nutrient.unit}
            </span>
            <span className="font-bold">{dv !== undefined ? `${Math.round(dv)}%` : ''}</span>
          </div>
        );
      })}

      {/* Thick divider */}
      <div className="border-b-[6px] mt-1" style={{ borderColor }}></div>

      {/* Vitamins/Minerals in 2-column grid */}
      <div className="grid grid-cols-2 gap-x-2">
        {vitaminsAndMinerals.map((nutrient) => {
          const value = getNutrientValue(nutrition, nutrient.key);
          const dv = calculateDV(nutrient.key, value, dvBaselineCalories);
          return (
            <div key={nutrient.key} className="flex justify-between text-[6px] border-b py-[1px]" style={{ borderColor }}>
              <span>{getDisplayName(nutrient)} {formatValue(value, 1)}{nutrient.unit}</span>
              <span>{dv !== undefined ? `${Math.round(dv)}%` : ''}</span>
            </div>
          );
        })}
      </div>

      {/* Footnote */}
      {showFootnote && (
        <div className="text-[5px] pt-1 leading-tight">
          {t('footnote')} {dvBaselineCalories} {t('caloriesAdvice')}.
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TABULAR DUAL COLUMN FORMAT - FDA 21 CFR 101.9(e)(6)(ii)
// Horizontal format with Per Serving and Per Container columns
// ============================================================================
function TabularDualColumnFormat({
  nutrition,
  language = 'en',
  selectedLanguages = ['en'],
  selectedNutrients,
  styles = {},
  dvBaselineCalories = 2000,
  servingSize = 255,
  servingUnit = 'g',
  servingDescription = '1 cup',
  servingsPerContainer = 2,
  showFootnote = true,
}: NutritionBoxProps) {
  const borderColor = styles.borderColor || '#000000';
  const isBilingual = language === 'bilingual';
  const primaryLang = isBilingual ? (selectedLanguages[0] || 'en') : (language || 'en');
  const secondaryLang = selectedLanguages[1] || 'en';

  // Translation helpers
  const translations: Record<string, Record<string, string>> = {
    title: { en: 'Nutrition Facts', ar: 'الحقائق الغذائية', hi: 'पोषण तथ्य', zh: '营养成分', es: 'Información Nutricional', fr: 'Valeur Nutritive', ur: 'غذائی حقائق', bn: 'পুষ্টি তথ্য' },
    servingsPerContainer: { en: 'servings per container', ar: 'حصص لكل عبوة', hi: 'प्रति कंटेनर सर्विंग्स', zh: '每容器份数', es: 'porciones por envase', fr: 'portions par contenant', ur: 'فی کنٹینر سرونگز', bn: 'প্রতি কন্টেইনার সার্ভিং' },
    servingSize: { en: 'Serving size', ar: 'حجم الحصة', hi: 'सर्विंग का आकार', zh: '每份含量', es: 'Tamaño por porción', fr: 'Portion', ur: 'سرونگ سائز', bn: 'পরিবেশন মাপ' },
    calories: { en: 'Calories', ar: 'السعرات الحرارية', hi: 'कैलोरी', zh: '卡路里', es: 'Calorías', fr: 'Calories', ur: 'کیلوریز', bn: 'ক্যালোরি' },
    perServing: { en: 'per serving', ar: 'لكل حصة', hi: 'प्रति सर्विंग', zh: '每份', es: 'por porción', fr: 'par portion', ur: 'فی سرونگ', bn: 'প্রতি পরিবেশন' },
    perContainer: { en: 'per container', ar: 'لكل عبوة', hi: 'प्रति कंटेनर', zh: '每容器', es: 'por envase', fr: 'par contenant', ur: 'فی کنٹینر', bn: 'প্রতি কন্টেইনার' },
    perServingDV: { en: 'Per serving\n% DV*', ar: 'لكل حصة\n* % ق.ي', hi: 'प्रति सर्विंग\n% दै.मू.*', zh: '每份\n% 日*', es: 'Por porción\n% VD*', fr: 'Par portion\n% VQ*', ur: 'فی سرونگ\n* % ر.ق', bn: 'প্রতি পরিবেশন\n% দ.মূ.*' },
    perContainerDV: { en: 'Per container\n% DV*', ar: 'لكل عبوة\n* % ق.ي', hi: 'प्रति कंटेनर\n% दै.मू.*', zh: '每容器\n% 日*', es: 'Por envase\n% VD*', fr: 'Par contenant\n% VQ*', ur: 'فی کنٹینر\n* % ر.ق', bn: 'প্রতি কন্টেইনার\n% দ.মূ.*' },
    footnote: { en: '*The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet.', ar: '*تخبرك النسبة المئوية للقيمة اليومية بمدى مساهمة المغذيات في الحصة الواحدة في النظام الغذائي اليومي.', hi: '*% दैनिक मूल्य (DV) आपको बताता है कि भोजन की एक सर्विंग में पोषक तत्व दैनिक आहार में कितना योगदान देता है।', zh: '*每日摄入量百分比告诉您一份食物中的营养素对日常饮食的贡献。', es: '*El % Valor Diario (VD) le indica cuánto contribuye un nutriente en una porción de alimento a una dieta diaria.', fr: '*Le % de la valeur quotidienne (VQ) vous indique la contribution d\'un nutriment dans une portion d\'aliment à un régime quotidien.', ur: '*% روزانہ قدر آپ کو بتاتی ہے کہ کھانے کی ایک سرونگ میں غذائی اجزاء روزانہ کی خوراک میں کتنا حصہ ڈالتے ہیں۔', bn: '*% দৈনিক মূল্য (DV) আপনাকে জানায় যে খাবারের এক পরিবেশনে পুষ্টি উপাদান দৈনিক খাদ্যে কতটা অবদান রাখে।' },
    caloriesAdvice: { en: 'calories a day is used for general nutrition advice', ar: 'سعرة حرارية يوميا للنصائح الغذائية العامة', hi: 'कैलोरी प्रति दिन सामान्य पोषण सलाह के लिए', zh: '卡路里/天用于一般营养建议', es: 'calorías al día para consejos de nutrición', fr: 'calories par jour pour conseils nutritionnels', ur: 'کیلوریز فی دن عمومی غذائی مشورے کے لیے', bn: 'ক্যালোরি প্রতিদিন সাধারণ পুষ্টি পরামর্শের জন্য' },
  };

  const t = (key: string) => {
    if (isBilingual) {
      return `${translations[key]?.[primaryLang] || translations[key]?.['en']} / ${translations[key]?.[secondaryLang] || translations[key]?.['en']}`;
    }
    return translations[key]?.[primaryLang] || translations[key]?.['en'] || key;
  };

  const getDirByLang = (langCode: string) => ['ar', 'ur'].includes(langCode) ? 'rtl' : 'ltr';

  const getDisplayName = (nutrient: typeof NUTRIENT_DEFINITIONS[0]) => {
    if (isBilingual) {
      return `${getNutrientName(nutrient, primaryLang)} / ${getNutrientName(nutrient, secondaryLang)}`;
    }
    return getNutrientName(nutrient, primaryLang);
  };

  const isSelected = (key: string) => {
    if (!selectedNutrients || selectedNutrients.length === 0) return true;
    return selectedNutrients.includes(key);
  };

  const servingSizeDisplay = servingDescription
    ? `${servingDescription} (${servingSize}${servingUnit})`
    : `${servingSize}${servingUnit}`;

  // Left section nutrients
  const leftNutrients = ['total_fat', 'saturated_fat', 'trans_fat', 'cholesterol', 'sodium'];
  // Right section nutrients
  const rightNutrients = ['total_carbs', 'dietary_fiber', 'total_sugars', 'added_sugars', 'protein'];
  // Bottom vitamins - left side
  const leftVitamins = ['vitamin_d', 'calcium'];
  // Bottom vitamins - right side
  const rightVitamins = ['iron', 'potassium'];

  return (
    <div
      className="h-full overflow-hidden flex"
      dir={getDirByLang(primaryLang)}
      style={{
        fontFamily: styles.fontFamily || 'Helvetica Neue, Helvetica, Arial, sans-serif',
        backgroundColor: styles.bgColor || '#ffffff',
        color: styles.textColor || '#000000',
        border: `${styles.borderWidth || 1}px solid ${borderColor}`,
      }}
    >
      {/* Left section - Title, servings, and calories */}
      <div className="flex-shrink-0 p-2 flex flex-col overflow-hidden" style={{ width: isBilingual ? '140px' : '130px', borderRight: `1px solid ${borderColor}` }}>
        {/* Title */}
        <div className="text-[22px] font-black leading-[0.85] truncate" style={{ fontFamily: 'Franklin Gothic Heavy, Impact, Arial Black, sans-serif' }}>
          {t('title')}
        </div>

        {/* Servings info */}
        <div className="text-[8px] mt-2 overflow-hidden">
          <div className="truncate">{servingsPerContainer} {t('servingsPerContainer')}</div>
          <div className="font-bold truncate">{t('servingSize')}</div>
          <div className="font-bold">{servingSizeDisplay}</div>
        </div>

        {/* Calories with dual display */}
        <div className="mt-2 flex-1" style={{ borderTop: `8px solid ${borderColor}`, paddingTop: '4px' }}>
          <div className="text-[12px] font-bold truncate">{t('calories')}</div>
          <div className="flex items-end gap-1">
            <div className="text-center flex-1">
              <div className="text-[32px] font-black leading-none">{Math.round(getNutrientValue(nutrition, 'calories'))}</div>
              <div className="text-[6px] truncate">{t('perServing')}</div>
            </div>
            <div className="text-[16px] font-bold pb-2">|</div>
            <div className="text-center flex-1">
              <div className="text-[32px] font-black leading-none">{Math.round(getNutrientValue(nutrition, 'calories') * servingsPerContainer)}</div>
              <div className="text-[6px] truncate">{t('perContainer')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main nutrients area */}
      <div className="flex-1 min-w-0 flex flex-col p-2 overflow-hidden">
        <div className="flex-1 flex gap-2">
          {/* Left nutrients column */}
          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_35px_28px_35px_28px] text-[6px] font-bold pb-1" style={{ borderBottom: `3px solid ${borderColor}` }}>
              <span></span>
              <span></span>
              <span className="text-center whitespace-pre-line">{t('perServingDV')}</span>
              <span></span>
              <span className="text-center whitespace-pre-line">{t('perContainerDV')}</span>
            </div>
            {leftNutrients.filter(key => isSelected(key)).map(key => {
              const nutrient = NUTRIENT_DEFINITIONS.find(n => n.key === key);
              if (!nutrient) return null;
              const value = getNutrientValue(nutrition, key);
              const contValue = value * servingsPerContainer;
              const dv = nutrient.showDV ? calculateDV(key, value, dvBaselineCalories) : undefined;
              const contDv = nutrient.showDV ? calculateDV(key, contValue, dvBaselineCalories) : undefined;
              const isIndented = nutrient.indent && nutrient.indent > 0;
              return (
                <div
                  key={key}
                  className="grid grid-cols-[1fr_35px_28px_35px_28px] text-[8px] py-[1px]"
                  style={{ borderBottom: `1px solid ${borderColor}`, paddingLeft: isIndented ? '8px' : '0' }}
                >
                  <span className={`truncate ${nutrient.bold ? 'font-bold' : ''}`}>
                    {getDisplayName(nutrient)}
                  </span>
                  <span className="text-right">{formatValue(value)}{nutrient.unit}</span>
                  <span className="text-center font-bold">{dv !== undefined ? `${Math.round(dv)}%` : ''}</span>
                  <span className="text-right">{formatValue(contValue)}{nutrient.unit}</span>
                  <span className="text-center font-bold">{contDv !== undefined ? `${Math.round(contDv)}%` : ''}</span>
                </div>
              );
            })}
            {/* Left vitamins */}
            <div className="mt-1" style={{ borderTop: `3px solid ${borderColor}`, paddingTop: '2px' }}>
              {leftVitamins.filter(key => isSelected(key)).map(key => {
                const nutrient = NUTRIENT_DEFINITIONS.find(n => n.key === key);
                if (!nutrient) return null;
                const value = getNutrientValue(nutrition, key);
                const contValue = value * servingsPerContainer;
                const dv = calculateDV(key, value, dvBaselineCalories);
                const contDv = calculateDV(key, contValue, dvBaselineCalories);
                return (
                  <div key={key} className="grid grid-cols-[1fr_35px_28px_35px_28px] text-[8px] py-[1px]" style={{ borderBottom: `1px solid ${borderColor}` }}>
                    <span className="truncate">{getDisplayName(nutrient)}</span>
                    <span className="text-right">{formatValue(value, 1)}{nutrient.unit}</span>
                    <span className="text-center">{dv !== undefined ? `${Math.round(dv)}%` : ''}</span>
                    <span className="text-right">{formatValue(contValue, 1)}{nutrient.unit}</span>
                    <span className="text-center">{contDv !== undefined ? `${Math.round(contDv)}%` : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right nutrients column */}
          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_35px_28px_35px_28px] text-[6px] font-bold pb-1" style={{ borderBottom: `3px solid ${borderColor}` }}>
              <span></span>
              <span></span>
              <span className="text-center whitespace-pre-line">{t('perServingDV')}</span>
              <span></span>
              <span className="text-center whitespace-pre-line">{t('perContainerDV')}</span>
            </div>
            {rightNutrients.filter(key => isSelected(key)).map(key => {
              const nutrient = NUTRIENT_DEFINITIONS.find(n => n.key === key);
              if (!nutrient) return null;
              const value = getNutrientValue(nutrition, key);
              const contValue = value * servingsPerContainer;
              const dv = nutrient.showDV ? calculateDV(key, value, dvBaselineCalories) : undefined;
              const contDv = nutrient.showDV ? calculateDV(key, contValue, dvBaselineCalories) : undefined;
              const isIndented = nutrient.indent && nutrient.indent > 0;
              return (
                <div
                  key={key}
                  className="grid grid-cols-[1fr_35px_28px_35px_28px] text-[8px] py-[1px]"
                  style={{ borderBottom: `1px solid ${borderColor}`, paddingLeft: isIndented ? '8px' : '0' }}
                >
                  <span className={`truncate ${nutrient.bold ? 'font-bold' : ''}`}>
                    {getDisplayName(nutrient)}
                  </span>
                  <span className="text-right">{formatValue(value)}{nutrient.unit}</span>
                  <span className="text-center font-bold">{dv !== undefined ? `${Math.round(dv)}%` : ''}</span>
                  <span className="text-right">{formatValue(contValue)}{nutrient.unit}</span>
                  <span className="text-center font-bold">{contDv !== undefined ? `${Math.round(contDv)}%` : ''}</span>
                </div>
              );
            })}
            {/* Right vitamins */}
            <div className="mt-1" style={{ borderTop: `3px solid ${borderColor}`, paddingTop: '2px' }}>
              {rightVitamins.filter(key => isSelected(key)).map(key => {
                const nutrient = NUTRIENT_DEFINITIONS.find(n => n.key === key);
                if (!nutrient) return null;
                const value = getNutrientValue(nutrition, key);
                const contValue = value * servingsPerContainer;
                const dv = calculateDV(key, value, dvBaselineCalories);
                const contDv = calculateDV(key, contValue, dvBaselineCalories);
                return (
                  <div key={key} className="grid grid-cols-[1fr_35px_28px_35px_28px] text-[8px] py-[1px]" style={{ borderBottom: `1px solid ${borderColor}` }}>
                    <span className="truncate">{getDisplayName(nutrient)}</span>
                    <span className="text-right">{formatValue(value, 1)}{nutrient.unit}</span>
                    <span className="text-center">{dv !== undefined ? `${Math.round(dv)}%` : ''}</span>
                    <span className="text-right">{formatValue(contValue, 1)}{nutrient.unit}</span>
                    <span className="text-center">{contDv !== undefined ? `${Math.round(contDv)}%` : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footnote at bottom */}
        {showFootnote && (
          <div className="text-[6px] pt-1 mt-1 truncate" style={{ borderTop: `1px solid ${borderColor}` }}>
            {t('footnote')} {dvBaselineCalories} {t('caloriesAdvice')}.
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// INFANTS FORMAT - FDA 21 CFR 101.9(j)(5)(ii)(B)
// For foods intended for infants through 12 months
// ============================================================================
function InfantsFormat({
  nutrition,
  language = 'en',
  selectedLanguages = ['en'],
  selectedNutrients,
  styles = {},
  servingSize = 70,
  servingUnit = 'g',
  servingDescription,
  servingsPerContainer = 4,
}: NutritionBoxProps) {
  const borderColor = styles.borderColor || '#000000';
  const isBilingual = language === 'bilingual';
  const primaryLang = isBilingual ? (selectedLanguages[0] || 'en') : (language || 'en');
  const secondaryLang = selectedLanguages[1] || 'en';

  // Translation helpers
  const translations: Record<string, Record<string, string>> = {
    title: { en: 'Nutrition Facts', ar: 'الحقائق الغذائية', hi: 'पोषण तथ्य', zh: '营养成分', es: 'Información Nutricional', fr: 'Valeur Nutritive', ur: 'غذائی حقائق', bn: 'পুষ্টি তথ্য' },
    servingsPerContainer: { en: 'servings per container', ar: 'حصص لكل عبوة', hi: 'प्रति कंटेनर सर्विंग्स', zh: '每容器份数', es: 'porciones por envase', fr: 'portions par contenant', ur: 'فی کنٹینر سرونگز', bn: 'প্রতি কন্টেইনার সার্ভিং' },
    servingSize: { en: 'Serving size', ar: 'حجم الحصة', hi: 'सर्विंग का आकार', zh: '每份含量', es: 'Tamaño por porción', fr: 'Portion', ur: 'سرونگ سائز', bn: 'পরিবেশন মাপ' },
    amountPerServing: { en: 'Amount per serving', ar: 'الكمية لكل حصة', hi: 'प्रति सर्विंग मात्रा', zh: '每份含量', es: 'Cantidad por porción', fr: 'Quantité par portion', ur: 'فی سرونگ مقدار', bn: 'প্রতি পরিবেশনে পরিমাণ' },
    calories: { en: 'Calories', ar: 'السعرات الحرارية', hi: 'कैलोरी', zh: '卡路里', es: 'Calorías', fr: 'Calories', ur: 'کیلوریز', bn: 'ক্যালোরি' },
    dailyValue: { en: '% Daily Value', ar: '% القيمة اليومية', hi: '% दैनिक मूल्य', zh: '% 每日摄入量', es: '% Valor Diario', fr: '% Valeur quotidienne', ur: '% روزانہ قدر', bn: '% দৈনিক মূল্য' },
  };

  const t = (key: string) => {
    if (isBilingual) {
      return `${translations[key]?.[primaryLang] || translations[key]?.['en']} / ${translations[key]?.[secondaryLang] || translations[key]?.['en']}`;
    }
    return translations[key]?.[primaryLang] || translations[key]?.['en'] || key;
  };

  const getDirByLang = (langCode: string) => ['ar', 'ur'].includes(langCode) ? 'rtl' : 'ltr';

  const getDisplayName = (nutrient: typeof NUTRIENT_DEFINITIONS[0]) => {
    if (isBilingual) {
      return `${getNutrientName(nutrient, primaryLang)} / ${getNutrientName(nutrient, secondaryLang)}`;
    }
    return getNutrientName(nutrient, primaryLang);
  };

  const isSelected = (key: string) => {
    if (!selectedNutrients || selectedNutrients.length === 0) return true;
    return selectedNutrients.includes(key);
  };

  const servingSizeDisplay = servingDescription
    ? `${servingDescription} (${servingSize}${servingUnit})`
    : `${servingSize}${servingUnit}`;

  // Infant DVs are different - using FDA infant reference values
  const infantDVs: Record<string, number> = {
    total_fat: 30, total_carbs: 95, protein: 11, sodium: 370,
    vitamin_d: 10, calcium: 260, iron: 11, potassium: 700,
  };

  const calculateInfantDV = (key: string, value: number): number | undefined => {
    const dv = infantDVs[key];
    if (!dv) return undefined;
    return (value / dv) * 100;
  };

  const coreNutrients = NUTRIENT_DEFINITIONS.filter(n => n.category === 'core' && isSelected(n.key));
  const vitamins = ['vitamin_d', 'calcium', 'iron', 'potassium'];

  return (
    <div
      className="h-full overflow-auto p-1"
      dir={getDirByLang(primaryLang)}
      style={{
        fontFamily: styles.fontFamily || 'Helvetica, Arial, sans-serif',
        fontSize: `${styles.fontSize || 8}px`,
        backgroundColor: styles.bgColor || '#ffffff',
        color: styles.textColor || '#000000',
        border: `${styles.borderWidth || 1}px solid ${borderColor}`,
      }}
    >
      {/* Title */}
      <div className="text-[18px] font-black leading-tight" style={{ fontFamily: 'Franklin Gothic Heavy, Arial Black, sans-serif' }}>
        {t('title')}
      </div>

      {/* Servings info */}
      <div className="text-[7px] border-b-[6px] pb-1" style={{ borderColor }}>
        <div>{servingsPerContainer} {t('servingsPerContainer')}</div>
        <div className="flex justify-between">
          <span className="font-bold">{t('servingSize')}</span>
          <span className="font-bold">{servingSizeDisplay}</span>
        </div>
      </div>

      {/* Calories */}
      <div className="border-b-[4px] py-1" style={{ borderColor }}>
        <div className="text-[7px]">{t('amountPerServing')}</div>
        <div className="flex justify-between items-baseline">
          <span className="text-[14px] font-black">{t('calories')}</span>
          <span className="text-[24px] font-black leading-none">{Math.round(getNutrientValue(nutrition, 'calories'))}</span>
        </div>
      </div>

      {/* % DV header - No asterisk for infant labels */}
      <div className="text-[6px] text-right font-bold border-b py-0.5" style={{ borderColor }}>
        {t('dailyValue')}
      </div>

      {/* Core nutrients */}
      {coreNutrients.filter(n => n.key !== 'calories').map((nutrient) => {
        const value = getNutrientValue(nutrition, nutrient.key);
        const dv = calculateInfantDV(nutrient.key, value);

        return (
          <div
            key={nutrient.key}
            className="flex justify-between border-b py-[1px]"
            style={{ borderColor, paddingLeft: nutrient.indent ? `${nutrient.indent * 10}px` : '0' }}
          >
            <span className={nutrient.bold ? 'font-bold' : ''}>
              {getDisplayName(nutrient)} {formatValue(value)}{nutrient.unit}
            </span>
            <span className="font-bold">{dv !== undefined ? `${Math.round(dv)}%` : ''}</span>
          </div>
        );
      })}

      {/* Thick divider */}
      <div className="border-b-[6px] mt-1" style={{ borderColor }}></div>

      {/* Vitamins/Minerals */}
      {vitamins.filter(key => isSelected(key)).map(key => {
        const nutrient = NUTRIENT_DEFINITIONS.find(n => n.key === key);
        if (!nutrient) return null;
        const value = getNutrientValue(nutrition, key);
        const dv = calculateInfantDV(key, value);
        return (
          <div key={key} className="flex justify-between text-[7px] border-b py-[1px]" style={{ borderColor }}>
            <span>{getDisplayName(nutrient)} {formatValue(value, 1)}{nutrient.unit}</span>
            <span>{dv !== undefined ? `${Math.round(dv)}%` : ''}</span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// CHILDREN 1-3 YEARS FORMAT - FDA 21 CFR 101.9(j)(5)(iii)(A)
// ============================================================================
function Children1to3Format({
  nutrition,
  language = 'en',
  selectedLanguages = ['en'],
  selectedNutrients,
  styles = {},
  servingSize = 85,
  servingUnit = 'g',
  servingDescription,
  servingsPerContainer = 1,
  showFootnote = true,
}: NutritionBoxProps) {
  const borderColor = styles.borderColor || '#000000';
  const isBilingual = language === 'bilingual';
  const primaryLang = isBilingual ? (selectedLanguages[0] || 'en') : (language || 'en');
  const secondaryLang = selectedLanguages[1] || 'en';

  // Translation helpers
  const translations: Record<string, Record<string, string>> = {
    title: { en: 'Nutrition Facts', ar: 'الحقائق الغذائية', hi: 'पोषण तथ्य', zh: '营养成分', es: 'Información Nutricional', fr: 'Valeur Nutritive', ur: 'غذائی حقائق', bn: 'পুষ্টি তথ্য' },
    servingsPerContainer: { en: 'per container', ar: 'لكل عبوة', hi: 'प्रति कंटेनर', zh: '每容器', es: 'por envase', fr: 'par contenant', ur: 'فی کنٹینر', bn: 'প্রতি কন্টেইনার' },
    serving: { en: 'serving', ar: 'حصة', hi: 'सर्विंग', zh: '份', es: 'porción', fr: 'portion', ur: 'سرونگ', bn: 'পরিবেশন' },
    servings: { en: 'servings', ar: 'حصص', hi: 'सर्विंग्स', zh: '份', es: 'porciones', fr: 'portions', ur: 'سرونگز', bn: 'পরিবেশন' },
    servingSize: { en: 'Serving size', ar: 'حجم الحصة', hi: 'सर्विंग का आकार', zh: '每份含量', es: 'Tamaño por porción', fr: 'Portion', ur: 'سرونگ سائز', bn: 'পরিবেশন মাপ' },
    amountPerServing: { en: 'Amount per serving', ar: 'الكمية لكل حصة', hi: 'प्रति सर्विंग मात्रा', zh: '每份含量', es: 'Cantidad por porción', fr: 'Quantité par portion', ur: 'فی سرونگ مقدار', bn: 'প্রতি পরিবেশনে পরিমাণ' },
    calories: { en: 'Calories', ar: 'السعرات الحرارية', hi: 'कैलोरी', zh: '卡路里', es: 'Calorías', fr: 'Calories', ur: 'کیلوریز', bn: 'ক্যালোরি' },
    dailyValue: { en: '% Daily Value*', ar: '* % القيمة اليومية', hi: '% दैनिक मूल्य*', zh: '% 每日摄入量*', es: '% Valor Diario*', fr: '% Valeur quotidienne*', ur: '* % روزانہ قدر', bn: '% দৈনিক মূল্য*' },
    footnote: { en: '* The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 1,000 calories a day is used for general nutrition advice.', ar: '*تخبرك النسبة المئوية للقيمة اليومية بمدى مساهمة المغذيات. 1000 سعرة حرارية يوميا للنصائح الغذائية.', hi: '*% दैनिक मूल्य (DV) आपको बताता है। 1,000 कैलोरी प्रति दिन सामान्य पोषण सलाह के लिए।', zh: '*每日摄入量百分比。1000卡路里/天用于一般营养建议。', es: '*El % Valor Diario le indica cuánto contribuye. 1,000 calorías al día para consejos de nutrición.', fr: '*Le % de la valeur quotidienne vous indique. 1000 calories par jour pour conseils nutritionnels.', ur: '*% روزانہ قدر آپ کو بتاتی ہے۔ 1000 کیلوریز فی دن عمومی غذائی مشورے کے لیے۔', bn: '*% দৈনিক মূল্য আপনাকে জানায়। 1,000 ক্যালোরি প্রতিদিন সাধারণ পুষ্টি পরামর্শের জন্য।' },
  };

  const t = (key: string) => {
    if (isBilingual) {
      return `${translations[key]?.[primaryLang] || translations[key]?.['en']} / ${translations[key]?.[secondaryLang] || translations[key]?.['en']}`;
    }
    return translations[key]?.[primaryLang] || translations[key]?.['en'] || key;
  };

  const getDirByLang = (langCode: string) => ['ar', 'ur'].includes(langCode) ? 'rtl' : 'ltr';

  const getDisplayName = (nutrient: typeof NUTRIENT_DEFINITIONS[0]) => {
    if (isBilingual) {
      return `${getNutrientName(nutrient, primaryLang)} / ${getNutrientName(nutrient, secondaryLang)}`;
    }
    return getNutrientName(nutrient, primaryLang);
  };

  const isSelected = (key: string) => {
    if (!selectedNutrients || selectedNutrients.length === 0) return true;
    return selectedNutrients.includes(key);
  };

  const servingSizeDisplay = servingDescription
    ? `${servingDescription} (${servingSize}${servingUnit})`
    : `${servingSize}${servingUnit}`;

  // Children 1-3 years DVs
  const childDVs: Record<string, number> = {
    total_fat: 39, saturated_fat: 10, cholesterol: 300, sodium: 1500,
    total_carbs: 150, dietary_fiber: 14, added_sugars: 25, protein: 13,
    vitamin_d: 15, calcium: 700, iron: 7, potassium: 2000,
  };

  const calculateChildDV = (key: string, value: number): number | undefined => {
    const dv = childDVs[key];
    if (!dv) return undefined;
    return (value / dv) * 100;
  };

  const coreNutrients = NUTRIENT_DEFINITIONS.filter(n => n.category === 'core' && isSelected(n.key));
  const vitamins = ['vitamin_d', 'calcium', 'iron', 'potassium'];

  return (
    <div
      className="h-full overflow-auto p-1"
      dir={getDirByLang(primaryLang)}
      style={{
        fontFamily: styles.fontFamily || 'Helvetica, Arial, sans-serif',
        fontSize: `${styles.fontSize || 8}px`,
        backgroundColor: styles.bgColor || '#ffffff',
        color: styles.textColor || '#000000',
        border: `${styles.borderWidth || 1}px solid ${borderColor}`,
      }}
    >
      {/* Title */}
      <div className="text-[18px] font-black leading-tight" style={{ fontFamily: 'Franklin Gothic Heavy, Arial Black, sans-serif' }}>
        {t('title')}
      </div>

      {/* Servings info */}
      <div className="text-[7px] border-b-[6px] pb-1" style={{ borderColor }}>
        <div>{servingsPerContainer} {servingsPerContainer > 1 ? t('servings') : t('serving')} {t('servingsPerContainer')}</div>
        <div className="flex justify-between">
          <span className="font-bold">{t('servingSize')}</span>
          <span className="font-bold">{servingSizeDisplay}</span>
        </div>
      </div>

      {/* Calories */}
      <div className="border-b-[4px] py-1" style={{ borderColor }}>
        <div className="text-[7px]">{t('amountPerServing')}</div>
        <div className="flex justify-between items-baseline">
          <span className="text-[14px] font-black">{t('calories')}</span>
          <span className="text-[24px] font-black leading-none">{Math.round(getNutrientValue(nutrition, 'calories'))}</span>
        </div>
      </div>

      {/* % DV header */}
      <div className="text-[6px] text-right font-bold border-b py-0.5" style={{ borderColor }}>
        {t('dailyValue')}
      </div>

      {/* Core nutrients */}
      {coreNutrients.filter(n => n.key !== 'calories').map((nutrient) => {
        const value = getNutrientValue(nutrition, nutrient.key);
        const dv = calculateChildDV(nutrient.key, value);

        return (
          <div
            key={nutrient.key}
            className="flex justify-between border-b py-[1px]"
            style={{ borderColor, paddingLeft: nutrient.indent ? `${nutrient.indent * 10}px` : '0' }}
          >
            <span className={nutrient.bold ? 'font-bold' : ''}>
              {getDisplayName(nutrient)} {formatValue(value)}{nutrient.unit}
            </span>
            <span className="font-bold">{dv !== undefined ? `${Math.round(dv)}%` : ''}</span>
          </div>
        );
      })}

      {/* Thick divider */}
      <div className="border-b-[6px] mt-1" style={{ borderColor }}></div>

      {/* Vitamins/Minerals */}
      {vitamins.filter(key => isSelected(key)).map(key => {
        const nutrient = NUTRIENT_DEFINITIONS.find(n => n.key === key);
        if (!nutrient) return null;
        const value = getNutrientValue(nutrition, key);
        const dv = calculateChildDV(key, value);
        return (
          <div key={key} className="flex justify-between text-[7px] border-b py-[1px]" style={{ borderColor }}>
            <span>{getDisplayName(nutrient)} {formatValue(value, 1)}{nutrient.unit}</span>
            <span>{dv !== undefined ? `${Math.round(dv)}%` : ''}</span>
          </div>
        );
      })}

      {/* Footnote - uses 1,000 calories for children 1-3 */}
      {showFootnote && (
        <div className="text-[5px] pt-1 leading-tight">
          {t('footnote')}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN NUTRITION BOX PREVIEW - Routes to correct format
// ============================================================================
function NutritionBoxPreview({
  nutrition,
  language = 'en',
  selectedLanguages = ['en'],
  selectedNutrients,
  styles = {},
  dvBaselineCalories = 2000,
  servingSize = 100,
  servingUnit = 'g',
  servingDescription,
  servingsPerContainer = 8,
  showDailyValue = true,
  showFootnote = true,
  format = 'standard-vertical',
}: NutritionBoxProps) {
  const props: NutritionBoxProps = {
    nutrition,
    language,
    selectedLanguages,
    selectedNutrients,
    styles,
    dvBaselineCalories,
    servingSize,
    servingUnit,
    servingDescription,
    servingsPerContainer,
    showDailyValue,
    showFootnote,
  };

  // Route to the correct format component
  switch (format) {
    case 'standard-vertical':
      return <StandardVerticalFormat {...props} />;
    case 'vertical-micronutrients-side':
      return <VerticalMicronutrientsSideFormat {...props} />;
    case 'tabular':
      return <TabularFormat {...props} />;
    case 'dual-column':
      return <DualColumnFormat {...props} />;
    case 'linear':
      return <LinearFormat {...props} />;
    case 'simplified':
      return <SimplifiedFormat {...props} />;
    case 'tabular-dual-column':
      return <TabularDualColumnFormat {...props} />;
    case 'infants':
      return <InfantsFormat {...props} />;
    case 'children-1-3':
      return <Children1to3Format {...props} />;
    default:
      return <StandardVerticalFormat {...props} />;
  }
}


/**
 * Nutrition Label Page
 *
 * Enhanced label generation page with:
 * - Multiple label type support (Traffic Light, FDA, GSO Bilingual, etc.)
 * - Drag-and-drop element repositioning
 * - Multi-language support (English, Arabic, Bilingual)
 * - Dynamic color theming
 * - Real-time preview
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../services/api';
import {
  ChevronLeft,
  Eye,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Import label components
import {
  BilingualVerticalLabel,
  BilingualLinearLabel,
  FDAVerticalLabel,
} from '../components/labels';
import type {
  NutrientRow,
  FDANutrientRow,
} from '../components/labels';

// Label type definitions matching backend
const LABEL_TYPES = [
  { code: 'fda_vertical', name: 'New Vertical (default)', region: 'USA' },
  { code: 'fda_linear', name: 'Old Linear FDA', region: 'USA' },
  { code: 'gso_bilingual', name: 'GSO Bilingual', region: 'GCC' },
  { code: 'eu_standard', name: 'EU Standard', region: 'EU' },
];

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English Only' },
  { value: 'ar', label: 'Arabic Only' },
  { value: 'bilingual', label: 'English & Arabic' },
];

const SERVING_TYPE_OPTIONS = [
  { value: 'per_serving', label: 'Per Serving' },
  { value: 'per_100g', label: 'Per 100g' },
  { value: 'both', label: 'Per 100g & Per Serving' },
];

interface DisplayPreferences {
  hideIngredients: boolean;
  hideAllergens: boolean;
  hideBusinessDetails: boolean;
  hideSugarAlcohol: boolean;
  additionalMicroNutrients: boolean;
  preferSodiumOverSalt: boolean;
  preferCalorieOverJoule: boolean;
}

export default function NutritionLabelPage() {
  const { productId: paramProductId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Product ID from params or query string
  const productId = paramProductId || searchParams.get('product');

  // State
  const [labelType, setLabelType] = useState('fda_vertical');
  const [language, setLanguage] = useState('bilingual');
  const [servingType, setServingType] = useState('per_serving');
  const [servingSize, setServingSize] = useState(250);
  const [servingUnit, setServingUnit] = useState('g');
  const [servingDescription, setServingDescription] = useState('');
  const [servingsPerContainer, setServingsPerContainer] = useState<number | undefined>();
  const [zoom, setZoom] = useState(1);

  // Display preferences
  const [preferences, setPreferences] = useState<DisplayPreferences>({
    hideIngredients: false,
    hideAllergens: false,
    hideBusinessDetails: false,
    hideSugarAlcohol: false,
    additionalMicroNutrients: false,
    preferSodiumOverSalt: true,
    preferCalorieOverJoule: true,
  });

  // Fetch product data
  const { data: product } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productsApi.get(productId!),
    enabled: !!productId,
  });

  // Fetch nutrition data
  const { data: nutrition } = useQuery({
    queryKey: ['product-nutrition', productId, servingSize],
    queryFn: () => productsApi.getNutrition(productId!),
    enabled: !!productId,
  });

  // Initialize from product
  useEffect(() => {
    if (product) {
      setServingSize(product.serving_size || 100);
      setServingUnit(product.serving_unit || 'g');
      if (product.serving_description) {
        setServingDescription(product.serving_description);
      }
      if (product.servings_per_container) {
        setServingsPerContainer(product.servings_per_container);
      }
    }
  }, [product]);

  // Export handler
  const handleExport = async (format: 'png' | 'pdf' | 'svg') => {
    toast.success(`Export to ${format.toUpperCase()} coming soon!`);
  };

  // Preview handler
  const handlePreview = () => {
    toast.success('Opening preview...');
  };

  // Convert nutrition data to label format
  const getNutrientRows = useCallback((): NutrientRow[] => {
    if (!nutrition) return [];

    const baseMultiplier = servingSize / 100;

    return [
      {
        key: 'calories',
        nameEn: 'Calories',
        nameAr: 'سعرات حرارية',
        valuePer100g: nutrition.calories / baseMultiplier,
        valuePerServing: nutrition.calories,
        unit: '',
        bold: true,
      },
      {
        key: 'total_fat',
        nameEn: 'Total Fat',
        nameAr: 'الدهون الكلية',
        valuePer100g: nutrition.total_fat / baseMultiplier,
        valuePerServing: nutrition.total_fat,
        unit: 'g',
        percentDvPer100g: (nutrition.total_fat / baseMultiplier / 78) * 100,
        percentDvPerServing: nutrition.total_fat_dv,
        bold: true,
      },
      {
        key: 'saturated_fat',
        nameEn: 'Saturated Fat',
        nameAr: 'الدهون المشبعة',
        valuePer100g: nutrition.saturated_fat / baseMultiplier,
        valuePerServing: nutrition.saturated_fat,
        unit: 'g',
        percentDvPer100g: (nutrition.saturated_fat / baseMultiplier / 20) * 100,
        percentDvPerServing: nutrition.saturated_fat_dv,
        indent: 1,
      },
      {
        key: 'trans_fat',
        nameEn: 'Trans Fat',
        nameAr: 'الدهون المتحولة',
        valuePer100g: nutrition.trans_fat / baseMultiplier,
        valuePerServing: nutrition.trans_fat,
        unit: 'g',
        indent: 1,
      },
      {
        key: 'cholesterol',
        nameEn: 'Cholesterol',
        nameAr: 'الكوليسترول',
        valuePer100g: nutrition.cholesterol / baseMultiplier,
        valuePerServing: nutrition.cholesterol,
        unit: 'mg',
        percentDvPer100g: (nutrition.cholesterol / baseMultiplier / 300) * 100,
        percentDvPerServing: nutrition.cholesterol_dv,
      },
      {
        key: 'sodium',
        nameEn: preferences.preferSodiumOverSalt ? 'Sodium' : 'Salt',
        nameAr: preferences.preferSodiumOverSalt ? 'الصوديوم' : 'ملح',
        valuePer100g: nutrition.sodium / baseMultiplier,
        valuePerServing: nutrition.sodium,
        unit: 'mg',
        percentDvPer100g: (nutrition.sodium / baseMultiplier / 2300) * 100,
        percentDvPerServing: nutrition.sodium_dv,
        bold: true,
      },
      {
        key: 'total_carbs',
        nameEn: 'Total Carbohydrates',
        nameAr: 'الكربوهيدرات الكلية',
        valuePer100g: nutrition.total_carbs / baseMultiplier,
        valuePerServing: nutrition.total_carbs,
        unit: 'g',
        percentDvPer100g: (nutrition.total_carbs / baseMultiplier / 275) * 100,
        percentDvPerServing: nutrition.total_carbs_dv,
        bold: true,
      },
      {
        key: 'dietary_fiber',
        nameEn: 'Dietary Fiber',
        nameAr: 'الألياف الغذائية',
        valuePer100g: nutrition.dietary_fiber / baseMultiplier,
        valuePerServing: nutrition.dietary_fiber,
        unit: 'g',
        percentDvPer100g: (nutrition.dietary_fiber / baseMultiplier / 28) * 100,
        percentDvPerServing: nutrition.dietary_fiber_dv,
        indent: 1,
      },
      {
        key: 'total_sugars',
        nameEn: 'Total Sugars',
        nameAr: 'السكريات الكلية',
        valuePer100g: nutrition.total_sugars / baseMultiplier,
        valuePerServing: nutrition.total_sugars,
        unit: 'g',
        indent: 1,
      },
      {
        key: 'added_sugars',
        nameEn: 'Added Sugars',
        nameAr: 'السكريات المضافة',
        valuePer100g: nutrition.added_sugars / baseMultiplier,
        valuePerServing: nutrition.added_sugars,
        unit: 'g',
        percentDvPer100g: (nutrition.added_sugars / baseMultiplier / 50) * 100,
        percentDvPerServing: nutrition.added_sugars_dv,
        indent: 2,
      },
      {
        key: 'protein',
        nameEn: 'Protein',
        nameAr: 'بروتين',
        valuePer100g: nutrition.protein / baseMultiplier,
        valuePerServing: nutrition.protein,
        unit: 'g',
        bold: true,
      },
      {
        key: 'vitamin_d',
        nameEn: 'Vitamin D',
        nameAr: 'فيتامين د',
        valuePer100g: nutrition.vitamin_d / baseMultiplier,
        valuePerServing: nutrition.vitamin_d,
        unit: 'mcg',
        percentDvPer100g: (nutrition.vitamin_d / baseMultiplier / 20) * 100,
        percentDvPerServing: nutrition.vitamin_d_dv,
      },
      {
        key: 'calcium',
        nameEn: 'Calcium',
        nameAr: 'كالسيوم',
        valuePer100g: nutrition.calcium / baseMultiplier,
        valuePerServing: nutrition.calcium,
        unit: 'mg',
        percentDvPer100g: (nutrition.calcium / baseMultiplier / 1300) * 100,
        percentDvPerServing: nutrition.calcium_dv,
      },
      {
        key: 'iron',
        nameEn: 'Iron',
        nameAr: 'حديد',
        valuePer100g: nutrition.iron / baseMultiplier,
        valuePerServing: nutrition.iron,
        unit: 'mg',
        percentDvPer100g: (nutrition.iron / baseMultiplier / 18) * 100,
        percentDvPerServing: nutrition.iron_dv,
      },
      {
        key: 'potassium',
        nameEn: 'Potassium',
        nameAr: 'بوتاسيوم',
        valuePer100g: nutrition.potassium / baseMultiplier,
        valuePerServing: nutrition.potassium,
        unit: 'mg',
        percentDvPer100g: (nutrition.potassium / baseMultiplier / 4700) * 100,
        percentDvPerServing: nutrition.potassium_dv,
      },
    ];
  }, [nutrition, servingSize, preferences.preferSodiumOverSalt]);

  // Render the appropriate label based on selected type
  const renderLabel = () => {
    if (!nutrition) {
      return (
        <div className="w-full h-64 flex items-center justify-center text-gray-400">
          Select a product to preview the label
        </div>
      );
    }

    const nutrientRows = getNutrientRows();
    const showPer100g = servingType === 'per_100g' || servingType === 'both';
    const showPerServing = servingType === 'per_serving' || servingType === 'both';

    switch (labelType) {
      case 'fda_linear':
        return (
          <div className="p-4">
            <BilingualLinearLabel
              nutrients={nutrientRows.filter(n => ['calories', 'total_fat', 'saturated_fat', 'trans_fat', 'cholesterol', 'sodium', 'total_carbs', 'dietary_fiber', 'total_sugars', 'protein', 'vitamin_d', 'calcium', 'iron', 'potassium'].includes(n.key))}
              servingSize={servingSize}
              servingUnit={servingUnit}
            />
          </div>
        );

      case 'gso_bilingual':
      case 'eu_standard':
        return (
          <BilingualVerticalLabel
            title="Nutrition Facts"
            titleAr="الحقائق الغذائية"
            servingSize={servingSize}
            servingUnit={servingUnit}
            servingDescription={servingDescription}
            nutrients={nutrientRows}
            showPer100g={showPer100g}
            showPerServing={showPerServing}
            showPercentDv={true}
            footnote="* The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice."
            footnoteAr="* تخبرك القيمة اليومية المئوية بمدى مساهمة المغذي في النظام الغذائي اليومي. يُستخدم 2000 سعرة حرارية في اليوم للإرشادات الغذائية العامة."
          />
        );

      case 'fda_vertical':
      default:
        // Convert to FDA format
        const fdaNutrients: FDANutrientRow[] = nutrientRows
          .filter(n => n.key !== 'calories')
          .map(n => ({
            key: n.key,
            name: n.nameEn,
            nameAr: n.nameAr,
            value: showPerServing ? n.valuePerServing : n.valuePer100g,
            unit: n.unit,
            percentDv: showPerServing ? n.percentDvPerServing : n.percentDvPer100g,
            indent: n.indent,
            bold: n.bold,
          }));

        return (
          <FDAVerticalLabel
            servingsPerContainer={servingsPerContainer}
            servingSize={servingSize}
            servingUnit={servingUnit}
            servingDescription={servingDescription || `${servingSize}${servingUnit}`}
            calories={showPerServing ? nutrition.calories : nutrition.calories * (100 / servingSize)}
            nutrients={fdaNutrients.slice(0, 10)} // Main nutrients
            vitaminsAndMinerals={fdaNutrients.slice(10)} // Vitamins and minerals
            language={language as 'en' | 'ar' | 'bilingual'}
            width={300}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft size={20} />
              <span>Recipes</span>
            </button>
            <div className="text-lg font-semibold text-gray-900">
              {product?.name || 'Loading...'}
            </div>
          </div>
          <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium">
            Publish Recipe
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-8 text-sm">
            {['Recipe Details', 'Ingredients, Nutrition Facts', 'Cost', 'Prep Method', 'Nutrition Label'].map((tab, idx) => (
              <button
                key={tab}
                className={`py-3 border-b-2 ${
                  idx === 4
                    ? 'border-primary-500 text-primary-600 font-medium'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Label Type Selection Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label Type
            </label>
            <select
              value={labelType}
              onChange={(e) => setLabelType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {LABEL_TYPES.map((type) => (
                <option key={type.code} value={type.code}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Serving Type
            </label>
            <select
              value={servingType}
              onChange={(e) => setServingType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {SERVING_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Left Sidebar - Preferences */}
          <div className="w-72 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              {/* Select Preference */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Select Preference
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="sodiumSalt"
                      checked={preferences.preferSodiumOverSalt}
                      onChange={() => setPreferences(p => ({ ...p, preferSodiumOverSalt: true }))}
                      className="text-primary-500 focus:ring-primary-500"
                    />
                    <span>Sodium</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="sodiumSalt"
                      checked={!preferences.preferSodiumOverSalt}
                      onChange={() => setPreferences(p => ({ ...p, preferSodiumOverSalt: false }))}
                      className="text-primary-500 focus:ring-primary-500"
                    />
                    <span>Salt</span>
                  </label>
                </div>

                <div className="space-y-2 mt-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="energyUnit"
                      checked={preferences.preferCalorieOverJoule}
                      onChange={() => setPreferences(p => ({ ...p, preferCalorieOverJoule: true }))}
                      className="text-primary-500 focus:ring-primary-500"
                    />
                    <span>Calorie</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="energyUnit"
                      checked={!preferences.preferCalorieOverJoule}
                      onChange={() => setPreferences(p => ({ ...p, preferCalorieOverJoule: false }))}
                      className="text-primary-500 focus:ring-primary-500"
                    />
                    <span>Joule</span>
                  </label>
                </div>
              </div>

              {/* Display Preferences */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Display Preferences
                </h3>
                <div className="space-y-2">
                  {[
                    { key: 'hideIngredients', label: 'Hide Ingredients' },
                    { key: 'hideAllergens', label: 'Hide Allergens' },
                    { key: 'hideBusinessDetails', label: 'Hide Business Details' },
                    { key: 'hideSugarAlcohol', label: 'Hide Sugar Alcohol' },
                    { key: 'additionalMicroNutrients', label: 'Additional Micro Nutrients' },
                  ].map((pref) => (
                    <label key={pref.key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(preferences as any)[pref.key]}
                        onChange={(e) =>
                          setPreferences((p) => ({
                            ...p,
                            [pref.key]: e.target.checked,
                          }))
                        }
                        className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                      />
                      <span>{pref.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Preview Area */}
          <div className="flex-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {/* Label Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-primary-600">
                  {LABEL_TYPES.find(t => t.code === labelType)?.name || 'Label Preview'}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePreview}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                  >
                    <Eye size={16} />
                    Preview
                  </button>
                  <button
                    onClick={() => handleExport('png')}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded"
                  >
                    <Download size={16} />
                    Download
                  </button>
                </div>
              </div>

              {/* Serving Info */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Serving Size
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      value={servingSize}
                      onChange={(e) => setServingSize(Number(e.target.value))}
                      className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-l focus:ring-1 focus:ring-primary-500"
                    />
                    <select
                      value={servingUnit}
                      onChange={(e) => setServingUnit(e.target.value)}
                      className="px-2 py-1.5 text-sm border border-l-0 border-gray-300 rounded-r bg-gray-50"
                    >
                      <option value="g">G</option>
                      <option value="ml">ML</option>
                      <option value="oz">OZ</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Serving Description
                  </label>
                  <input
                    type="text"
                    value={servingDescription}
                    onChange={(e) => setServingDescription(e.target.value)}
                    placeholder="Eg. 1 Cup"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    No of servings/Container
                  </label>
                  <input
                    type="number"
                    value={servingsPerContainer || ''}
                    onChange={(e) => setServingsPerContainer(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="e.g 100"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Label Preview */}
              <div className="border border-gray-200 rounded-lg p-8 bg-gray-50 min-h-[400px] flex items-center justify-center">
                <div
                  className="bg-white shadow-lg"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center center',
                  }}
                >
                  {renderLabel()}
                </div>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
                  className="p-1.5 hover:bg-gray-100 rounded"
                >
                  <ZoomOut size={18} />
                </button>
                <span className="text-sm text-gray-600 w-16 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(z => Math.min(2, z + 0.1))}
                  className="p-1.5 hover:bg-gray-100 rounded"
                >
                  <ZoomIn size={18} />
                </button>
                <button
                  onClick={() => setZoom(1)}
                  className="p-1.5 hover:bg-gray-100 rounded ml-2"
                >
                  <RotateCcw size={18} />
                </button>
              </div>
            </div>

            {/* Additional Sections */}
            {!preferences.hideIngredients && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-700">Ingredients</h3>
                  <button className="text-sm text-primary-600 hover:text-primary-700">
                    Edit
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Ingredients:</strong> {product?.ingredients?.map(i => i.display_name || i.ingredient_name).join(', ') || 'No ingredients added'}
                </p>
              </div>
            )}

            {!preferences.hideAllergens && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-700">Allergens</h3>
                  <button className="text-sm text-primary-600 hover:text-primary-700">
                    Edit
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Contains:</strong> {/* Allergens would go here */}
                </p>
              </div>
            )}

            {!preferences.hideBusinessDetails && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-700">Business Details</h3>
                  <button className="text-sm text-primary-600 hover:text-primary-700">
                    Edit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

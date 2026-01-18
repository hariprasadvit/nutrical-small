import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Eye,
  Globe,
  ZoomIn,
  ZoomOut,
  Settings,
  ChevronDown,
  Check,
  List,
  AlertTriangle,
  Thermometer,
  QrCode,
  Barcode,
  MapPin,
  FileText,
  Calendar,
  Building,
  Percent,
  Minus,
  MoreHorizontal,
  GripVertical,
  Plus,
  X,
  Trash2,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface LabelElement {
  id: string;
  name: string;
  icon: React.ElementType;
  enabled: boolean;
  required?: boolean;
}

interface Ingredient {
  id: string;
  name: string;
  percentage?: number;
  isAllergen: boolean;
  allergenType?: string;
}

interface Allergen {
  id: string;
  name: string;
  status: 'contains' | 'may_contain' | 'free_from';
  highlight: boolean;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const INITIAL_ELEMENTS: LabelElement[] = [
  { id: 'ingredients', name: 'Ingredient List', icon: List, enabled: false },
  { id: 'customFields', name: 'Custom Fields', icon: FileText, enabled: false },
  { id: 'alcohol', name: 'Alcohol %', icon: Percent, enabled: false },
  { id: 'qrCode', name: 'QR Code', icon: QrCode, enabled: false },
  { id: 'nameAddress', name: 'Name & Address', icon: Building, enabled: false },
  { id: 'barcode', name: 'Barcode', icon: Barcode, enabled: false },
  { id: 'origin', name: 'Origin', icon: MapPin, enabled: false },
  { id: 'instructions', name: 'Instructions', icon: FileText, enabled: false },
  { id: 'traceability', name: 'Traceability', icon: FileText, enabled: false },
  { id: 'storage', name: 'Storage', icon: Thermometer, enabled: false },
  { id: 'dividerLine', name: 'Divider Line', icon: Minus, enabled: false },
];

const MOCK_INGREDIENTS: Ingredient[] = [
  { id: '1', name: 'Wheat Flour', percentage: 45, isAllergen: true, allergenType: 'Wheat' },
  { id: '2', name: 'Sugar', percentage: 20, isAllergen: false },
  { id: '3', name: 'Butter', percentage: 15, isAllergen: true, allergenType: 'Milk' },
  { id: '4', name: 'Chocolate Chips', percentage: 12, isAllergen: true, allergenType: 'Soy' },
  { id: '5', name: 'Eggs', percentage: 5, isAllergen: true, allergenType: 'Eggs' },
  { id: '6', name: 'Vanilla Extract', percentage: 2, isAllergen: false },
  { id: '7', name: 'Salt', percentage: 1, isAllergen: false },
];

const MOCK_ALLERGENS: Allergen[] = [
  { id: '1', name: 'Wheat', status: 'contains', highlight: true },
  { id: '2', name: 'Milk', status: 'contains', highlight: true },
  { id: '3', name: 'Soy', status: 'contains', highlight: true },
  { id: '4', name: 'Eggs', status: 'contains', highlight: true },
  { id: '5', name: 'Tree Nuts', status: 'may_contain', highlight: false },
  { id: '6', name: 'Peanuts', status: 'free_from', highlight: false },
];

const REGIONS = [
  { id: 'fda', name: 'FDA (USA)', flag: '🇺🇸' },
  { id: 'gso', name: 'GSO (GCC)', flag: '🇸🇦' },
  { id: 'eu', name: 'EU', flag: '🇪🇺' },
  { id: 'uk', name: 'UK', flag: '🇬🇧' },
  { id: 'fssai', name: 'FSSAI (India)', flag: '🇮🇳' },
];

const DIETARY_BADGES = [
  { id: 'halal', name: 'Halal', icon: '☪️' },
  { id: 'kosher', name: 'Kosher', icon: '✡️' },
  { id: 'vegetarian', name: 'Vegetarian', icon: '🥬' },
  { id: 'vegan', name: 'Vegan', icon: '🌱' },
  { id: 'organic', name: 'Organic', icon: '🌿' },
  { id: 'glutenFree', name: 'Gluten Free', icon: '🌾' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function LabelCreatorPage() {
  const navigate = useNavigate();

  // State
  const [labelName, setLabelName] = useState('Chocolate Chip Cookies');
  const [selectedRegion, setSelectedRegion] = useState('fda');
  const [zoom, setZoom] = useState(1);
  const [elements, setElements] = useState(INITIAL_ELEMENTS);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState(MOCK_INGREDIENTS);
  const [allergens, setAllergens] = useState(MOCK_ALLERGENS);
  const [activeBadges, setActiveBadges] = useState<string[]>(['vegetarian']);
  const [storageText, setStorageText] = useState('Store in a cool, dry place.');
  const [instructionsText, setInstructionsText] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);

  // Product identity state
  const [productIdentity, setProductIdentity] = useState({
    legalName: 'Chocolate Chip Cookies',
    brandName: "Baker's Best",
    netWeight: '300',
    netWeightUnit: 'g',
    bestBefore: '',
    batchCode: '',
  });

  // Toggle element
  const toggleElement = (id: string) => {
    setElements(prev =>
      prev.map(el => (el.id === id ? { ...el, enabled: !el.enabled } : el))
    );
    setSelectedElementId(id);
  };

  // Toggle dietary badge
  const toggleBadge = (id: string) => {
    setActiveBadges(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  // Get enabled elements for preview
  const enabledElements = elements.filter(el => el.enabled);

  // Render ingredient list with allergen highlighting
  const renderIngredientList = () => {
    return ingredients
      .map(ing => {
        const text = ing.percentage ? `${ing.name} (${ing.percentage}%)` : ing.name;
        if (ing.isAllergen) {
          return `<strong>${text}</strong>`;
        }
        return text;
      })
      .join(', ');
  };

  // Render allergen statement
  const renderAllergenStatement = () => {
    const containsAllergens = allergens.filter(a => a.status === 'contains').map(a => a.name);
    const mayContain = allergens.filter(a => a.status === 'may_contain').map(a => a.name);

    let statement = '';
    if (containsAllergens.length > 0) {
      statement += `Contains: ${containsAllergens.join(', ')}.`;
    }
    if (mayContain.length > 0) {
      statement += ` May contain: ${mayContain.join(', ')}.`;
    }
    return statement;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <input
            type="text"
            value={labelName}
            onChange={(e) => setLabelName(e.target.value)}
            className="text-lg font-semibold bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-emerald-500 outline-none px-1"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Region Selector */}
          <div className="relative">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer hover:border-gray-300"
            >
              {REGIONS.map(region => (
                <option key={region.id} value={region.id}>
                  {region.flag} {region.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-2 bg-white">
            <button
              onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
              className="p-1.5 hover:bg-gray-100 rounded"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-sm text-gray-600 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(2, z + 0.1))}
              className="p-1.5 hover:bg-gray-100 rounded"
            >
              <ZoomIn size={16} />
            </button>
          </div>

          {/* Preview */}
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm">
            <Eye size={16} />
            Preview
          </button>

          {/* Export */}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Element Checklist */}
        <div className="w-72 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Label Elements</h3>
            <p className="text-xs text-gray-500 mt-1">Toggle elements to include on label</p>
          </div>

          {/* Element List */}
          <div className="p-2">
            {elements.map((element) => (
              <div
                key={element.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                  selectedElementId === element.id
                    ? 'bg-emerald-50 border border-emerald-200'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedElementId(element.id)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleElement(element.id);
                  }}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    element.enabled
                      ? 'bg-emerald-600 border-emerald-600'
                      : 'border-gray-300 hover:border-emerald-400'
                  }`}
                >
                  {element.enabled && <Check size={14} className="text-white" />}
                </button>
                <element.icon size={18} className="text-gray-400" />
                <span className={`text-sm flex-1 ${element.enabled ? 'text-gray-900' : 'text-gray-600'}`}>
                  {element.name}
                </span>
              </div>
            ))}
          </div>

          {/* Other Element Button */}
          <div className="p-2 border-t border-gray-200">
            <button className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 rounded-lg">
              <MoreHorizontal size={18} />
              Other element...
            </button>
          </div>

          {/* Dietary Badges */}
          <div className="p-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-700 text-sm mb-3">Dietary Badges</h4>
            <div className="grid grid-cols-2 gap-2">
              {DIETARY_BADGES.map((badge) => (
                <button
                  key={badge.id}
                  onClick={() => toggleBadge(badge.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                    activeBadges.includes(badge.id)
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span>{badge.icon}</span>
                  <span>{badge.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center - Label Preview */}
        <div className="flex-1 overflow-auto p-8 flex items-start justify-center">
          <div
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-6"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
          >
            {/* Simulated Label Preview */}
            <div className="w-[350px] border-2 border-black p-4 font-sans text-sm">
              {/* Header */}
              <div className="text-center border-b-8 border-black pb-2 mb-2">
                <h1 className="text-2xl font-black">Nutrition Facts</h1>
              </div>

              {/* Serving Info */}
              <div className="border-b border-black pb-1 mb-1 text-sm">
                <div className="flex justify-between">
                  <span>8 servings per container</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Serving size</span>
                  <span>1 cookie (38g)</span>
                </div>
              </div>

              {/* Calories */}
              <div className="border-b-8 border-black py-2">
                <div className="text-xs">Amount per serving</div>
                <div className="flex justify-between items-baseline">
                  <span className="text-3xl font-black">Calories</span>
                  <span className="text-4xl font-black">180</span>
                </div>
              </div>

              {/* % Daily Value Header */}
              <div className="text-right text-xs font-bold border-b border-black py-1">
                % Daily Value*
              </div>

              {/* Nutrients */}
              <div className="text-xs space-y-0.5">
                <div className="flex justify-between border-b border-gray-300 py-0.5">
                  <span><strong>Total Fat</strong> 9g</span>
                  <span className="font-bold">12%</span>
                </div>
                <div className="flex justify-between border-b border-gray-300 py-0.5 pl-4">
                  <span>Saturated Fat 5g</span>
                  <span className="font-bold">25%</span>
                </div>
                <div className="flex justify-between border-b border-gray-300 py-0.5 pl-4">
                  <span><em>Trans</em> Fat 0g</span>
                  <span></span>
                </div>
                <div className="flex justify-between border-b border-gray-300 py-0.5">
                  <span><strong>Cholesterol</strong> 20mg</span>
                  <span className="font-bold">7%</span>
                </div>
                <div className="flex justify-between border-b border-gray-300 py-0.5">
                  <span><strong>Sodium</strong> 100mg</span>
                  <span className="font-bold">4%</span>
                </div>
                <div className="flex justify-between border-b border-gray-300 py-0.5">
                  <span><strong>Total Carbohydrate</strong> 24g</span>
                  <span className="font-bold">9%</span>
                </div>
                <div className="flex justify-between border-b border-gray-300 py-0.5 pl-4">
                  <span>Dietary Fiber 1g</span>
                  <span className="font-bold">4%</span>
                </div>
                <div className="flex justify-between border-b border-gray-300 py-0.5 pl-4">
                  <span>Total Sugars 12g</span>
                  <span></span>
                </div>
                <div className="flex justify-between border-b border-black py-0.5 pl-8">
                  <span>Includes 10g Added Sugars</span>
                  <span className="font-bold">20%</span>
                </div>
                <div className="flex justify-between border-b-8 border-black py-0.5">
                  <span><strong>Protein</strong> 2g</span>
                  <span></span>
                </div>

                {/* Vitamins/Minerals */}
                <div className="flex justify-between py-0.5">
                  <span>Vitamin D 0mcg</span>
                  <span>0%</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>Calcium 10mg</span>
                  <span>0%</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>Iron 1mg</span>
                  <span>6%</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>Potassium 50mg</span>
                  <span>0%</span>
                </div>
              </div>

              {/* Footnote */}
              <div className="mt-2 pt-2 border-t border-black text-[9px] text-gray-600">
                * The % Daily Value tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.
              </div>

              {/* Ingredients (if enabled) */}
              {elements.find(e => e.id === 'ingredients')?.enabled && (
                <div className="mt-4 pt-3 border-t-2 border-black">
                  <div className="font-bold mb-1">INGREDIENTS:</div>
                  <div
                    className="text-xs"
                    dangerouslySetInnerHTML={{ __html: renderIngredientList() }}
                  />
                </div>
              )}

              {/* Allergens */}
              {allergens.some(a => a.status !== 'free_from') && (
                <div className="mt-2 text-xs">
                  <strong>ALLERGEN INFORMATION:</strong> {renderAllergenStatement()}
                </div>
              )}

              {/* Storage (if enabled) */}
              {elements.find(e => e.id === 'storage')?.enabled && storageText && (
                <div className="mt-2 text-xs">
                  <strong>STORAGE:</strong> {storageText}
                </div>
              )}

              {/* Dietary Badges */}
              {activeBadges.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-300 flex gap-2 flex-wrap">
                  {activeBadges.map(badgeId => {
                    const badge = DIETARY_BADGES.find(b => b.id === badgeId);
                    return badge ? (
                      <span key={badgeId} className="inline-flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded">
                        {badge.icon} {badge.name}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Element Editor */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Settings size={16} />
              Element Settings
            </h3>
          </div>

          {/* Context-aware editor based on selected element */}
          {selectedElementId === 'ingredients' ? (
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Ingredient List</h4>
              <p className="text-xs text-gray-500 mb-4">Drag to reorder. Bold items are allergens.</p>

              <div className="space-y-2">
                {ingredients.map((ing, index) => (
                  <div
                    key={ing.id}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg group"
                  >
                    <GripVertical size={14} className="text-gray-300 cursor-grab" />
                    <input
                      type="text"
                      value={ing.name}
                      onChange={(e) => {
                        const newIngredients = [...ingredients];
                        newIngredients[index].name = e.target.value;
                        setIngredients(newIngredients);
                      }}
                      className={`flex-1 text-sm bg-transparent outline-none ${ing.isAllergen ? 'font-bold' : ''}`}
                    />
                    <input
                      type="number"
                      value={ing.percentage || ''}
                      onChange={(e) => {
                        const newIngredients = [...ingredients];
                        newIngredients[index].percentage = e.target.value ? parseInt(e.target.value) : undefined;
                        setIngredients(newIngredients);
                      }}
                      placeholder="%"
                      className="w-12 text-xs text-center border border-gray-200 rounded px-1 py-0.5"
                    />
                    <button
                      onClick={() => setIngredients(prev => prev.filter(i => i.id !== ing.id))}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <button className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-emerald-400 hover:text-emerald-600">
                <Plus size={16} />
                Add Ingredient
              </button>
            </div>
          ) : selectedElementId === 'storage' ? (
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Storage Instructions</h4>
              <textarea
                value={storageText}
                onChange={(e) => setStorageText(e.target.value)}
                placeholder="Enter storage instructions..."
                className="w-full h-24 px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
          ) : (
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Product Information</h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Legal Name</label>
                  <input
                    type="text"
                    value={productIdentity.legalName}
                    onChange={(e) => setProductIdentity(prev => ({ ...prev, legalName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={productIdentity.brandName}
                    onChange={(e) => setProductIdentity(prev => ({ ...prev, brandName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Net Weight</label>
                    <input
                      type="text"
                      value={productIdentity.netWeight}
                      onChange={(e) => setProductIdentity(prev => ({ ...prev, netWeight: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div className="w-20">
                    <label className="block text-xs text-gray-500 mb-1">Unit</label>
                    <select
                      value={productIdentity.netWeightUnit}
                      onChange={(e) => setProductIdentity(prev => ({ ...prev, netWeightUnit: e.target.value }))}
                      className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="l">l</option>
                      <option value="oz">oz</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Best Before</label>
                  <input
                    type="date"
                    value={productIdentity.bestBefore}
                    onChange={(e) => setProductIdentity(prev => ({ ...prev, bestBefore: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Batch Code</label>
                  <input
                    type="text"
                    value={productIdentity.batchCode}
                    onChange={(e) => setProductIdentity(prev => ({ ...prev, batchCode: e.target.value }))}
                    placeholder="e.g., LOT-2024-001"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Export Label</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['PDF', 'PNG', 'SVG'].map((format) => (
                      <button
                        key={format}
                        className="px-4 py-3 border-2 border-gray-200 rounded-lg text-sm font-medium hover:border-emerald-500 focus:border-emerald-500 focus:bg-emerald-50"
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Resolution</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                    <option>72 DPI (Screen)</option>
                    <option>150 DPI (Draft Print)</option>
                    <option>300 DPI (Print Quality)</option>
                    <option>600 DPI (High Quality)</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

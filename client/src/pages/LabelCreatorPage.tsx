import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { templatesApi } from '../services/api';
import type { Template } from '../types';
import NutricalLogo from '../assets/nutrical-logo.svg';
import {
  ArrowLeft,
  Download,
  Eye,
  ZoomIn,
  ZoomOut,
  Settings,
  ChevronDown,
  ChevronUp,
  Check,
  List,
  AlertTriangle,
  Thermometer,
  QrCode,
  Barcode,
  MapPin,
  FileText,
  Building,
  Percent,
  Minus,
  Plus,
  X,
  Image,
  Award,
  Printer,
  Upload,
  Square,
  Circle,
  Bold,
  Italic,
  Underline,
  ImagePlus,
  Type,
  Palette,
  Move,
  Layout,
  Shield,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Lightbulb,
  Clock,
  History,
  Languages,
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
  isCompound?: boolean;
  subIngredients?: { id: string; name: string; isAllergen: boolean }[];
}

interface Allergen {
  id: string;
  name: string;
  status: 'contains' | 'may_contain' | 'free_from';
  highlight: boolean;
}

interface ShapeItem {
  id: string;
  type: 'square' | 'rectangle' | 'circle' | 'oval';
  text: string;
  width: number;
  height: number;
  bgColor: string;
  textColor: string;
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  x: number;
  y: number;
}

interface PositionedImage {
  id: string;
  url: string;
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const INITIAL_ELEMENTS: LabelElement[] = [
  { id: 'productSettings', name: 'Product Settings', icon: Settings, enabled: true, required: true },
  { id: 'logo', name: 'Company Logo', icon: Image, enabled: false },
  { id: 'imageUpload', name: 'Image Upload', icon: ImagePlus, enabled: false },
  { id: 'textStyling', name: 'Text Styling', icon: Type, enabled: false },
  { id: 'nutritionFacts', name: 'Nutrition Facts', icon: FileText, enabled: true },
  { id: 'ingredients', name: 'Ingredient List', icon: List, enabled: false },
  { id: 'allergens', name: 'Allergens', icon: AlertTriangle, enabled: false },
  { id: 'statements', name: 'Mandatory Statements', icon: FileText, enabled: false },
  { id: 'healthClaims', name: 'Health Claims', icon: Shield, enabled: false },
  { id: 'certifications', name: 'Certifications', icon: Award, enabled: false },
  { id: 'shapes', name: 'Shapes', icon: Square, enabled: false },
  { id: 'customFields', name: 'Custom Fields', icon: FileText, enabled: false },
  { id: 'alcohol', name: 'Content Warnings', icon: AlertCircle, enabled: false },
  { id: 'qrCode', name: 'QR Code', icon: QrCode, enabled: false },
  { id: 'nameAddress', name: 'Name & Address', icon: Building, enabled: false },
  { id: 'barcode', name: 'Barcode', icon: Barcode, enabled: false },
  { id: 'origin', name: 'Origin', icon: MapPin, enabled: false },
  { id: 'instructions', name: 'Instructions', icon: FileText, enabled: false },
  { id: 'traceability', name: 'Traceability', icon: FileText, enabled: false },
  { id: 'storage', name: 'Storage', icon: Thermometer, enabled: false },
  { id: 'dividerLine', name: 'Divider Line', icon: Minus, enabled: false },
  { id: 'nutriMark', name: 'NutriMark', icon: Award, enabled: false },
];

const CERTIFICATION_OPTIONS = [
  { id: 'organic', name: 'Organic', icon: '🌿' },
  { id: 'nonGmo', name: 'Non-GMO', icon: '🚫' },
  { id: 'fairTrade', name: 'Fair Trade', icon: '🤝' },
  { id: 'rainforest', name: 'Rainforest Alliance', icon: '🌳' },
  { id: 'glutenFree', name: 'Gluten Free Certified', icon: '🌾' },
  { id: 'bCorp', name: 'B Corp', icon: '🅱️' },
];

const MOCK_INGREDIENTS: Ingredient[] = [
  { id: '1', name: 'Wheat Flour', percentage: 45, isAllergen: true, allergenType: 'Wheat' },
  { id: '2', name: 'Sugar', percentage: 20, isAllergen: false },
  { id: '3', name: 'Butter', percentage: 15, isAllergen: true, allergenType: 'Milk' },
  {
    id: '4',
    name: 'Chocolate Chips',
    percentage: 12,
    isAllergen: true,
    allergenType: 'Soy',
    isCompound: true,
    subIngredients: [
      { id: '4a', name: 'Sugar', isAllergen: false },
      { id: '4b', name: 'Cocoa butter', isAllergen: false },
      { id: '4c', name: 'Soy lecithin', isAllergen: true },
    ]
  },
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
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');

  // Preset template state
  const [presetTemplate, setPresetTemplate] = useState<Template | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);

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
    // Extended date fields
    manufactureDate: '',
    packingDate: '',
  });

  // Product name font controls
  const [productNameFont, setProductNameFont] = useState({
    fontFamily: 'Arial',
    fontSize: 18,
    bold: true,
    italic: false,
  });

  // Product form descriptors
  const PRODUCT_FORMS = ['', 'Fresh', 'Frozen', 'Concentrate', 'Dried', 'Powdered', 'Canned', 'Preserved'];

  // Storage & handling with icons
  const [storageInstructions, setStorageInstructions] = useState({
    text: 'Store in a cool, dry place.',
    temperature: '',
    humidity: '',
    icon: 'thermometer',
  });

  // Instructions for use/preparation
  const [preparationInstructions, setPreparationInstructions] = useState({
    steps: [''],
    cookingTemp: '',
    cookingTime: '',
  });

  // Additional element states
  const [alcoholPercent, setAlcoholPercent] = useState('');
  const [caffeineContent, setCaffeineContent] = useState(''); // mg per serving
  const [highSodiumWarning, setHighSodiumWarning] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrCodeSize, setQrCodeSize] = useState('medium');
  const [manufacturer, setManufacturer] = useState({
    companyName: '',
    address: '',
    contact: '',
  });
  const [barcodeData, setBarcodeData] = useState({
    type: 'EAN-13',
    number: '',
    showNumbers: true,
  });
  const [origin, setOrigin] = useState({
    country: 'United States',
    format: 'Made in [Country]',
  });
  const [traceability, setTraceability] = useState({
    productionDate: '',
  });

  // Allergen display options
  const [allergenPlacement, setAllergenPlacement] = useState<'within' | 'separate' | 'both'>('separate');
  const [precautionaryStatement, setPrecautionaryStatement] = useState('May contain traces of tree nuts and peanuts.');

  // Product styling options
  const [productFontSize, setProductFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [productForm, setProductForm] = useState('');

  // Mandatory statements
  const [mandatoryStatements, setMandatoryStatements] = useState<string[]>(['Keep refrigerated']);

  // Health & Nutrition Claims (Mock data for backend reference)
  const [healthClaims, setHealthClaims] = useState<{
    id: string;
    claim: string;
    type: 'health' | 'nutrition' | 'functional';
    region: string;
    approved: boolean;
  }[]>([
    { id: '1', claim: 'High in Fiber', type: 'nutrition', region: 'FDA', approved: true },
    { id: '2', claim: 'Good Source of Protein', type: 'nutrition', region: 'FDA', approved: true },
    { id: '3', claim: 'May reduce risk of heart disease', type: 'health', region: 'FDA', approved: false },
  ]);

  // NutriMark state (Nutri-Score style rating)
  const [nutriMark, setNutriMark] = useState<{
    score: 'A' | 'B' | 'C' | 'D' | 'E';
    type: 'nutri-score' | 'traffic-light' | 'star-rating' | 'custom';
    showOnLabel: boolean;
  }>({
    score: 'B',
    type: 'nutri-score',
    showOnLabel: true,
  });

  // Logo state
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState<'small' | 'medium' | 'large'>('medium');
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Certifications state
  const [activeCertifications, setActiveCertifications] = useState<string[]>([]);

  // Use By date (separate from Best Before)
  const [useByDate, setUseByDate] = useState('');

  // Editable Nutrition Facts
  const [nutritionData, setNutritionData] = useState({
    servingsPerContainer: '8',
    servingSize: '1 cookie (38g)',
    calories: '180',
    totalFat: '9',
    saturatedFat: '5',
    transFat: '0',
    cholesterol: '20',
    sodium: '100',
    totalCarbs: '24',
    dietaryFiber: '1',
    totalSugars: '12',
    addedSugars: '10',
    protein: '2',
  });

  // Custom fields
  const [customFields, setCustomFields] = useState<{ id: string; label: string; value: string }[]>([]);

  // Shapes state
  const [shapes, setShapes] = useState<ShapeItem[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

  // Divider line state
  const [dividerStyle, setDividerStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');
  const [dividerThickness, setDividerThickness] = useState<'thin' | 'medium' | 'thick'>('medium');

  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<PositionedImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Logo position state
  const [logoPosition, setLogoPosition] = useState({ x: 0, y: 0 });

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<{ type: 'logo' | 'image' | 'shape'; id?: string } | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const labelPreviewRef = useRef<HTMLDivElement>(null);

  // Global text styling state
  const [globalTextStyle, setGlobalTextStyle] = useState({
    fontFamily: 'Arial',
    fontSize: 12,
    color: '#000000',
    bold: false,
    italic: false,
    underline: false,
  });

  // Fetch and apply preset template when templateId is present
  useEffect(() => {
    const fetchTemplate = async () => {
      if (!templateId) return;

      try {
        setTemplateLoading(true);
        const template = await templatesApi.get(templateId);
        setPresetTemplate(template);

        // Apply template settings to label
        if (template.name) {
          setLabelName(template.name);
        }

        // Apply global styles from template
        if (template.styles) {
          setGlobalTextStyle(prev => ({
            ...prev,
            fontFamily: template.styles.fontFamily || prev.fontFamily,
            fontSize: template.styles.fontSize || prev.fontSize,
          }));
        }

        // Apply template type to determine elements to enable
        // The template has elements array that specifies which elements are active
        if (template.elements && template.elements.length > 0) {
          const templateElementTypes = template.elements.map(el => el.type);
          setElements(prev =>
            prev.map(el => {
              // Map template element types to our element IDs
              const typeToId: Record<string, string> = {
                'nutrition-box': 'nutritionFacts',
                'ingredients-list': 'ingredients',
                'allergens': 'allergens',
                'business-info': 'nameAddress',
                'logo': 'logo',
                'line': 'dividerLine',
              };

              const matchingTypes = Object.entries(typeToId)
                .filter(([templateType]) => templateElementTypes.includes(templateType as any))
                .map(([, elementId]) => elementId);

              return {
                ...el,
                enabled: matchingTypes.includes(el.id) || el.id === 'nutritionFacts', // Always enable nutrition facts
              };
            })
          );
        }

        // Apply nutrition config if present
        if (template.nutrition_config) {
          // Could update nutritionData based on template.nutrition_config
          // For now, this enables the right elements
        }

        // Apply display preferences
        if (template.display_preferences) {
          // Enable/disable elements based on display preferences
          setElements(prev =>
            prev.map(el => {
              if (el.id === 'ingredients' && !template.display_preferences.hideIngredients) {
                return { ...el, enabled: true };
              }
              if (el.id === 'allergens' && !template.display_preferences.hideAllergens) {
                return { ...el, enabled: true };
              }
              if (el.id === 'nameAddress' && !template.display_preferences.hideBusinessDetails) {
                return { ...el, enabled: true };
              }
              return el;
            })
          );
        }

      } catch (error) {
        console.error('Failed to fetch template:', error);
      } finally {
        setTemplateLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId]);

  // Toggle element checkbox
  const toggleElement = (id: string) => {
    setElements(prev =>
      prev.map(el => (el.id === id ? { ...el, enabled: !el.enabled } : el))
    );
    setSelectedElementId(id);
  };

  // Select element and auto-enable it
  const selectAndEnableElement = (id: string) => {
    setSelectedElementId(id);
    // Auto-enable the element when selected
    setElements(prev =>
      prev.map(el => (el.id === id ? { ...el, enabled: true } : el))
    );
  };

  // Toggle dietary badge
  const toggleBadge = (id: string) => {
    setActiveBadges(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  // Move ingredient up in list
  const moveIngredientUp = (index: number) => {
    if (index === 0) return;
    const newIngredients = [...ingredients];
    [newIngredients[index - 1], newIngredients[index]] = [newIngredients[index], newIngredients[index - 1]];
    setIngredients(newIngredients);
  };

  // Move ingredient down in list
  const moveIngredientDown = (index: number) => {
    if (index === ingredients.length - 1) return;
    const newIngredients = [...ingredients];
    [newIngredients[index], newIngredients[index + 1]] = [newIngredients[index + 1], newIngredients[index]];
    setIngredients(newIngredients);
  };

  // Sort ingredients by weight (descending) - required by regulations
  const sortIngredientsByWeight = () => {
    const sorted = [...ingredients].sort((a, b) => {
      const weightA = a.percentage ?? 0;
      const weightB = b.percentage ?? 0;
      return weightB - weightA; // Descending order
    });
    setIngredients(sorted);
  };

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle certification
  const toggleCertification = (id: string) => {
    setActiveCertifications(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  // Print preview handler
  const handlePrintPreview = () => {
    window.print();
  };

  // Add new shape
  const addShape = (type: 'square' | 'rectangle' | 'circle' | 'oval') => {
    const newShape: ShapeItem = {
      id: `shape_${Date.now()}`,
      type,
      text: 'Text',
      width: type === 'square' || type === 'circle' ? 60 : 100,
      height: type === 'square' || type === 'circle' ? 60 : 40,
      bgColor: '#10b981',
      textColor: '#ffffff',
      fontFamily: 'Arial',
      fontSize: 12,
      bold: false,
      italic: false,
      underline: false,
      x: 10,
      y: 10,
    };
    setShapes(prev => [...prev, newShape]);
    setSelectedShapeId(newShape.id);
  };

  // Update shape
  const updateShape = (id: string, updates: Partial<ShapeItem>) => {
    setShapes(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  // Delete shape
  const deleteShape = (id: string) => {
    setShapes(prev => prev.filter(s => s.id !== id));
    setSelectedShapeId(null);
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImage: PositionedImage = {
          id: `img_${Date.now()}`,
          url: reader.result as string,
          name: file.name,
          width: 100,
          height: 100,
          x: 10,
          y: 10,
        };
        setUploadedImages(prev => [...prev, newImage]);
        setSelectedImageId(newImage.id);
      };
      reader.readAsDataURL(file);
    }
  };

  // Update image
  const updateImage = (id: string, updates: Partial<PositionedImage>) => {
    setUploadedImages(prev => prev.map(img => img.id === id ? { ...img, ...updates } : img));
  };

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent, target: { type: 'logo' | 'image' | 'shape'; id?: string }) => {
    e.preventDefault();
    setIsDragging(true);
    setDragTarget(target);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Handle drag move
  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragTarget) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    if (dragTarget.type === 'logo') {
      setLogoPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    } else if (dragTarget.type === 'image' && dragTarget.id) {
      updateImage(dragTarget.id, {
        x: (uploadedImages.find(i => i.id === dragTarget.id)?.x || 0) + dx,
        y: (uploadedImages.find(i => i.id === dragTarget.id)?.y || 0) + dy,
      });
    } else if (dragTarget.type === 'shape' && dragTarget.id) {
      updateShape(dragTarget.id, {
        x: (shapes.find(s => s.id === dragTarget.id)?.x || 0) + dx,
        y: (shapes.find(s => s.id === dragTarget.id)?.y || 0) + dy,
      });
    }

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
    setDragTarget(null);
  };

  // Delete image
  const deleteImage = (id: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
    setSelectedImageId(null);
  };

  // Get enabled elements for preview
  const enabledElements = elements.filter(el => el.enabled);

  // Render ingredient list with allergen highlighting and compound ingredients
  const renderIngredientList = () => {
    return ingredients
      .map(ing => {
        // Base text with optional QUID percentage
        let text = ing.percentage ? `${ing.name} (${ing.percentage}%)` : ing.name;

        // Handle compound ingredients with sub-ingredients in parentheses
        if (ing.isCompound && ing.subIngredients && ing.subIngredients.length > 0) {
          const subList = ing.subIngredients
            .map(sub => sub.isAllergen ? `<strong>${sub.name}</strong>` : sub.name)
            .join(', ');
          text = ing.percentage
            ? `${ing.name} (${ing.percentage}%) [${subList}]`
            : `${ing.name} [${subList}]`;
        }

        // Bold if main ingredient is allergen
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
          <img src={NutricalLogo} alt="NutriCal" className="h-8" />
          <div className="h-6 w-px bg-gray-300" />
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={labelName}
              onChange={(e) => setLabelName(e.target.value)}
              className="text-lg font-semibold bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-[#e9b03d] outline-none px-1"
            />
            {presetTemplate && (
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-medium">
                Based on: {presetTemplate.name}
              </span>
            )}
            {templateLoading && (
              <span className="text-xs text-gray-400">Loading template...</span>
            )}
          </div>
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

          {/* Print Preview */}
          <button
            onClick={handlePrintPreview}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Printer size={16} />
            Print
          </button>

          {/* Export */}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#000055] text-white rounded-lg hover:bg-[#000044] text-sm"
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
                    ? 'bg-[#e9b03d]/10 border border-[#e9b03d]/30'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => selectAndEnableElement(element.id)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleElement(element.id);
                  }}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    element.enabled
                      ? 'bg-[#000055] border-[#000055]'
                      : 'border-gray-300 hover:border-[#e9b03d]'
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
                      ? 'bg-[#e9b03d]/20 text-[#000055] border border-[#e9b03d]/30'
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
            <div
              ref={labelPreviewRef}
              className="w-[350px] min-h-[500px] border-2 border-black p-4 font-sans text-sm print:border-0 print:shadow-none relative"
              style={elements.find(e => e.id === 'textStyling')?.enabled ? {
                fontFamily: globalTextStyle.fontFamily,
                fontSize: globalTextStyle.fontSize,
                color: globalTextStyle.color,
                fontWeight: globalTextStyle.bold ? 'bold' : 'normal',
                fontStyle: globalTextStyle.italic ? 'italic' : 'normal',
                textDecoration: globalTextStyle.underline ? 'underline' : 'none',
              } : {}}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
            >
              {/* Draggable Logo (if enabled) */}
              {elements.find(e => e.id === 'logo')?.enabled && logoUrl && (
                <div
                  className={`absolute cursor-move select-none ${isDragging && dragTarget?.type === 'logo' ? 'ring-2 ring-[#e9b03d]' : 'hover:ring-2 hover:ring-[#e9b03d]/50'}`}
                  style={{
                    left: logoPosition.x,
                    top: logoPosition.y,
                  }}
                  onMouseDown={(e) => handleDragStart(e, { type: 'logo' })}
                >
                  <img
                    src={logoUrl}
                    alt="Company Logo"
                    className={`object-contain pointer-events-none ${logoSize === 'small' ? 'h-8' : logoSize === 'large' ? 'h-16' : 'h-12'}`}
                  />
                  <div className="absolute -top-1 -right-1 bg-[#e9b03d]/100 rounded-full p-0.5 opacity-50 hover:opacity-100">
                    <Move size={10} className="text-white" />
                  </div>
                </div>
              )}

              {/* Draggable Uploaded Images */}
              {elements.find(e => e.id === 'imageUpload')?.enabled && uploadedImages.map(img => (
                <div
                  key={img.id}
                  className={`absolute cursor-move select-none ${
                    selectedImageId === img.id ? 'ring-2 ring-[#e9b03d]' : 'hover:ring-2 hover:ring-[#e9b03d]/50'
                  }`}
                  style={{
                    left: img.x,
                    top: img.y,
                    width: img.width,
                    height: img.height,
                  }}
                  onMouseDown={(e) => {
                    setSelectedImageId(img.id);
                    handleDragStart(e, { type: 'image', id: img.id });
                  }}
                >
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-full h-full object-contain pointer-events-none"
                  />
                  <div className="absolute -top-1 -right-1 bg-[#e9b03d]/100 rounded-full p-0.5 opacity-50 hover:opacity-100">
                    <Move size={10} className="text-white" />
                  </div>
                </div>
              ))}

              {/* Draggable Shapes */}
              {elements.find(e => e.id === 'shapes')?.enabled && shapes.map(shape => (
                <div
                  key={shape.id}
                  className={`absolute cursor-move select-none flex items-center justify-center ${
                    selectedShapeId === shape.id ? 'ring-2 ring-[#e9b03d]' : 'hover:ring-2 hover:ring-[#e9b03d]/50'
                  }`}
                  style={{
                    left: shape.x,
                    top: shape.y,
                    width: shape.width,
                    height: shape.height,
                    backgroundColor: shape.bgColor,
                    color: shape.textColor,
                    fontFamily: shape.fontFamily,
                    fontSize: shape.fontSize,
                    fontWeight: shape.bold ? 'bold' : 'normal',
                    fontStyle: shape.italic ? 'italic' : 'normal',
                    textDecoration: shape.underline ? 'underline' : 'none',
                    borderRadius: shape.type === 'circle' ? '50%' : shape.type === 'oval' ? '50%' : '4px',
                  }}
                  onMouseDown={(e) => {
                    setSelectedShapeId(shape.id);
                    handleDragStart(e, { type: 'shape', id: shape.id });
                  }}
                >
                  {shape.text}
                  <div className="absolute -top-1 -right-1 bg-[#e9b03d]/100 rounded-full p-0.5 opacity-50 hover:opacity-100">
                    <Move size={10} className="text-white" />
                  </div>
                </div>
              ))}

              {/* Product Name & Brand */}
              <div className="mb-3 pb-2 border-b border-gray-300">
                <div className={`font-bold ${productFontSize === 'small' ? 'text-base' : productFontSize === 'large' ? 'text-2xl' : 'text-lg'}`}>
                  {productIdentity.legalName}
                  {productForm && <span className="font-normal text-gray-500 ml-2">({productForm})</span>}
                </div>
                {productIdentity.brandName && (
                  <div className="text-sm text-gray-600">{productIdentity.brandName}</div>
                )}
                <div className="text-xs mt-1">
                  Net Wt. {productIdentity.netWeight}{productIdentity.netWeightUnit}
                </div>
              </div>

              {/* NutriMark (if enabled) - positioned prominently after product name */}
              {elements.find(e => e.id === 'nutriMark')?.enabled && nutriMark.showOnLabel && (
                <div className="mb-3 pb-2 border-b border-gray-300">
                  {nutriMark.type === 'nutri-score' && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium mr-1">Nutri-Score</span>
                      {['A', 'B', 'C', 'D', 'E'].map(grade => (
                        <div
                          key={grade}
                          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                            nutriMark.score === grade ? 'scale-125 ring-2 ring-gray-800' : 'opacity-60'
                          } ${
                            grade === 'A' ? 'bg-green-600 text-white' :
                            grade === 'B' ? 'bg-lime-500 text-white' :
                            grade === 'C' ? 'bg-yellow-400 text-gray-800' :
                            grade === 'D' ? 'bg-orange-500 text-white' :
                            'bg-red-600 text-white'
                          }`}
                        >
                          {grade}
                        </div>
                      ))}
                    </div>
                  )}
                  {nutriMark.type === 'traffic-light' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">Health Rating:</span>
                      <div className={`w-5 h-5 rounded-full ${
                        nutriMark.score === 'A' || nutriMark.score === 'B' ? 'bg-green-500' :
                        nutriMark.score === 'C' ? 'bg-yellow-400' :
                        'bg-red-500'
                      }`} />
                    </div>
                  )}
                  {nutriMark.type === 'star-rating' && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium mr-1">Health:</span>
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} className={`text-lg ${
                          star <= (nutriMark.score === 'A' ? 5 : nutriMark.score === 'B' ? 4 : nutriMark.score === 'C' ? 3 : nutriMark.score === 'D' ? 2 : 1)
                            ? 'text-yellow-500' : 'text-gray-300'
                        }`}>★</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Nutrition Facts (if enabled) */}
              {elements.find(e => e.id === 'nutritionFacts')?.enabled && (
                <>
                  {/* Header */}
                  <div className="text-center border-b-8 border-black pb-2 mb-2">
                    <h1 className="text-2xl font-black">Nutrition Facts</h1>
                  </div>

                  {/* Serving Info */}
                  <div className="border-b border-black pb-1 mb-1 text-sm">
                    <div className="flex justify-between">
                      <span>{nutritionData.servingsPerContainer} servings per container</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Serving size</span>
                      <span>{nutritionData.servingSize}</span>
                    </div>
                  </div>

                  {/* Calories */}
                  <div className="border-b-8 border-black py-2">
                    <div className="text-xs">Amount per serving</div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-3xl font-black">Calories</span>
                      <span className="text-4xl font-black">{nutritionData.calories}</span>
                    </div>
                  </div>

                  {/* % Daily Value Header */}
                  <div className="text-right text-xs font-bold border-b border-black py-1">
                    % Daily Value*
                  </div>

                  {/* Nutrients */}
                  <div className="text-xs space-y-0.5">
                    <div className="flex justify-between border-b border-gray-300 py-0.5">
                      <span><strong>Total Fat</strong> {nutritionData.totalFat}g</span>
                      <span className="font-bold">{Math.round((parseFloat(nutritionData.totalFat) || 0) / 78 * 100)}%</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-300 py-0.5 pl-4">
                      <span>Saturated Fat {nutritionData.saturatedFat}g</span>
                      <span className="font-bold">{Math.round((parseFloat(nutritionData.saturatedFat) || 0) / 20 * 100)}%</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-300 py-0.5 pl-4">
                      <span><em>Trans</em> Fat {nutritionData.transFat}g</span>
                      <span></span>
                    </div>
                    <div className="flex justify-between border-b border-gray-300 py-0.5">
                      <span><strong>Cholesterol</strong> {nutritionData.cholesterol}mg</span>
                      <span className="font-bold">{Math.round((parseFloat(nutritionData.cholesterol) || 0) / 300 * 100)}%</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-300 py-0.5">
                      <span><strong>Sodium</strong> {nutritionData.sodium}mg</span>
                      <span className="font-bold">{Math.round((parseFloat(nutritionData.sodium) || 0) / 2300 * 100)}%</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-300 py-0.5">
                      <span><strong>Total Carbohydrate</strong> {nutritionData.totalCarbs}g</span>
                      <span className="font-bold">{Math.round((parseFloat(nutritionData.totalCarbs) || 0) / 275 * 100)}%</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-300 py-0.5 pl-4">
                      <span>Dietary Fiber {nutritionData.dietaryFiber}g</span>
                      <span className="font-bold">{Math.round((parseFloat(nutritionData.dietaryFiber) || 0) / 28 * 100)}%</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-300 py-0.5 pl-4">
                      <span>Total Sugars {nutritionData.totalSugars}g</span>
                      <span></span>
                    </div>
                    <div className="flex justify-between border-b border-black py-0.5 pl-8">
                      <span>Includes {nutritionData.addedSugars}g Added Sugars</span>
                      <span className="font-bold">{Math.round((parseFloat(nutritionData.addedSugars) || 0) / 50 * 100)}%</span>
                    </div>
                    <div className="flex justify-between border-b-8 border-black py-0.5">
                      <span><strong>Protein</strong> {nutritionData.protein}g</span>
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
                </>
              )}

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

              {/* Allergens (if enabled) */}
              {elements.find(e => e.id === 'allergens')?.enabled && allergens.some(a => a.status !== 'free_from') && (
                <div className="mt-2 text-xs">
                  <strong>ALLERGEN INFORMATION:</strong> {renderAllergenStatement()}
                  {precautionaryStatement && (
                    <div className="mt-1 italic">{precautionaryStatement}</div>
                  )}
                </div>
              )}

              {/* Mandatory Statements (if enabled) */}
              {elements.find(e => e.id === 'statements')?.enabled && mandatoryStatements.length > 0 && (
                <div className="mt-2 text-xs">
                  {mandatoryStatements.filter(s => s.trim()).map((stmt, idx) => (
                    <div key={idx} className="font-medium">{stmt}</div>
                  ))}
                </div>
              )}

              {/* Storage (if enabled) */}
              {elements.find(e => e.id === 'storage')?.enabled && (storageInstructions.text || storageInstructions.temperature) && (
                <div className="mt-2 text-xs">
                  <strong>STORAGE:</strong> {storageInstructions.text}
                  {storageInstructions.temperature && (
                    <span className="ml-1">({storageInstructions.temperature})</span>
                  )}
                  {storageInstructions.humidity && (
                    <span className="ml-1">RH: {storageInstructions.humidity}</span>
                  )}
                </div>
              )}

              {/* Instructions (if enabled) */}
              {elements.find(e => e.id === 'instructions')?.enabled && (
                preparationInstructions.steps.some(s => s.trim()) || instructionsText || preparationInstructions.cookingTemp
              ) && (
                <div className="mt-2 text-xs">
                  <strong>INSTRUCTIONS:</strong>
                  {preparationInstructions.steps.filter(s => s.trim()).length > 0 && (
                    <span> {preparationInstructions.steps.filter(s => s.trim()).join('. ')}.</span>
                  )}
                  {preparationInstructions.cookingTemp && (
                    <span> Temp: {preparationInstructions.cookingTemp}.</span>
                  )}
                  {preparationInstructions.cookingTime && (
                    <span> Time: {preparationInstructions.cookingTime}.</span>
                  )}
                  {instructionsText && <span> {instructionsText}</span>}
                </div>
              )}

              {/* Origin (if enabled) */}
              {elements.find(e => e.id === 'origin')?.enabled && (
                <div className="mt-2 text-xs">
                  <strong>{origin.format.replace('[Country]', origin.country)}</strong>
                </div>
              )}

              {/* Content Warnings (if enabled) */}
              {elements.find(e => e.id === 'alcohol')?.enabled && (alcoholPercent || caffeineContent || highSodiumWarning) && (
                <div className="mt-2 text-xs space-y-1">
                  {alcoholPercent && (
                    <div><strong>ALCOHOL:</strong> {alcoholPercent}% vol</div>
                  )}
                  {caffeineContent && (
                    <div><strong>CAFFEINE:</strong> {caffeineContent}mg per serving</div>
                  )}
                  {highSodiumWarning && (
                    <div className="text-red-600 font-medium">⚠️ HIGH SODIUM - See nutrition information</div>
                  )}
                </div>
              )}

              {/* Health Claims (if enabled) */}
              {elements.find(e => e.id === 'healthClaims')?.enabled && healthClaims.some(c => c.approved) && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                  <div className="font-bold text-green-800 mb-1">✓ Health Claims</div>
                  {healthClaims.filter(c => c.approved).map(claim => (
                    <div key={claim.id} className="text-green-700">
                      • {claim.claim}
                      <span className="text-green-500 text-[10px] ml-1">({claim.region})</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Traceability (if enabled) */}
              {elements.find(e => e.id === 'traceability')?.enabled && productIdentity.batchCode && (
                <div className="mt-2 text-xs">
                  <strong>LOT:</strong> {productIdentity.batchCode}
                  {traceability.productionDate && ` | Produced: ${traceability.productionDate}`}
                </div>
              )}

              {/* Name & Address (if enabled) */}
              {elements.find(e => e.id === 'nameAddress')?.enabled && manufacturer.companyName && (
                <div className="mt-3 pt-2 border-t border-gray-300 text-xs">
                  <div className="font-bold">{manufacturer.companyName}</div>
                  {manufacturer.address && <div className="whitespace-pre-line">{manufacturer.address}</div>}
                  {manufacturer.contact && <div>{manufacturer.contact}</div>}
                </div>
              )}

              {/* Barcode (if enabled) */}
              {elements.find(e => e.id === 'barcode')?.enabled && (
                <div className="mt-3 pt-2 border-t border-gray-300 flex flex-col items-center">
                  <div className="w-32 h-12 bg-gradient-to-b from-black via-black to-black bg-[length:2px_100%] bg-repeat-x flex items-end justify-center">
                    <div className="w-full h-10 flex">
                      {[...Array(30)].map((_, i) => (
                        <div key={i} className={`flex-1 ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`} />
                      ))}
                    </div>
                  </div>
                  {barcodeData.showNumbers && (
                    <div className="text-[8px] mt-0.5 font-mono">{barcodeData.number || '0000000000000'}</div>
                  )}
                </div>
              )}

              {/* QR Code (if enabled) */}
              {elements.find(e => e.id === 'qrCode')?.enabled && (
                <div className="mt-3 pt-2 border-t border-gray-300 flex justify-center">
                  <div className={`bg-gray-800 ${qrCodeSize === 'small' ? 'w-12 h-12' : qrCodeSize === 'large' ? 'w-20 h-20' : 'w-16 h-16'} grid grid-cols-5 grid-rows-5 gap-0.5 p-1`}>
                    {[...Array(25)].map((_, i) => (
                      <div key={i} className={`${Math.random() > 0.4 ? 'bg-white' : 'bg-gray-800'}`} />
                    ))}
                  </div>
                </div>
              )}

              {/* Divider Line (if enabled) */}
              {elements.find(e => e.id === 'dividerLine')?.enabled && (
                <div
                  className={`mt-3 border-black ${
                    dividerStyle === 'dashed' ? 'border-dashed' : dividerStyle === 'dotted' ? 'border-dotted' : 'border-solid'
                  } ${
                    dividerThickness === 'thin' ? 'border-t' : dividerThickness === 'thick' ? 'border-t-4' : 'border-t-2'
                  }`}
                />
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

              {/* Custom Fields (if enabled) */}
              {elements.find(e => e.id === 'customFields')?.enabled && customFields.length > 0 && (
                <div className="mt-2 text-xs space-y-1">
                  {customFields.filter(f => f.label && f.value).map((field) => (
                    <div key={field.id}>
                      <strong>{field.label}:</strong> {field.value}
                    </div>
                  ))}
                </div>
              )}

              {/* Certifications (if enabled) */}
              {elements.find(e => e.id === 'certifications')?.enabled && activeCertifications.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-300 flex gap-2 flex-wrap">
                  {activeCertifications.map(certId => {
                    const cert = CERTIFICATION_OPTIONS.find(c => c.id === certId);
                    return cert ? (
                      <span key={certId} className="inline-flex items-center gap-1 text-xs bg-green-50 border border-green-200 px-2 py-1 rounded">
                        {cert.icon} {cert.name}
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              {/* Dates & Batch Code */}
              {(productIdentity.manufactureDate || productIdentity.packingDate || productIdentity.bestBefore || useByDate || productIdentity.batchCode) && (
                <div className="mt-3 pt-2 border-t border-gray-300 text-xs space-y-1">
                  {productIdentity.manufactureDate && (
                    <div><strong>Mfg Date:</strong> {productIdentity.manufactureDate}</div>
                  )}
                  {productIdentity.packingDate && (
                    <div><strong>Pkg Date:</strong> {productIdentity.packingDate}</div>
                  )}
                  {productIdentity.bestBefore && (
                    <div><strong>Best Before:</strong> {productIdentity.bestBefore}</div>
                  )}
                  {useByDate && (
                    <div><strong>Use By:</strong> {useByDate}</div>
                  )}
                  {productIdentity.batchCode && (
                    <div><strong>Batch:</strong> {productIdentity.batchCode}</div>
                  )}
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
          {selectedElementId === 'logo' ? (
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Company Logo</h4>
              <p className="text-xs text-gray-500 mb-4">Upload your company or brand logo</p>

              <input
                type="file"
                ref={logoInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />

              {logoUrl ? (
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-center bg-gray-50">
                    <img src={logoUrl} alt="Logo preview" className="max-w-full max-h-24 object-contain" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      Change
                    </button>
                    <button
                      onClick={() => setLogoUrl(null)}
                      className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#e9b03d] hover:text-[#000055]"
                >
                  <Upload size={24} />
                  <span className="text-sm">Click to upload logo</span>
                  <span className="text-xs text-gray-400">PNG, JPG, SVG up to 2MB</span>
                </button>
              )}

              <div className="mt-4">
                <label className="block text-xs text-gray-500 mb-1">Logo Size</label>
                <select
                  value={logoSize}
                  onChange={(e) => setLogoSize(e.target.value as 'small' | 'medium' | 'large')}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                >
                  <option value="small">Small (32px)</option>
                  <option value="medium">Medium (48px)</option>
                  <option value="large">Large (64px)</option>
                </select>
              </div>

              {/* Logo Custom Size */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="block text-xs text-gray-500 mb-2">Or set custom size</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Width (px)</label>
                    <input
                      type="number"
                      placeholder="Auto"
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-[#e9b03d] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Height (px)</label>
                    <input
                      type="number"
                      placeholder="Auto"
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-[#e9b03d] outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : selectedElementId === 'imageUpload' ? (
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Image Upload</h4>
              <p className="text-xs text-gray-500 mb-4">Upload images for your label</p>

              <input
                type="file"
                ref={imageInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />

              <button
                onClick={() => imageInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#e9b03d] hover:text-[#000055] mb-4"
              >
                <ImagePlus size={24} />
                <span className="text-sm">Click to upload image</span>
                <span className="text-xs text-gray-400">PNG, JPG, SVG up to 5MB</span>
              </button>

              {/* Uploaded Images List */}
              {uploadedImages.length > 0 && (
                <div className="space-y-2 mb-4">
                  <label className="block text-xs text-gray-500">Uploaded Images</label>
                  {uploadedImages.map(img => (
                    <div
                      key={img.id}
                      onClick={() => setSelectedImageId(img.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${
                        selectedImageId === img.id ? 'bg-[#e9b03d]/10 border border-[#e9b03d]/30' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img src={img.url} alt={img.name} className="w-8 h-8 object-cover rounded" />
                        <span className="text-sm truncate max-w-[120px]">{img.name}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteImage(img.id); }}
                        className="p-1 hover:bg-red-100 rounded text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Image Editor */}
              {selectedImageId && uploadedImages.find(i => i.id === selectedImageId) && (
                <div className="space-y-3 pt-3 border-t border-gray-200">
                  <h5 className="text-xs font-medium text-gray-700">Resize Image</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Width (px)</label>
                      <input
                        type="number"
                        value={uploadedImages.find(i => i.id === selectedImageId)?.width || 100}
                        onChange={(e) => updateImage(selectedImageId, { width: parseInt(e.target.value) || 100 })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-[#e9b03d] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Height (px)</label>
                      <input
                        type="number"
                        value={uploadedImages.find(i => i.id === selectedImageId)?.height || 100}
                        onChange={(e) => updateImage(selectedImageId, { height: parseInt(e.target.value) || 100 })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-[#e9b03d] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : selectedElementId === 'textStyling' ? (
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Global Text Styling</h4>
              <p className="text-xs text-gray-500 mb-4">Apply text styling across the label</p>

              <div className="space-y-4">
                {/* Font Family */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Font Family</label>
                  <select
                    value={globalTextStyle.fontFamily}
                    onChange={(e) => setGlobalTextStyle(prev => ({ ...prev, fontFamily: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] outline-none"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Trebuchet MS">Trebuchet MS</option>
                    <option value="Impact">Impact</option>
                  </select>
                </div>

                {/* Font Size */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Font Size (px)</label>
                  <input
                    type="number"
                    value={globalTextStyle.fontSize}
                    onChange={(e) => setGlobalTextStyle(prev => ({ ...prev, fontSize: parseInt(e.target.value) || 12 }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] outline-none"
                    min={8}
                    max={72}
                  />
                </div>

                {/* Text Color */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Text Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={globalTextStyle.color}
                      onChange={(e) => setGlobalTextStyle(prev => ({ ...prev, color: e.target.value }))}
                      className="w-12 h-10 rounded cursor-pointer border border-gray-200"
                    />
                    <input
                      type="text"
                      value={globalTextStyle.color}
                      onChange={(e) => setGlobalTextStyle(prev => ({ ...prev, color: e.target.value }))}
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] outline-none"
                      placeholder="#000000"
                    />
                  </div>
                </div>

                {/* Text Style Buttons */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Text Style</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setGlobalTextStyle(prev => ({ ...prev, bold: !prev.bold }))}
                      className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border ${
                        globalTextStyle.bold
                          ? 'bg-[#e9b03d]/20 border-[#e9b03d] text-[#000055]'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Bold size={16} />
                    </button>
                    <button
                      onClick={() => setGlobalTextStyle(prev => ({ ...prev, italic: !prev.italic }))}
                      className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border ${
                        globalTextStyle.italic
                          ? 'bg-[#e9b03d]/20 border-[#e9b03d] text-[#000055]'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Italic size={16} />
                    </button>
                    <button
                      onClick={() => setGlobalTextStyle(prev => ({ ...prev, underline: !prev.underline }))}
                      className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border ${
                        globalTextStyle.underline
                          ? 'bg-[#e9b03d]/20 border-[#e9b03d] text-[#000055]'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Underline size={16} />
                    </button>
                  </div>
                </div>

                {/* Preview */}
                <div className="pt-4 border-t border-gray-200">
                  <label className="block text-xs text-gray-500 mb-2">Preview</label>
                  <div
                    className="p-4 bg-gray-50 rounded-lg"
                    style={{
                      fontFamily: globalTextStyle.fontFamily,
                      fontSize: globalTextStyle.fontSize,
                      color: globalTextStyle.color,
                      fontWeight: globalTextStyle.bold ? 'bold' : 'normal',
                      fontStyle: globalTextStyle.italic ? 'italic' : 'normal',
                      textDecoration: globalTextStyle.underline ? 'underline' : 'none',
                    }}
                  >
                    Sample Text Preview
                  </div>
                </div>
              </div>
            </div>
          ) : selectedElementId === 'certifications' ? (
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Certifications</h4>
              <p className="text-xs text-gray-500 mb-4">Select applicable certifications for your product</p>

              <div className="space-y-2">
                {CERTIFICATION_OPTIONS.map((cert) => (
                  <label
                    key={cert.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      activeCertifications.includes(cert.id)
                        ? 'bg-[#e9b03d]/10 border border-[#e9b03d]/30'
                        : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={activeCertifications.includes(cert.id)}
                      onChange={() => toggleCertification(cert.id)}
                      className="rounded border-gray-300 text-[#000055] focus:ring-[#e9b03d]"
                    />
                    <span className="text-lg">{cert.icon}</span>
                    <span className="text-sm font-medium">{cert.name}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : selectedElementId === 'nutritionFacts' ? (
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Nutrition Facts</h4>
              <p className="text-xs text-gray-500 mb-4">Edit nutritional values for your product</p>

              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Servings/Container</label>
                    <input
                      type="text"
                      value={nutritionData.servingsPerContainer}
                      onChange={(e) => setNutritionData(prev => ({ ...prev, servingsPerContainer: e.target.value }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-[#e9b03d] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Serving Size</label>
                    <input
                      type="text"
                      value={nutritionData.servingSize}
                      onChange={(e) => setNutritionData(prev => ({ ...prev, servingSize: e.target.value }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-[#e9b03d] outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <label className="block text-xs text-gray-500 mb-1">Calories</label>
                  <input
                    type="text"
                    value={nutritionData.calories}
                    onChange={(e) => setNutritionData(prev => ({ ...prev, calories: e.target.value }))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-[#e9b03d] outline-none"
                  />
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <h5 className="text-xs font-medium text-gray-700 mb-2">Fats</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Total Fat (g)</label>
                      <input
                        type="text"
                        value={nutritionData.totalFat}
                        onChange={(e) => setNutritionData(prev => ({ ...prev, totalFat: e.target.value }))}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-[#e9b03d] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Saturated (g)</label>
                      <input
                        type="text"
                        value={nutritionData.saturatedFat}
                        onChange={(e) => setNutritionData(prev => ({ ...prev, saturatedFat: e.target.value }))}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-[#e9b03d] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Trans Fat (g)</label>
                      <input
                        type="text"
                        value={nutritionData.transFat}
                        onChange={(e) => setNutritionData(prev => ({ ...prev, transFat: e.target.value }))}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-[#e9b03d] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <h5 className="text-xs font-medium text-gray-700 mb-2">Other</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Cholesterol (mg)</label>
                      <input
                        type="text"
                        value={nutritionData.cholesterol}
                        onChange={(e) => setNutritionData(prev => ({ ...prev, cholesterol: e.target.value }))}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-[#e9b03d] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Sodium (mg)</label>
                      <input
                        type="text"
                        value={nutritionData.sodium}
                        onChange={(e) => setNutritionData(prev => ({ ...prev, sodium: e.target.value }))}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-[#e9b03d] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <h5 className="text-xs font-medium text-gray-700 mb-2">Carbohydrates</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Total Carbs (g)</label>
                      <input
                        type="text"
                        value={nutritionData.totalCarbs}
                        onChange={(e) => setNutritionData(prev => ({ ...prev, totalCarbs: e.target.value }))}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-[#e9b03d] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Fiber (g)</label>
                      <input
                        type="text"
                        value={nutritionData.dietaryFiber}
                        onChange={(e) => setNutritionData(prev => ({ ...prev, dietaryFiber: e.target.value }))}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-[#e9b03d] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Total Sugars (g)</label>
                      <input
                        type="text"
                        value={nutritionData.totalSugars}
                        onChange={(e) => setNutritionData(prev => ({ ...prev, totalSugars: e.target.value }))}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-[#e9b03d] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Added Sugars (g)</label>
                      <input
                        type="text"
                        value={nutritionData.addedSugars}
                        onChange={(e) => setNutritionData(prev => ({ ...prev, addedSugars: e.target.value }))}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-[#e9b03d] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <label className="block text-xs text-gray-500 mb-1">Protein (g)</label>
                  <input
                    type="text"
                    value={nutritionData.protein}
                    onChange={(e) => setNutritionData(prev => ({ ...prev, protein: e.target.value }))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-[#e9b03d] outline-none"
                  />
                </div>
              </div>
            </div>
          ) : selectedElementId === 'customFields' ? (
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Custom Fields</h4>
              <p className="text-xs text-gray-500 mb-4">Add custom text fields to your label</p>

              <div className="space-y-3 mb-4">
                {customFields.map((field, idx) => (
                  <div key={field.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => {
                          const newFields = [...customFields];
                          newFields[idx].label = e.target.value;
                          setCustomFields(newFields);
                        }}
                        placeholder="Label"
                        className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-[#e9b03d] outline-none"
                      />
                      <button
                        onClick={() => setCustomFields(prev => prev.filter((_, i) => i !== idx))}
                        className="p-1 hover:bg-red-100 rounded text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => {
                        const newFields = [...customFields];
                        newFields[idx].value = e.target.value;
                        setCustomFields(newFields);
                      }}
                      placeholder="Value"
                      className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-[#e9b03d] outline-none"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={() => setCustomFields(prev => [...prev, { id: `${Date.now()}`, label: '', value: '' }])}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[#e9b03d] hover:text-[#000055]"
              >
                <Plus size={16} />
                Add Custom Field
              </button>
            </div>
          ) : selectedElementId === 'ingredients' ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Ingredient List</h4>
                <button
                  onClick={sortIngredientsByWeight}
                  className="text-xs text-[#000055] hover:text-[#000055] hover:underline flex items-center gap-1"
                  title="Sort by weight descending (required by regulations)"
                >
                  <ChevronDown size={12} />
                  Auto-sort by weight
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-4">Use arrows to reorder. Bold items are allergens. Enter % for QUID.</p>

              <div className="space-y-2">
                {ingredients.map((ing, index) => (
                  <div key={ing.id} className="space-y-1">
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg group">
                      {/* Reorder buttons */}
                      <div className="flex flex-col">
                        <button
                          onClick={() => moveIngredientUp(index)}
                          disabled={index === 0}
                          className={`p-0.5 rounded ${index === 0 ? 'text-gray-200' : 'text-gray-400 hover:text-[#000055] hover:bg-[#e9b03d]/10'}`}
                        >
                          <ChevronUp size={12} />
                        </button>
                        <button
                          onClick={() => moveIngredientDown(index)}
                          disabled={index === ingredients.length - 1}
                          className={`p-0.5 rounded ${index === ingredients.length - 1 ? 'text-gray-200' : 'text-gray-400 hover:text-[#000055] hover:bg-[#e9b03d]/10'}`}
                        >
                          <ChevronDown size={12} />
                        </button>
                      </div>
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
                        title="QUID percentage"
                      />
                      <label className="flex items-center gap-1 text-xs" title="Mark as allergen">
                        <input
                          type="checkbox"
                          checked={ing.isAllergen}
                          onChange={(e) => {
                            const newIngredients = [...ingredients];
                            newIngredients[index].isAllergen = e.target.checked;
                            setIngredients(newIngredients);
                          }}
                          className="rounded border-gray-300 text-[#000055] focus:ring-[#e9b03d]"
                        />
                        A
                      </label>
                      <label className="flex items-center gap-1 text-xs" title="Compound ingredient (has sub-ingredients)">
                        <input
                          type="checkbox"
                          checked={ing.isCompound || false}
                          onChange={(e) => {
                            const newIngredients = [...ingredients];
                            newIngredients[index].isCompound = e.target.checked;
                            if (e.target.checked && !newIngredients[index].subIngredients) {
                              newIngredients[index].subIngredients = [];
                            }
                            setIngredients(newIngredients);
                          }}
                          className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        C
                      </label>
                      <button
                        onClick={() => setIngredients(prev => prev.filter(i => i.id !== ing.id))}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Sub-ingredients for compound ingredients */}
                    {ing.isCompound && (
                      <div className="ml-8 pl-2 border-l-2 border-amber-200 space-y-1">
                        {(ing.subIngredients || []).map((sub, subIdx) => (
                          <div key={sub.id} className="flex items-center gap-2 py-1 text-xs">
                            <input
                              type="text"
                              value={sub.name}
                              onChange={(e) => {
                                const newIngredients = [...ingredients];
                                if (newIngredients[index].subIngredients) {
                                  newIngredients[index].subIngredients![subIdx].name = e.target.value;
                                }
                                setIngredients(newIngredients);
                              }}
                              className={`flex-1 px-2 py-0.5 border border-gray-200 rounded text-xs ${sub.isAllergen ? 'font-bold' : ''}`}
                              placeholder="Sub-ingredient"
                            />
                            <label className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={sub.isAllergen}
                                onChange={(e) => {
                                  const newIngredients = [...ingredients];
                                  if (newIngredients[index].subIngredients) {
                                    newIngredients[index].subIngredients![subIdx].isAllergen = e.target.checked;
                                  }
                                  setIngredients(newIngredients);
                                }}
                                className="rounded border-gray-300 text-[#000055] focus:ring-[#e9b03d] w-3 h-3"
                              />
                              A
                            </label>
                            <button
                              onClick={() => {
                                const newIngredients = [...ingredients];
                                if (newIngredients[index].subIngredients) {
                                  newIngredients[index].subIngredients = newIngredients[index].subIngredients!.filter((_, i) => i !== subIdx);
                                }
                                setIngredients(newIngredients);
                              }}
                              className="p-0.5 hover:bg-red-100 rounded text-red-400"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const newIngredients = [...ingredients];
                            if (!newIngredients[index].subIngredients) {
                              newIngredients[index].subIngredients = [];
                            }
                            newIngredients[index].subIngredients!.push({
                              id: `${ing.id}-${Date.now()}`,
                              name: '',
                              isAllergen: false
                            });
                            setIngredients(newIngredients);
                          }}
                          className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1"
                        >
                          <Plus size={10} />
                          Add sub-ingredient
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  const newId = `${Date.now()}`;
                  setIngredients(prev => [...prev, {
                    id: newId,
                    name: 'New Ingredient',
                    percentage: undefined,
                    isAllergen: false,
                  }]);
                }}
                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[#e9b03d] hover:text-[#000055]"
              >
                <Plus size={16} />
                Add Ingredient
              </button>
            </div>
          ) : selectedElementId === 'storage' ? (
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Storage Instructions</h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Storage Text</label>
                  <textarea
                    value={storageInstructions.text}
                    onChange={(e) => setStorageInstructions(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="Enter storage instructions..."
                    className="w-full h-20 px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Temperature</label>
                    <input
                      type="text"
                      value={storageInstructions.temperature}
                      onChange={(e) => setStorageInstructions(prev => ({ ...prev, temperature: e.target.value }))}
                      placeholder="e.g., 2-8°C"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Humidity</label>
                    <input
                      type="text"
                      value={storageInstructions.humidity}
                      onChange={(e) => setStorageInstructions(prev => ({ ...prev, humidity: e.target.value }))}
                      placeholder="e.g., <60%"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Icon</label>
                  <select
                    value={storageInstructions.icon}
                    onChange={(e) => setStorageInstructions(prev => ({ ...prev, icon: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                  >
                    <option value="thermometer">Thermometer</option>
                    <option value="snowflake">Snowflake (Frozen)</option>
                    <option value="sun">Sun (Avoid)</option>
                    <option value="droplet">Droplet (Humidity)</option>
                    <option value="none">No Icon</option>
                  </select>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-3">E.g., "Store in a cool, dry place away from direct sunlight"</p>
            </div>
          ) : selectedElementId === 'instructions' ? (
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Preparation Instructions</h4>

              <div className="space-y-4">
                {/* Preparation Steps */}
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Steps</label>
                  <div className="space-y-2">
                    {preparationInstructions.steps.map((step, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-4">{index + 1}.</span>
                        <input
                          type="text"
                          value={step}
                          onChange={(e) => {
                            const newSteps = [...preparationInstructions.steps];
                            newSteps[index] = e.target.value;
                            setPreparationInstructions(prev => ({ ...prev, steps: newSteps }));
                          }}
                          placeholder={`Step ${index + 1}...`}
                          className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-[#e9b03d] outline-none"
                        />
                        {preparationInstructions.steps.length > 1 && (
                          <button
                            onClick={() => {
                              const newSteps = preparationInstructions.steps.filter((_, i) => i !== index);
                              setPreparationInstructions(prev => ({ ...prev, steps: newSteps }));
                            }}
                            className="p-1 hover:bg-red-100 rounded text-red-500"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setPreparationInstructions(prev => ({ ...prev, steps: [...prev.steps, ''] }))}
                    className="mt-2 w-full flex items-center justify-center gap-1 px-2 py-1.5 border border-dashed border-gray-300 rounded text-xs text-gray-500 hover:border-[#e9b03d] hover:text-[#000055]"
                  >
                    <Plus size={12} />
                    Add Step
                  </button>
                </div>

                {/* Cooking Temperature & Time */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Cooking Temp</label>
                    <input
                      type="text"
                      value={preparationInstructions.cookingTemp}
                      onChange={(e) => setPreparationInstructions(prev => ({ ...prev, cookingTemp: e.target.value }))}
                      placeholder="e.g., 180°C / 350°F"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Cooking Time</label>
                    <input
                      type="text"
                      value={preparationInstructions.cookingTime}
                      onChange={(e) => setPreparationInstructions(prev => ({ ...prev, cookingTime: e.target.value }))}
                      placeholder="e.g., 12-15 min"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                    />
                  </div>
                </div>

                {/* Legacy text area for backward compatibility */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Additional Notes</label>
                  <textarea
                    value={instructionsText}
                    onChange={(e) => setInstructionsText(e.target.value)}
                    placeholder="Any additional notes..."
                    className="w-full h-16 px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-3">E.g., "Preheat oven to 180°C. Bake for 12-15 minutes"</p>
            </div>
          ) : selectedElementId === 'allergens' ? (
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Allergen Declaration</h4>

              {/* Placement Option */}
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-2">Display Position</label>
                <select
                  value={allergenPlacement}
                  onChange={(e) => setAllergenPlacement(e.target.value as 'within' | 'separate' | 'both')}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                >
                  <option value="within">Within ingredient list (bold)</option>
                  <option value="separate">Separate "Contains:" statement</option>
                  <option value="both">Both positions</option>
                </select>
              </div>

              {/* Allergen List */}
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-2">Allergens</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {allergens.map((allergen, idx) => (
                    <div key={allergen.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <span className="flex-1 text-sm font-medium">{allergen.name}</span>
                      <select
                        value={allergen.status}
                        onChange={(e) => {
                          const newAllergens = [...allergens];
                          newAllergens[idx].status = e.target.value as 'contains' | 'may_contain' | 'free_from';
                          setAllergens(newAllergens);
                        }}
                        className="px-2 py-1 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-[#e9b03d] outline-none"
                      >
                        <option value="contains">Contains</option>
                        <option value="may_contain">May Contain</option>
                        <option value="free_from">Free From</option>
                      </select>
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={allergen.highlight}
                          onChange={(e) => {
                            const newAllergens = [...allergens];
                            newAllergens[idx].highlight = e.target.checked;
                            setAllergens(newAllergens);
                          }}
                          className="rounded border-gray-300 text-[#000055] focus:ring-[#e9b03d]"
                        />
                        Bold
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Precautionary Statement */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Precautionary Statement</label>
                <textarea
                  value={precautionaryStatement}
                  onChange={(e) => setPrecautionaryStatement(e.target.value)}
                  placeholder="May contain traces of..."
                  className="w-full h-20 px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">Cross-contamination warning</p>
              </div>
            </div>
          ) : selectedElementId === 'statements' ? (
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Mandatory Statements</h4>
              <p className="text-xs text-gray-500 mb-4">Add required warnings and instructions</p>

              <div className="space-y-2 mb-4">
                {mandatoryStatements.map((stmt, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      value={stmt}
                      onChange={(e) => {
                        const newStmts = [...mandatoryStatements];
                        newStmts[idx] = e.target.value;
                        setMandatoryStatements(newStmts);
                      }}
                      className="flex-1 text-sm bg-transparent outline-none"
                    />
                    <button
                      onClick={() => setMandatoryStatements(prev => prev.filter((_, i) => i !== idx))}
                      className="p-1 hover:bg-red-100 rounded text-red-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setMandatoryStatements(prev => [...prev, ''])}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[#e9b03d] hover:text-[#000055]"
              >
                <Plus size={16} />
                Add Statement
              </button>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="block text-xs text-gray-500 mb-2">Quick Add Common Statements</label>
                <div className="flex flex-wrap gap-2">
                  {['Keep refrigerated', 'Consume within 3 days', 'Shake well before use', 'For external use only'].map((stmt) => (
                    <button
                      key={stmt}
                      onClick={() => {
                        if (!mandatoryStatements.includes(stmt)) {
                          setMandatoryStatements(prev => [...prev, stmt]);
                        }
                      }}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-[#e9b03d]/20 rounded"
                    >
                      + {stmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : selectedElementId === 'healthClaims' ? (
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Health & Nutrition Claims</h4>
              <p className="text-xs text-gray-500 mb-4">Manage claims per GSO/EU/FDA regulations</p>

              {/* Region Selector */}
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1">Target Region</label>
                <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none">
                  <option value="fda">FDA (USA)</option>
                  <option value="eu">EU (Europe)</option>
                  <option value="gso">GSO (GCC)</option>
                  <option value="fssai">FSSAI (India)</option>
                </select>
              </div>

              {/* Claims List */}
              <div className="space-y-2 mb-4">
                {healthClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className={`p-3 rounded-lg border ${claim.approved ? 'border-[#e9b03d]/30 bg-[#e9b03d]/10' : 'border-amber-200 bg-amber-50'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            claim.type === 'health' ? 'bg-blue-100 text-blue-700' :
                            claim.type === 'nutrition' ? 'bg-green-100 text-green-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {claim.type}
                          </span>
                          <span className="text-xs text-gray-500">{claim.region}</span>
                        </div>
                        <p className="text-sm font-medium mt-1">{claim.claim}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {claim.approved ? (
                          <CheckCircle size={16} className="text-[#000055]" />
                        ) : (
                          <Clock size={16} className="text-amber-600" />
                        )}
                        <button
                          onClick={() => setHealthClaims(prev => prev.filter(c => c.id !== claim.id))}
                          className="p-1 hover:bg-red-100 rounded text-red-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    {!claim.approved && (
                      <p className="text-xs text-amber-600 mt-2">⚠️ Pending regulatory approval - verify before use</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Add New Claim */}
              <button
                onClick={() => {
                  const newClaim = {
                    id: `${Date.now()}`,
                    claim: 'New Claim',
                    type: 'nutrition' as const,
                    region: 'FDA',
                    approved: false,
                  };
                  setHealthClaims(prev => [...prev, newClaim]);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[#e9b03d] hover:text-[#000055]"
              >
                <Plus size={16} />
                Add Claim
              </button>

              {/* Backend Integration Note */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700 font-medium">🔧 Backend Required</p>
                <p className="text-xs text-blue-600 mt-1">
                  Claims database with regional regulations (GSO, EU 1924/2006, FDA 21 CFR).
                  Auto-validate claims based on nutrition values.
                </p>
              </div>
            </div>
          ) : selectedElementId === 'alcohol' ? (
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Content Warnings</h4>
              <p className="text-xs text-gray-500 mb-4">Caffeine, Alcohol & Sodium triggers per regulations</p>

              <div className="space-y-4">
                {/* Alcohol */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Alcohol (ABV)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={alcoholPercent}
                      onChange={(e) => setAlcoholPercent(e.target.value)}
                      placeholder="0.0"
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                    />
                    <span className="text-sm text-gray-500">% vol</span>
                  </div>
                </div>

                {/* Caffeine */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Caffeine Content</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={caffeineContent}
                      onChange={(e) => setCaffeineContent(e.target.value)}
                      placeholder="0"
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                    />
                    <span className="text-sm text-gray-500">mg/serving</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">High caffeine warning if &gt;150mg/L</p>
                </div>

                {/* High Sodium Warning */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={highSodiumWarning}
                      onChange={(e) => setHighSodiumWarning(e.target.checked)}
                      className="rounded border-gray-300 text-[#000055] focus:ring-[#e9b03d]"
                    />
                    <span className="text-sm text-gray-700">High Sodium Warning</span>
                  </label>
                  <p className="text-xs text-gray-400 mt-1 ml-6">Required if sodium exceeds daily limit %</p>
                </div>
              </div>
            </div>
          ) : selectedElementId === 'qrCode' ? (
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">QR Code</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Link URL</label>
                  <input
                    type="url"
                    value={qrCodeUrl}
                    onChange={(e) => setQrCodeUrl(e.target.value)}
                    placeholder="https://example.com/product-info"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Size</label>
                  <select
                    value={qrCodeSize}
                    onChange={(e) => setQrCodeSize(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                  >
                    <option value="small">Small (20x20mm)</option>
                    <option value="medium">Medium (30x30mm)</option>
                    <option value="large">Large (40x40mm)</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Links to product page, nutritional info, or allergen details</p>
            </div>
          ) : selectedElementId === 'nameAddress' ? (
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Manufacturer Details</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={manufacturer.companyName}
                    onChange={(e) => setManufacturer(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Your Company Ltd."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Address</label>
                  <textarea
                    value={manufacturer.address}
                    onChange={(e) => setManufacturer(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Food Street&#10;City, Country"
                    className="w-full h-20 px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Contact</label>
                  <input
                    type="text"
                    value={manufacturer.contact}
                    onChange={(e) => setManufacturer(prev => ({ ...prev, contact: e.target.value }))}
                    placeholder="contact@company.com"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                  />
                </div>
              </div>
            </div>
          ) : selectedElementId === 'barcode' ? (
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Barcode</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Barcode Type</label>
                  <select
                    value={barcodeData.type}
                    onChange={(e) => setBarcodeData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                  >
                    <option>EAN-13</option>
                    <option>UPC-A</option>
                    <option>Code 128</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Barcode Number</label>
                  <input
                    type="text"
                    value={barcodeData.number}
                    onChange={(e) => setBarcodeData(prev => ({ ...prev, number: e.target.value }))}
                    placeholder="1234567890123"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={barcodeData.showNumbers}
                    onChange={(e) => setBarcodeData(prev => ({ ...prev, showNumbers: e.target.checked }))}
                    className="rounded border-gray-300 text-[#000055] focus:ring-[#e9b03d]"
                  />
                  <span className="text-gray-600">Show numbers below barcode</span>
                </label>
              </div>
            </div>
          ) : selectedElementId === 'origin' ? (
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Country of Origin</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Country</label>
                  <select
                    value={origin.country}
                    onChange={(e) => setOrigin(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                  >
                    <option>United States</option>
                    <option>United Kingdom</option>
                    <option>United Arab Emirates</option>
                    <option>Saudi Arabia</option>
                    <option>India</option>
                    <option>Germany</option>
                    <option>France</option>
                    <option>Italy</option>
                    <option>Other...</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Display Format</label>
                  <select
                    value={origin.format}
                    onChange={(e) => setOrigin(prev => ({ ...prev, format: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                  >
                    <option value="Made in [Country]">Made in [Country]</option>
                    <option value="Product of [Country]">Product of [Country]</option>
                    <option value="Country of Origin: [Country]">Country of Origin: [Country]</option>
                  </select>
                </div>
              </div>
            </div>
          ) : selectedElementId === 'traceability' ? (
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Traceability</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Lot/Batch Number</label>
                  <input
                    type="text"
                    value={productIdentity.batchCode}
                    onChange={(e) => setProductIdentity(prev => ({ ...prev, batchCode: e.target.value }))}
                    placeholder="LOT-2024-001"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Production Date</label>
                  <input
                    type="date"
                    value={traceability.productionDate}
                    onChange={(e) => setTraceability(prev => ({ ...prev, productionDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Required for product recall and quality tracking</p>
            </div>
          ) : selectedElementId === 'dividerLine' ? (
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Divider Line</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Line Style</label>
                  <select
                    value={dividerStyle}
                    onChange={(e) => setDividerStyle(e.target.value as 'solid' | 'dashed' | 'dotted')}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Thickness</label>
                  <select
                    value={dividerThickness}
                    onChange={(e) => setDividerThickness(e.target.value as 'thin' | 'medium' | 'thick')}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                  >
                    <option value="thin">Thin (1px)</option>
                    <option value="medium">Medium (2px)</option>
                    <option value="thick">Thick (4px)</option>
                  </select>
                </div>
              </div>
              {/* Preview */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="block text-xs text-gray-500 mb-2">Preview</label>
                <div
                  className={`border-black ${
                    dividerStyle === 'dashed' ? 'border-dashed' : dividerStyle === 'dotted' ? 'border-dotted' : 'border-solid'
                  } ${
                    dividerThickness === 'thin' ? 'border-t' : dividerThickness === 'thick' ? 'border-t-4' : 'border-t-2'
                  }`}
                />
              </div>
            </div>
          ) : selectedElementId === 'nutriMark' ? (
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">NutriMark</h4>
              <p className="text-xs text-gray-500 mb-4">Display nutritional quality indicator on your label</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Display Type</label>
                  <select
                    value={nutriMark.type}
                    onChange={(e) => setNutriMark(prev => ({ ...prev, type: e.target.value as 'nutri-score' | 'traffic-light' | 'star-rating' }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                  >
                    <option value="nutri-score">Nutri-Score (A-E)</option>
                    <option value="traffic-light">Traffic Light</option>
                    <option value="star-rating">Star Rating</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-2">Score Grade</label>
                  <div className="flex gap-2">
                    {(['A', 'B', 'C', 'D', 'E'] as const).map(grade => (
                      <button
                        key={grade}
                        onClick={() => setNutriMark({ ...nutriMark, score: grade })}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                          nutriMark.score === grade ? 'ring-2 ring-[#000055] scale-110' : 'opacity-70 hover:opacity-100'
                        } ${
                          grade === 'A' ? 'bg-green-600 text-white' :
                          grade === 'B' ? 'bg-lime-500 text-white' :
                          grade === 'C' ? 'bg-yellow-400 text-gray-800' :
                          grade === 'D' ? 'bg-orange-500 text-white' :
                          'bg-red-600 text-white'
                        }`}
                      >
                        {grade}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nutriMark.showOnLabel}
                    onChange={(e) => setNutriMark({ ...nutriMark, showOnLabel: e.target.checked })}
                    className="rounded border-gray-300 text-[#000055] focus:ring-[#e9b03d]"
                  />
                  <span className="text-sm">Show on label</span>
                </label>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700">
                      <strong>Backend Required:</strong> NutriMark score should be auto-calculated based on nutritional values per regulatory guidelines.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedElementId === 'shapes' ? (
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Shapes</h4>
              <p className="text-xs text-gray-500 mb-4">Add shapes with customizable text and styling</p>

              {/* Add Shape Buttons */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => addShape('square')}
                  className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
                >
                  <Square size={16} />
                  Square
                </button>
                <button
                  onClick={() => addShape('rectangle')}
                  className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
                >
                  <div className="w-5 h-3 border-2 border-current rounded-sm" />
                  Rectangle
                </button>
                <button
                  onClick={() => addShape('circle')}
                  className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
                >
                  <Circle size={16} />
                  Circle
                </button>
                <button
                  onClick={() => addShape('oval')}
                  className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
                >
                  <div className="w-5 h-3 border-2 border-current rounded-full" />
                  Oval
                </button>
              </div>

              {/* Shape List */}
              {shapes.length > 0 && (
                <div className="space-y-2 mb-4">
                  <label className="block text-xs text-gray-500">Your Shapes</label>
                  {shapes.map(shape => (
                    <div
                      key={shape.id}
                      onClick={() => setSelectedShapeId(shape.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${
                        selectedShapeId === shape.id ? 'bg-[#e9b03d]/10 border border-[#e9b03d]/30' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {shape.type === 'circle' ? <Circle size={14} /> : <Square size={14} />}
                        <span className="text-sm">{shape.type} - "{shape.text}"</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteShape(shape.id); }}
                        className="p-1 hover:bg-red-100 rounded text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Shape Editor */}
              {selectedShapeId && shapes.find(s => s.id === selectedShapeId) && (
                <div className="space-y-3 pt-3 border-t border-gray-200">
                  <h5 className="text-xs font-medium text-gray-700">Edit Shape</h5>

                  {/* Text */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Text</label>
                    <input
                      type="text"
                      value={shapes.find(s => s.id === selectedShapeId)?.text || ''}
                      onChange={(e) => updateShape(selectedShapeId, { text: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-[#e9b03d] outline-none"
                    />
                  </div>

                  {/* Size */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Width (px)</label>
                      <input
                        type="number"
                        value={shapes.find(s => s.id === selectedShapeId)?.width || 60}
                        onChange={(e) => updateShape(selectedShapeId, { width: parseInt(e.target.value) || 60 })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-[#e9b03d] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Height (px)</label>
                      <input
                        type="number"
                        value={shapes.find(s => s.id === selectedShapeId)?.height || 60}
                        onChange={(e) => updateShape(selectedShapeId, { height: parseInt(e.target.value) || 60 })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-[#e9b03d] outline-none"
                      />
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Background</label>
                      <input
                        type="color"
                        value={shapes.find(s => s.id === selectedShapeId)?.bgColor || '#10b981'}
                        onChange={(e) => updateShape(selectedShapeId, { bgColor: e.target.value })}
                        className="w-full h-8 rounded cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Text Color</label>
                      <input
                        type="color"
                        value={shapes.find(s => s.id === selectedShapeId)?.textColor || '#ffffff'}
                        onChange={(e) => updateShape(selectedShapeId, { textColor: e.target.value })}
                        className="w-full h-8 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Font */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Font</label>
                      <select
                        value={shapes.find(s => s.id === selectedShapeId)?.fontFamily || 'Arial'}
                        onChange={(e) => updateShape(selectedShapeId, { fontFamily: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-[#e9b03d] outline-none"
                      >
                        <option value="Arial">Arial</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Courier New">Courier New</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Size (px)</label>
                      <input
                        type="number"
                        value={shapes.find(s => s.id === selectedShapeId)?.fontSize || 12}
                        onChange={(e) => updateShape(selectedShapeId, { fontSize: parseInt(e.target.value) || 12 })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-[#e9b03d] outline-none"
                      />
                    </div>
                  </div>

                  {/* Text Style */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Text Style</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateShape(selectedShapeId, { bold: !shapes.find(s => s.id === selectedShapeId)?.bold })}
                        className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded border ${
                          shapes.find(s => s.id === selectedShapeId)?.bold
                            ? 'bg-[#e9b03d]/20 border-[#e9b03d] text-[#000055]'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <Bold size={14} />
                      </button>
                      <button
                        onClick={() => updateShape(selectedShapeId, { italic: !shapes.find(s => s.id === selectedShapeId)?.italic })}
                        className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded border ${
                          shapes.find(s => s.id === selectedShapeId)?.italic
                            ? 'bg-[#e9b03d]/20 border-[#e9b03d] text-[#000055]'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <Italic size={14} />
                      </button>
                      <button
                        onClick={() => updateShape(selectedShapeId, { underline: !shapes.find(s => s.id === selectedShapeId)?.underline })}
                        className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded border ${
                          shapes.find(s => s.id === selectedShapeId)?.underline
                            ? 'bg-[#e9b03d]/20 border-[#e9b03d] text-[#000055]'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <Underline size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : selectedElementId === 'productSettings' || !selectedElementId ? (
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Product Settings</h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Legal Name</label>
                  <input
                    type="text"
                    value={productIdentity.legalName}
                    onChange={(e) => setProductIdentity(prev => ({ ...prev, legalName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Font Size</label>
                    <select
                      value={productFontSize}
                      onChange={(e) => setProductFontSize(e.target.value as 'small' | 'medium' | 'large')}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={productIdentity.brandName}
                    onChange={(e) => setProductIdentity(prev => ({ ...prev, brandName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Product Form</label>
                  <select
                    value={productForm}
                    onChange={(e) => setProductForm(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                  >
                    <option value="">None</option>
                    <option value="Fresh">Fresh</option>
                    <option value="Frozen">Frozen</option>
                    <option value="Concentrate">Concentrate</option>
                    <option value="Dried">Dried</option>
                    <option value="Powdered">Powdered</option>
                    <option value="Ready to Eat">Ready to Eat</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Net Weight</label>
                    <input
                      type="text"
                      value={productIdentity.netWeight}
                      onChange={(e) => setProductIdentity(prev => ({ ...prev, netWeight: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                    />
                  </div>
                  <div className="w-20">
                    <label className="block text-xs text-gray-500 mb-1">Unit</label>
                    <select
                      value={productIdentity.netWeightUnit}
                      onChange={(e) => setProductIdentity(prev => ({ ...prev, netWeightUnit: e.target.value }))}
                      className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="l">l</option>
                      <option value="oz">oz</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Manufacture Date</label>
                    <input
                      type="date"
                      value={productIdentity.manufactureDate}
                      onChange={(e) => setProductIdentity(prev => ({ ...prev, manufactureDate: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Packing Date</label>
                    <input
                      type="date"
                      value={productIdentity.packingDate}
                      onChange={(e) => setProductIdentity(prev => ({ ...prev, packingDate: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Best Before</label>
                    <input
                      type="date"
                      value={productIdentity.bestBefore}
                      onChange={(e) => setProductIdentity(prev => ({ ...prev, bestBefore: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Use By</label>
                    <input
                      type="date"
                      value={useByDate}
                      onChange={(e) => setUseByDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Batch Code</label>
                  <input
                    type="text"
                    value={productIdentity.batchCode}
                    onChange={(e) => setProductIdentity(prev => ({ ...prev, batchCode: e.target.value }))}
                    placeholder="e.g., LOT-2024-001"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">Select an element from the left panel to edit its settings</p>
            </div>
          )}
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold">Export Label</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* Export Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['PDF', 'PNG', 'SVG'].map((format) => (
                      <button
                        key={format}
                        className="px-4 py-3 border-2 border-gray-200 rounded-lg text-sm font-medium hover:border-[#e9b03d] focus:border-[#e9b03d] focus:bg-[#e9b03d]/10"
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resolution / DPI */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Resolution</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                    <option>72 DPI (Screen)</option>
                    <option>150 DPI (Draft Print)</option>
                    <option>300 DPI (Print Quality)</option>
                    <option>600 DPI (High Quality)</option>
                  </select>
                </div>

                {/* Print Preview Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Label Size (Print Preview)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Width</label>
                      <div className="flex">
                        <input type="number" defaultValue="50" className="w-full px-3 py-2 border border-gray-200 rounded-l-lg text-sm" />
                        <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-200 rounded-r-lg text-sm text-gray-500">mm</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Height</label>
                      <div className="flex">
                        <input type="number" defaultValue="70" className="w-full px-3 py-2 border border-gray-200 rounded-l-lg text-sm" />
                        <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-200 rounded-r-lg text-sm text-gray-500">mm</span>
                      </div>
                    </div>
                  </div>
                  <button className="mt-2 text-xs text-[#000055] hover:underline">
                    Preview at real size →
                  </button>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Advanced Options</h4>

                  {/* Variable Data Batch Export */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Batch Export (Variable Data)</span>
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Backend Required</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      Upload CSV with variable data (batch codes, dates, etc.) to generate multiple labels.
                    </p>
                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-[#e9b03d] hover:text-[#000055]">
                        <Upload size={14} className="inline mr-1" />
                        Upload CSV Template
                      </button>
                      <button className="px-3 py-2 text-xs text-[#000055] border border-[#e9b03d]/30 rounded-lg hover:bg-[#e9b03d]/10">
                        Download Sample
                      </button>
                    </div>
                    <div className="mt-2 p-2 bg-white border border-gray-200 rounded text-xs text-gray-600">
                      <strong>CSV Columns:</strong> batch_code, manufacture_date, best_before, lot_number
                    </div>
                  </div>

                  {/* Label Sheet Layout */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Label Sheet Layout</span>
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Backend Required</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      Arrange multiple labels per sheet for printing (A4/Letter).
                    </p>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                        <option>A4 (210 × 297mm)</option>
                        <option>Letter (8.5 × 11")</option>
                        <option>Custom Size</option>
                      </select>
                      <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                        <option>2 × 3 labels</option>
                        <option>3 × 4 labels</option>
                        <option>4 × 5 labels</option>
                        <option>Auto-fit</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <label className="flex items-center gap-1">
                        <input type="checkbox" className="rounded border-gray-300 text-[#000055]" defaultChecked />
                        Show cut marks
                      </label>
                      <label className="flex items-center gap-1">
                        <input type="checkbox" className="rounded border-gray-300 text-[#000055]" />
                        Add bleed (3mm)
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button className="px-4 py-2 text-sm bg-[#000055] text-white rounded-lg hover:bg-[#000044]">
                Export Single
              </button>
              <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Batch Export
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

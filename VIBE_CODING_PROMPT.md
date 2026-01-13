# NutriCal - Vibe Coding Development Guide

## Project Overview

**NutriCal** is GCC's first food nutrition labels generator & calorie analysis software. This admin panel allows clients to create their own label formats without developer intervention.

### Key Features
1. **Label Template Builder** - Visual drag-and-drop editor for creating custom nutrition label layouts
2. **Product/Recipe Management** - Add products, ingredients, auto-calculate nutrition
3. **Multi-format Labels** - Support for Vertical, Tabular, Dual Column, Linear, Aggregate displays
4. **Saudi FDA Compliance** - Built-in compliance with GCC food labeling regulations
5. **Export** - Generate labels as PNG/PDF/SVG

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | TailwindCSS |
| Canvas Editor | Fabric.js (label builder) |
| State Management | Zustand |
| Backend | Python FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy 2.0 |
| PDF Export | WeasyPrint |
| Image Export | Pillow + html2image |

---

## Phase 1: Foundation (Week 1-2)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

**Tasks:**
1. [ ] Set up FastAPI app with CORS
2. [ ] Configure PostgreSQL connection
3. [ ] Create base models (User, Product, Ingredient, Template, Label)
4. [ ] Implement JWT authentication
5. [ ] Create basic CRUD endpoints

**Test:** `uvicorn app.main:app --reload` should show Swagger at /docs

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

**Tasks:**
1. [ ] Configure Vite + React + TypeScript
2. [ ] Set up TailwindCSS
3. [ ] Create routing (React Router)
4. [ ] Build authentication flow
5. [ ] Create base layout with sidebar

---

## Phase 2: Product & Ingredient Management (Week 3-4)

### Database Models

```python
# Products table
- id, name, description, serving_size, serving_unit, servings_per_container
- created_at, updated_at, user_id

# Ingredients table (master list)
- id, name, calories, total_fat, saturated_fat, trans_fat, cholesterol
- sodium, total_carbs, dietary_fiber, total_sugars, added_sugars, protein
- vitamin_d, calcium, iron, potassium
- per_unit (g/ml), is_verified

# ProductIngredients (junction)
- product_id, ingredient_id, quantity, unit
```

### API Endpoints

```
POST   /api/v1/products              # Create product
GET    /api/v1/products              # List products
GET    /api/v1/products/{id}         # Get product details
PUT    /api/v1/products/{id}         # Update product
DELETE /api/v1/products/{id}         # Delete product

POST   /api/v1/ingredients           # Add ingredient to master list
GET    /api/v1/ingredients           # Search ingredients
GET    /api/v1/ingredients/{id}      # Get ingredient nutrition data

POST   /api/v1/products/{id}/ingredients  # Add ingredient to product
DELETE /api/v1/products/{id}/ingredients/{ing_id}
```

### Frontend Components

```
pages/
  ProductsPage.tsx          # List all products
  ProductDetailPage.tsx     # Edit product, add ingredients
  IngredientsPage.tsx       # Manage master ingredient list

components/products/
  ProductCard.tsx
  ProductForm.tsx
  IngredientSearch.tsx      # Autocomplete search
  IngredientRow.tsx         # Quantity input
  NutritionSummary.tsx      # Auto-calculated totals
```

---

## Phase 3: Label Template Builder (Week 5-8) ⭐ CORE FEATURE

### Template Structure

```typescript
interface LabelTemplate {
  id: string;
  name: string;
  type: 'vertical' | 'tabular' | 'dual-column' | 'linear' | 'aggregate';
  width: number;
  height: number;
  elements: LabelElement[];
  styles: GlobalStyles;
}

interface LabelElement {
  id: string;
  type: 'nutrition-box' | 'ingredients-list' | 'allergens' | 'business-info' | 'text' | 'line' | 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  properties: ElementProperties;
}

interface NutritionBoxProperties {
  showCalories: boolean;
  showServingSize: boolean;
  nutrients: NutrientConfig[];
  fontSize: number;
  fontFamily: string;
  borderWidth: number;
  showDailyValue: boolean;
}
```

### Label Builder UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [Template Name]              [Preview] [Save] [Export]     │
├──────────┬──────────────────────────────────┬───────────────┤
│          │                                  │               │
│ ELEMENTS │         CANVAS AREA              │  PROPERTIES   │
│          │                                  │               │
│ □ Nutr.  │    ┌──────────────────┐         │  Position     │
│   Box    │    │ Nutrition Facts  │         │  X: [___]     │
│ □ Ingr.  │    │ Serving size     │         │  Y: [___]     │
│ □ Allerg │    │ Calories  230    │         │               │
│ □ Text   │    │ Total Fat 8g 10% │         │  Size         │
│ □ Line   │    │ ...              │         │  W: [___]     │
│ □ Rect   │    └──────────────────┘         │  H: [___]     │
│          │                                  │               │
│ PRESETS  │    [Ingredients: ...]           │  Font         │
│ ─────────│                                  │  [Dropdown]   │
│ Vertical │                                  │               │
│ Tabular  │                                  │  Show/Hide   │
│ Dual Col │                                  │  ☑ Calories   │
│ Linear   │                                  │  ☑ Total Fat  │
│          │                                  │  ☐ Trans Fat  │
└──────────┴──────────────────────────────────┴───────────────┘
```

### Fabric.js Canvas Setup

```typescript
// hooks/useLabelCanvas.ts
import { fabric } from 'fabric';

export function useLabelCanvas(canvasRef: RefObject<HTMLCanvasElement>) {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  
  useEffect(() => {
    const c = new fabric.Canvas(canvasRef.current, {
      width: 400,
      height: 600,
      backgroundColor: '#ffffff',
    });
    setCanvas(c);
    return () => c.dispose();
  }, []);
  
  const addNutritionBox = (template: NutritionBoxConfig) => {
    // Create nutrition facts group
  };
  
  const addText = (text: string, options: fabric.ITextOptions) => {
    const textObj = new fabric.IText(text, options);
    canvas?.add(textObj);
  };
  
  return { canvas, addNutritionBox, addText, ... };
}
```

### Nutrition Box Rendering

The nutrition box is the most complex element. It should:
1. Auto-layout nutrients based on configuration
2. Calculate % Daily Value
3. Support different formats (standard, simplified, infant, etc.)
4. Render clean lines and typography

```typescript
// components/label-builder/NutritionBoxRenderer.tsx
function renderNutritionBox(
  canvas: fabric.Canvas,
  product: Product,
  config: NutritionBoxConfig
): fabric.Group {
  const elements: fabric.Object[] = [];
  
  // Header
  elements.push(new fabric.Text('Nutrition Facts', {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Arial Black',
  }));
  
  // Serving size
  elements.push(new fabric.Text(
    `Serving size ${product.servingSize}${product.servingUnit}`,
    { fontSize: 12 }
  ));
  
  // Calories (big)
  elements.push(new fabric.Text('Calories', { fontSize: 14, fontWeight: 'bold' }));
  elements.push(new fabric.Text(String(product.calories), { fontSize: 36, fontWeight: 'bold' }));
  
  // Nutrients with lines
  config.nutrients.forEach(nutrient => {
    // Add line, nutrient name, value, %DV
  });
  
  // Create group and position
  return new fabric.Group(elements, { left: 0, top: 0 });
}
```

---

## Phase 4: Label Generation & Export (Week 9-10)

### Export Formats

1. **PNG** - For digital use, web display
2. **PDF** - For print, high resolution
3. **SVG** - For scalable graphics

### Backend Export Service

```python
# services/label_exporter.py

class LabelExporter:
    async def export_png(self, template: Template, product: Product) -> bytes:
        """Render label to PNG using html2image"""
        html = self.render_html(template, product)
        # Use html2image or playwright to capture
        
    async def export_pdf(self, template: Template, product: Product) -> bytes:
        """Render label to PDF using WeasyPrint"""
        html = self.render_html(template, product)
        return weasyprint.HTML(string=html).write_pdf()
        
    async def export_svg(self, template: Template, product: Product) -> str:
        """Generate SVG markup"""
        # Convert template elements to SVG
```

### API Endpoints

```
POST /api/v1/labels/preview
  Body: { template_id, product_id }
  Returns: PNG preview

POST /api/v1/labels/export
  Body: { template_id, product_id, format: 'png'|'pdf'|'svg' }
  Returns: File download
```

---

## Phase 5: Saudi FDA Compliance (Week 11-12)

### Compliance Rules

```python
# services/compliance_checker.py

class SaudiFDACompliance:
    REQUIRED_NUTRIENTS = [
        'calories', 'total_fat', 'saturated_fat', 'trans_fat',
        'cholesterol', 'sodium', 'total_carbs', 'dietary_fiber',
        'total_sugars', 'added_sugars', 'protein',
        'vitamin_d', 'calcium', 'iron', 'potassium'
    ]
    
    ARABIC_REQUIRED = True
    MIN_FONT_SIZE = 6  # points
    
    def validate(self, template: Template, product: Product) -> List[ComplianceError]:
        errors = []
        
        # Check all required nutrients present
        # Check Arabic translation exists
        # Check font sizes meet minimum
        # Check allergen declarations
        
        return errors
```

### Multi-language Support

```typescript
// Label text should support both English and Arabic
interface LabelText {
  en: string;
  ar: string;
}

const NUTRITION_LABELS: Record<string, LabelText> = {
  'nutrition_facts': { en: 'Nutrition Facts', ar: 'القيمة الغذائية' },
  'serving_size': { en: 'Serving Size', ar: 'حجم الحصة' },
  'calories': { en: 'Calories', ar: 'السعرات الحرارية' },
  'total_fat': { en: 'Total Fat', ar: 'إجمالي الدهون' },
  // ... etc
};
```

---

## Phase 6: Polish & Production (Week 13-14)

### Tasks
1. [ ] Add template versioning
2. [ ] Implement undo/redo in label builder
3. [ ] Add template sharing between users
4. [ ] Optimize canvas performance
5. [ ] Add keyboard shortcuts
6. [ ] Mobile-responsive admin panel
7. [ ] Batch export (multiple products, same template)
8. [ ] Print-ready validation (DPI, bleed, etc.)

---

## Database Schema Summary

```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    company_name VARCHAR(255),
    created_at TIMESTAMP
);

-- Ingredients (master list)
CREATE TABLE ingredients (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    name_ar VARCHAR(255),
    calories DECIMAL(10,2),
    total_fat DECIMAL(10,2),
    saturated_fat DECIMAL(10,2),
    trans_fat DECIMAL(10,2),
    cholesterol DECIMAL(10,2),
    sodium DECIMAL(10,2),
    total_carbs DECIMAL(10,2),
    dietary_fiber DECIMAL(10,2),
    total_sugars DECIMAL(10,2),
    added_sugars DECIMAL(10,2),
    protein DECIMAL(10,2),
    vitamin_d DECIMAL(10,4),
    calcium DECIMAL(10,2),
    iron DECIMAL(10,2),
    potassium DECIMAL(10,2),
    per_amount DECIMAL(10,2) DEFAULT 100,
    per_unit VARCHAR(10) DEFAULT 'g',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    name VARCHAR(255),
    name_ar VARCHAR(255),
    description TEXT,
    serving_size DECIMAL(10,2),
    serving_unit VARCHAR(20),
    serving_description VARCHAR(100),
    servings_per_container DECIMAL(10,2),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Product Ingredients
CREATE TABLE product_ingredients (
    id UUID PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    ingredient_id UUID REFERENCES ingredients(id),
    quantity DECIMAL(10,2),
    unit VARCHAR(20),
    display_order INT
);

-- Label Templates
CREATE TABLE templates (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    name VARCHAR(255),
    type VARCHAR(50), -- vertical, tabular, dual-column, linear
    width INT,
    height INT,
    elements JSONB,
    styles JSONB,
    is_preset BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Generated Labels
CREATE TABLE labels (
    id UUID PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    template_id UUID REFERENCES templates(id),
    rendered_data JSONB,
    created_at TIMESTAMP
);

-- Allergens
CREATE TABLE allergens (
    id UUID PRIMARY KEY,
    name VARCHAR(100),
    name_ar VARCHAR(100)
);

-- Product Allergens
CREATE TABLE product_allergens (
    product_id UUID REFERENCES products(id),
    allergen_id UUID REFERENCES allergens(id),
    PRIMARY KEY (product_id, allergen_id)
);
```

---

## Running the Project

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

```env
# Backend (.env)
DATABASE_URL=postgresql://user:pass@localhost:5432/nutrical
SECRET_KEY=your-secret-key
CORS_ORIGINS=http://localhost:5173

# Frontend (.env)
VITE_API_URL=http://localhost:8000/api/v1
```

---

## Key Files to Implement

### Backend Priority
1. `app/main.py` - FastAPI app setup
2. `app/models/` - SQLAlchemy models
3. `app/api/v1/endpoints/products.py` - Product CRUD
4. `app/api/v1/endpoints/templates.py` - Template CRUD
5. `app/services/nutrition_calculator.py` - Auto-calculate nutrition
6. `app/services/label_exporter.py` - PNG/PDF export

### Frontend Priority
1. `src/App.tsx` - Routing setup
2. `src/pages/LabelBuilderPage.tsx` - Main canvas editor
3. `src/components/label-builder/Canvas.tsx` - Fabric.js canvas
4. `src/components/label-builder/ElementPanel.tsx` - Draggable elements
5. `src/components/label-builder/PropertiesPanel.tsx` - Edit selected element
6. `src/components/label-builder/NutritionBox.tsx` - Render nutrition facts

---

## Tips for Vibe Coding

1. **Start with the Label Builder** - It's the core differentiator
2. **Use Fabric.js examples** - Many nutrition label patterns exist
3. **Test with real FDA formats** - Match the PDF examples exactly
4. **Arabic RTL support** - Test early, fix layout issues
5. **Print preview** - Always show actual size preview

Good luck! 🚀

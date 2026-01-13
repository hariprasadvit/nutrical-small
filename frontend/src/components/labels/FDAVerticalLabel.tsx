/**
 * FDA Vertical Label Component (Standard US Format)
 *
 * Features:
 * - Classic FDA Nutrition Facts design
 * - Heavy black borders
 * - Bold typography hierarchy
 * - % Daily Value column
 * - Optional bilingual support
 */

export interface FDANutrientRow {
  key: string;
  name: string;
  nameAr?: string;
  value: number;
  unit: string;
  percentDv?: number;
  indent?: number;
  bold?: boolean;
  showDv?: boolean;
}

export interface FDAVerticalLabelProps {
  title?: string;
  titleAr?: string;
  servingsPerContainer?: number;
  servingSize: number;
  servingUnit: string;
  servingDescription?: string;
  calories: number;
  nutrients: FDANutrientRow[];
  vitaminsAndMinerals?: FDANutrientRow[];
  footnote?: string;
  footnoteAr?: string;
  language?: 'en' | 'ar' | 'bilingual';
  width?: number;
  className?: string;
}

export default function FDAVerticalLabel({
  title = 'Nutrition Facts',
  titleAr = 'الحقائق الغذائية',
  servingsPerContainer,
  servingSize,
  servingUnit,
  servingDescription,
  calories,
  nutrients,
  vitaminsAndMinerals = [],
  footnote = '* The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.',
  footnoteAr,
  language = 'en',
  width = 300,
  className = '',
}: FDAVerticalLabelProps) {
  const showArabic = language === 'ar' || language === 'bilingual';
  const showEnglish = language === 'en' || language === 'bilingual';
  const isBilingual = language === 'bilingual';

  return (
    <div
      className={`bg-white border-2 border-black p-1 font-sans ${className}`}
      style={{ width: `${width}px` }}
    >
      {/* Title */}
      <div className="text-3xl font-black tracking-tight leading-none pb-1">
        {showEnglish && title}
        {isBilingual && ' / '}
        {showArabic && (
          <span className="font-arabic" dir="rtl">
            {titleAr}
          </span>
        )}
      </div>

      {/* Servings */}
      <div className="border-b-8 border-black pb-1 text-sm">
        {servingsPerContainer && (
          <div className="font-bold">
            {servingsPerContainer} servings per container
          </div>
        )}
        <div className="flex justify-between font-bold">
          <span>
            Serving size
            {showArabic && (
              <span className="font-arabic ml-1" dir="rtl">
                / حجم الحصة
              </span>
            )}
          </span>
          <span>
            {servingDescription || `${servingSize}${servingUnit}`}
          </span>
        </div>
      </div>

      {/* Calories */}
      <div className="flex justify-between items-baseline border-b-4 border-black py-1">
        <div>
          <div className="text-sm font-bold">Amount per serving</div>
          <div className="text-3xl font-black">
            Calories
            {showArabic && (
              <span className="font-arabic text-xl ml-2" dir="rtl">
                / سعرات حرارية
              </span>
            )}
          </div>
        </div>
        <div className="text-5xl font-black tabular-nums">
          {Math.round(calories)}
        </div>
      </div>

      {/* % Daily Value Header */}
      <div className="text-right text-xs font-bold border-b border-black py-0.5">
        % Daily Value*
      </div>

      {/* Nutrient Rows */}
      <div>
        {nutrients.map((nutrient) => (
          <div
            key={nutrient.key}
            className={`flex justify-between border-b border-black py-0.5 text-sm ${
              nutrient.bold ? 'font-bold' : ''
            }`}
            style={{
              paddingLeft: nutrient.indent ? `${nutrient.indent * 16}px` : '0',
              borderBottomWidth: nutrient.key === 'protein' ? '8px' : '1px',
            }}
          >
            <span>
              {showEnglish && nutrient.name}
              {isBilingual && nutrient.nameAr && ' / '}
              {showArabic && nutrient.nameAr && (
                <span className="font-arabic" dir="rtl">
                  {nutrient.nameAr}
                </span>
              )}
              {' '}
              <span className="tabular-nums">
                {formatValue(nutrient.value)}{nutrient.unit}
              </span>
            </span>
            {nutrient.showDv !== false && nutrient.percentDv !== undefined && (
              <span className="font-bold tabular-nums">
                {Math.round(nutrient.percentDv)}%
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Vitamins and Minerals */}
      {vitaminsAndMinerals.length > 0 && (
        <div className="border-t-8 border-black">
          {vitaminsAndMinerals.map((nutrient) => (
            <div
              key={nutrient.key}
              className="flex justify-between border-b border-black py-0.5 text-sm"
            >
              <span>
                {showEnglish && nutrient.name}
                {isBilingual && nutrient.nameAr && ' / '}
                {showArabic && nutrient.nameAr && (
                  <span className="font-arabic" dir="rtl">
                    {nutrient.nameAr}
                  </span>
                )}
                {' '}
                <span className="tabular-nums">
                  {formatValue(nutrient.value)}{nutrient.unit}
                </span>
              </span>
              {nutrient.percentDv !== undefined && (
                <span className="tabular-nums">
                  {Math.round(nutrient.percentDv)}%
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footnote */}
      <div className="pt-1 text-[10px] leading-tight">
        {footnote}
        {showArabic && footnoteAr && (
          <div className="font-arabic mt-1" dir="rtl">
            {footnoteAr}
          </div>
        )}
      </div>
    </div>
  );
}

function formatValue(value: number): string {
  if (value === 0) return '0';
  if (value < 0.5) return '<0.5';
  if (value < 1) return '<1';
  if (value >= 100) return Math.round(value).toString();
  if (value >= 10) return Math.round(value).toString();
  return value.toFixed(1);
}

/**
 * FDA Dual Column Label (Per Serving + Per Container)
 */
export function FDADualColumnLabel({
  title = 'Nutrition Facts',
  servingsPerContainer,
  servingSize,
  servingUnit,
  caloriesPerServing,
  caloriesPerContainer,
  nutrients,
  width = 400,
  className = '',
}: {
  title?: string;
  servingsPerContainer: number;
  servingSize: number;
  servingUnit: string;
  caloriesPerServing: number;
  caloriesPerContainer: number;
  nutrients: Array<FDANutrientRow & { valuePerContainer?: number; percentDvPerContainer?: number }>;
  width?: number;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border-2 border-black p-1 font-sans ${className}`}
      style={{ width: `${width}px` }}
    >
      {/* Title */}
      <div className="text-3xl font-black tracking-tight leading-none pb-1">
        {title}
      </div>

      {/* Servings Info */}
      <div className="border-b-8 border-black pb-1 text-sm">
        <div className="font-bold">{servingsPerContainer} servings per container</div>
        <div className="flex justify-between font-bold">
          <span>Serving size</span>
          <span>{servingSize}{servingUnit}</span>
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-3 border-b border-black text-xs font-bold py-1">
        <div>Amount per serving</div>
        <div className="text-center">Per Serving</div>
        <div className="text-center">Per Container</div>
      </div>

      {/* Calories Row */}
      <div className="grid grid-cols-3 border-b-4 border-black py-1 items-center">
        <div className="text-2xl font-black">Calories</div>
        <div className="text-center text-3xl font-black tabular-nums">
          {Math.round(caloriesPerServing)}
        </div>
        <div className="text-center text-3xl font-black tabular-nums">
          {Math.round(caloriesPerContainer)}
        </div>
      </div>

      {/* % DV Headers */}
      <div className="grid grid-cols-3 border-b border-black text-xs py-0.5">
        <div />
        <div className="text-center font-bold">% DV*</div>
        <div className="text-center font-bold">% DV*</div>
      </div>

      {/* Nutrient Rows */}
      {nutrients.map((nutrient) => (
        <div
          key={nutrient.key}
          className={`grid grid-cols-3 border-b border-black py-0.5 text-sm ${
            nutrient.bold ? 'font-bold' : ''
          }`}
          style={{
            paddingLeft: nutrient.indent ? `${nutrient.indent * 16}px` : '0',
          }}
        >
          <div>
            {nutrient.name} {formatValue(nutrient.value)}{nutrient.unit}
          </div>
          <div className="text-center tabular-nums">
            {nutrient.percentDv !== undefined ? `${Math.round(nutrient.percentDv)}%` : '-'}
          </div>
          <div className="text-center tabular-nums">
            {nutrient.percentDvPerContainer !== undefined
              ? `${Math.round(nutrient.percentDvPerContainer)}%`
              : '-'}
          </div>
        </div>
      ))}

      {/* Footnote */}
      <div className="pt-1 text-[10px] leading-tight">
        * The % Daily Value tells you how much a nutrient in a serving of food
        contributes to a daily diet. 2,000 calories a day is used.
      </div>
    </div>
  );
}

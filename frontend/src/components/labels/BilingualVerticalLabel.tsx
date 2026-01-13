/**
 * Bilingual Vertical Label Component (GSO/GCC Style)
 *
 * Features:
 * - English + Arabic side by side
 * - Per 100g and Per Serving columns
 * - Dark header with white text
 * - Proper RTL support for Arabic
 * - Configurable nutrients
 */

import React from 'react';

export interface NutrientRow {
  key: string;
  nameEn: string;
  nameAr?: string;
  valuePer100g: number;
  valuePerServing: number;
  unit: string;
  percentDvPer100g?: number;
  percentDvPerServing?: number;
  indent?: number;
  bold?: boolean;
}

export interface BilingualVerticalLabelProps {
  title?: string;
  titleAr?: string;
  servingSize: number;
  servingUnit: string;
  servingDescription?: string;
  nutrients: NutrientRow[];
  footnote?: string;
  footnoteAr?: string;
  showPer100g?: boolean;
  showPerServing?: boolean;
  showPercentDv?: boolean;
  headerBgColor?: string;
  headerTextColor?: string;
  borderColor?: string;
  className?: string;
}

export default function BilingualVerticalLabel({
  title = 'Nutrition Facts',
  titleAr = 'الحقائق الغذائية',
  servingSize,
  servingUnit,
  nutrients,
  footnote,
  footnoteAr,
  showPer100g = true,
  showPerServing = true,
  showPercentDv = true,
  headerBgColor = '#1a365d',
  headerTextColor = '#ffffff',
  borderColor = '#000000',
  className = '',
}: BilingualVerticalLabelProps) {
  const columns: string[] = [];
  if (showPer100g) columns.push('per100g');
  if (showPerServing) columns.push('perServing');

  return (
    <div
      className={`bg-white border-2 font-sans text-[11px] ${className}`}
      style={{ borderColor }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 text-center"
        style={{ backgroundColor: headerBgColor, color: headerTextColor }}
      >
        <div className="flex justify-between items-center">
          <span className="text-base font-bold">{title}</span>
          <span className="text-base font-bold font-arabic" dir="rtl">
            {titleAr}
          </span>
        </div>
        <div className="flex justify-between text-[10px] mt-1 opacity-90">
          <span>Serving size / حجم الحصة</span>
          <span>({servingSize}{servingUnit})</span>
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid border-b-2" style={{ borderColor, gridTemplateColumns: `1fr ${columns.map(() => 'auto auto').join(' ')}` }}>
        <div className="px-2 py-1 border-r" style={{ borderColor }} />
        {showPer100g && (
          <>
            <div className="px-2 py-1 text-center font-bold border-r text-[10px]" style={{ borderColor }}>
              Per 100g
            </div>
            {showPercentDv && (
              <div className="px-2 py-1 text-center font-bold border-r text-[10px]" style={{ borderColor }}>
                % DV*
              </div>
            )}
          </>
        )}
        {showPerServing && (
          <>
            <div className="px-2 py-1 text-center font-bold border-r text-[10px]" style={{ borderColor }}>
              Per Serve
            </div>
            {showPercentDv && (
              <div className="px-2 py-1 text-center font-bold text-[10px]">
                % DV*
              </div>
            )}
          </>
        )}
      </div>

      {/* Nutrient Rows */}
      <div className="divide-y" style={{ borderColor }}>
        {nutrients.map((nutrient) => (
          <div
            key={nutrient.key}
            className="grid"
            style={{
              gridTemplateColumns: `1fr ${columns.map(() => 'auto auto').join(' ')}`,
              borderColor,
            }}
          >
            {/* Nutrient Name (Bilingual) */}
            <div
              className="px-2 py-1 border-r flex justify-between"
              style={{
                borderColor,
                paddingLeft: nutrient.indent ? `${8 + nutrient.indent * 12}px` : '8px',
              }}
            >
              <span className={nutrient.bold ? 'font-bold' : ''}>
                {nutrient.nameEn} /
              </span>
              <span
                className={`font-arabic ${nutrient.bold ? 'font-bold' : ''}`}
                dir="rtl"
              >
                {nutrient.nameAr || nutrient.nameEn}
              </span>
            </div>

            {/* Per 100g Values */}
            {showPer100g && (
              <>
                <div
                  className="px-2 py-1 text-center border-r tabular-nums"
                  style={{ borderColor, minWidth: '50px' }}
                >
                  {formatValue(nutrient.valuePer100g)}{nutrient.unit}
                </div>
                {showPercentDv && (
                  <div
                    className="px-2 py-1 text-center border-r tabular-nums"
                    style={{ borderColor, minWidth: '40px' }}
                  >
                    {nutrient.percentDvPer100g !== undefined
                      ? `${Math.round(nutrient.percentDvPer100g)}%`
                      : '-'}
                  </div>
                )}
              </>
            )}

            {/* Per Serving Values */}
            {showPerServing && (
              <>
                <div
                  className="px-2 py-1 text-center border-r tabular-nums"
                  style={{ borderColor: showPercentDv ? borderColor : 'transparent', minWidth: '50px' }}
                >
                  {formatValue(nutrient.valuePerServing)}{nutrient.unit}
                </div>
                {showPercentDv && (
                  <div className="px-2 py-1 text-center tabular-nums" style={{ minWidth: '40px' }}>
                    {nutrient.percentDvPerServing !== undefined
                      ? `${Math.round(nutrient.percentDvPerServing)}%`
                      : '-'}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Footnote */}
      {(footnote || footnoteAr) && (
        <div className="px-2 py-2 text-[9px] text-gray-600 border-t" style={{ borderColor }}>
          {footnote && <div>{footnote}</div>}
          {footnoteAr && (
            <div className="font-arabic mt-1" dir="rtl">
              {footnoteAr}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatValue(value: number): string {
  if (value >= 100) return Math.round(value).toString();
  if (value >= 10) return value.toFixed(1);
  return value.toFixed(1);
}

/**
 * Compact Bilingual Label (Linear Format)
 */
export function BilingualLinearLabel({
  nutrients,
  servingSize,
  servingUnit,
  className = '',
}: {
  nutrients: NutrientRow[];
  servingSize: number;
  servingUnit: string;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-black p-2 text-[9px] ${className}`}>
      <div className="flex flex-wrap gap-x-1">
        <span className="font-bold">Nutrition Facts / الحقائق الغذائية</span>
        <span className="font-bold">Serv. Size / حجم الحصة</span>
        <span>({servingSize}{servingUnit}).</span>

        {nutrients.map((n, idx) => (
          <React.Fragment key={n.key}>
            <span className={n.bold ? 'font-bold' : ''}>
              {n.nameEn}
            </span>
            <span className="font-arabic">{n.nameAr}</span>
            <span>{formatValue(n.valuePerServing)}{n.unit}</span>
            {n.percentDvPerServing !== undefined && (
              <span>({Math.round(n.percentDvPerServing)}% DV)</span>
            )}
            {idx < nutrients.length - 1 && <span>,</span>}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-1 text-[8px] text-gray-600">
        * The % Daily Value (DV) tells you how much a nutrient contributes to a daily diet. 2,000 calories a day is used.
      </div>
      <div className="text-[8px] text-gray-600 font-arabic" dir="rtl">
        * تخبرك القيمة اليومية المئوية بمدى مساهمة المغذي في النظام الغذائي اليومي. يُستخدم 2000 سعرة حرارية في اليوم.
      </div>
    </div>
  );
}

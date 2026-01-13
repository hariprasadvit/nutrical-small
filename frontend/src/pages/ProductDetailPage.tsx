import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../services/api';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.get(id!),
    enabled: !!id,
  });

  const { data: nutrition } = useQuery({
    queryKey: ['product-nutrition', id],
    queryFn: () => productsApi.getNutrition(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  if (!product) {
    return <div className="text-center py-12 text-gray-500">Product not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/products"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          {product.name_ar && (
            <p className="text-gray-500">{product.name_ar}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Serving Size</label>
                <p className="font-medium">
                  {product.serving_size} {product.serving_unit}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Serving Description</label>
                <p className="font-medium">{product.serving_description || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Servings per Container</label>
                <p className="font-medium">{product.servings_per_container || '-'}</p>
              </div>
            </div>
          </div>

          {/* Ingredients Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Ingredients</h2>
              <button className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700">
                <Plus size={16} />
                Add Ingredient
              </button>
            </div>
            {product.ingredients && product.ingredients.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-2">Ingredient</th>
                    <th className="pb-2">Quantity</th>
                    <th className="pb-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {product.ingredients.map((ing) => (
                    <tr key={ing.id}>
                      <td className="py-2">{ing.display_name || ing.ingredient_name}</td>
                      <td className="py-2">
                        {ing.quantity} {ing.unit}
                      </td>
                      <td className="py-2">
                        <button className="p-1 hover:bg-red-50 rounded">
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No ingredients added yet
              </p>
            )}
          </div>
        </div>

        {/* Nutrition Preview */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Nutrition Facts Preview
            </h2>
            {nutrition ? (
              <div className="border border-black p-3 font-label text-sm">
                <div className="text-2xl font-black border-b border-black pb-1">
                  Nutrition Facts
                </div>
                <div className="text-xs border-b-8 border-black py-1">
                  Serving size {nutrition.serving_size}{nutrition.serving_unit}
                </div>
                <div className="flex justify-between items-baseline border-b-4 border-black py-1">
                  <span className="font-bold">Calories</span>
                  <span className="text-3xl font-bold">{Math.round(nutrition.calories)}</span>
                </div>
                <div className="text-right text-xs border-b border-black py-1">
                  % Daily Value*
                </div>
                <NutrientRow label="Total Fat" value={nutrition.total_fat} unit="g" dv={nutrition.total_fat_dv} bold />
                <NutrientRow label="Saturated Fat" value={nutrition.saturated_fat} unit="g" dv={nutrition.saturated_fat_dv} indent />
                <NutrientRow label="Trans Fat" value={nutrition.trans_fat} unit="g" indent />
                <NutrientRow label="Cholesterol" value={nutrition.cholesterol} unit="mg" dv={nutrition.cholesterol_dv} bold />
                <NutrientRow label="Sodium" value={nutrition.sodium} unit="mg" dv={nutrition.sodium_dv} bold />
                <NutrientRow label="Total Carbohydrate" value={nutrition.total_carbs} unit="g" dv={nutrition.total_carbs_dv} bold />
                <NutrientRow label="Dietary Fiber" value={nutrition.dietary_fiber} unit="g" dv={nutrition.dietary_fiber_dv} indent />
                <NutrientRow label="Total Sugars" value={nutrition.total_sugars} unit="g" indent />
                <NutrientRow label="Protein" value={nutrition.protein} unit="g" bold />
                <div className="border-t-8 border-black pt-1 space-y-0.5">
                  <NutrientRow label="Vitamin D" value={nutrition.vitamin_d} unit="mcg" dv={nutrition.vitamin_d_dv} />
                  <NutrientRow label="Calcium" value={nutrition.calcium} unit="mg" dv={nutrition.calcium_dv} />
                  <NutrientRow label="Iron" value={nutrition.iron} unit="mg" dv={nutrition.iron_dv} />
                  <NutrientRow label="Potassium" value={nutrition.potassium} unit="mg" dv={nutrition.potassium_dv} />
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Add ingredients to see nutrition
              </p>
            )}
          </div>

          <Link
            to={`/label-builder?product=${product.id}`}
            className="block w-full py-3 bg-primary-500 hover:bg-primary-600 text-white text-center font-medium rounded-lg transition-colors"
          >
            Generate Label
          </Link>
        </div>
      </div>
    </div>
  );
}

function NutrientRow({
  label,
  value,
  unit,
  dv,
  bold,
  indent,
}: {
  label: string;
  value: number;
  unit: string;
  dv?: number;
  bold?: boolean;
  indent?: boolean;
}) {
  return (
    <div
      className={`flex justify-between border-b border-black py-0.5 ${
        indent ? 'pl-4' : ''
      } ${bold ? 'font-bold' : ''}`}
    >
      <span>
        {label} {value.toFixed(1)}{unit}
      </span>
      {dv !== undefined && <span>{Math.round(dv)}%</span>}
    </div>
  );
}

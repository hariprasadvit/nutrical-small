import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ingredientsApi } from '../services/api';
import { Plus, Search, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { IngredientCreate } from '../types';

export default function IngredientsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<IngredientCreate>({
    name: '',
    calories: 0,
    total_fat: 0,
    saturated_fat: 0,
    trans_fat: 0,
    cholesterol: 0,
    sodium: 0,
    total_carbs: 0,
    dietary_fiber: 0,
    total_sugars: 0,
    added_sugars: 0,
    protein: 0,
    vitamin_d: 0,
    calcium: 0,
    iron: 0,
    potassium: 0,
    per_amount: 100,
    per_unit: 'g',
  });

  const { data: ingredients, isLoading } = useQuery({
    queryKey: ['ingredients', search],
    queryFn: () => ingredientsApi.list({ search: search || undefined, limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: ingredientsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      setShowModal(false);
      toast.success('Ingredient added!');
    },
    onError: () => toast.error('Failed to add ingredient'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ingredients Database</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          Add Ingredient
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search ingredients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
      </div>

      {/* Ingredients Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : ingredients && ingredients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ingredients.map((ing) => (
            <div
              key={ing.id}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium text-gray-900">{ing.name}</h3>
                  {ing.name_ar && (
                    <p className="text-sm text-gray-500">{ing.name_ar}</p>
                  )}
                </div>
                {ing.is_verified && (
                  <CheckCircle size={16} className="text-green-500" />
                )}
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">{ing.calories}</span> kcal per{' '}
                  {ing.per_amount}
                  {ing.per_unit}
                </p>
                <div className="flex gap-4 text-xs">
                  <span>Fat: {ing.total_fat}g</span>
                  <span>Carbs: {ing.total_carbs}g</span>
                  <span>Protein: {ing.protein}g</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">No ingredients found</p>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 my-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Add New Ingredient
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="e.g., Chicken breast"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Arabic Name
                  </label>
                  <input
                    type="text"
                    value={form.name_ar || ''}
                    onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Per Amount
                  </label>
                  <input
                    type="number"
                    value={form.per_amount}
                    onChange={(e) =>
                      setForm({ ...form, per_amount: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={form.per_unit}
                    onChange={(e) => setForm({ ...form, per_unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                  >
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calories
                  </label>
                  <input
                    type="number"
                    value={form.calories}
                    onChange={(e) =>
                      setForm({ ...form, calories: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Macronutrients (per {form.per_amount}
                  {form.per_unit})
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { key: 'total_fat', label: 'Total Fat (g)' },
                    { key: 'saturated_fat', label: 'Sat. Fat (g)' },
                    { key: 'trans_fat', label: 'Trans Fat (g)' },
                    { key: 'cholesterol', label: 'Cholesterol (mg)' },
                    { key: 'sodium', label: 'Sodium (mg)' },
                    { key: 'total_carbs', label: 'Total Carbs (g)' },
                    { key: 'dietary_fiber', label: 'Fiber (g)' },
                    { key: 'total_sugars', label: 'Sugars (g)' },
                    { key: 'added_sugars', label: 'Added Sugars (g)' },
                    { key: 'protein', label: 'Protein (g)' },
                    { key: 'vitamin_d', label: 'Vitamin D (mcg)' },
                    { key: 'calcium', label: 'Calcium (mg)' },
                    { key: 'iron', label: 'Iron (mg)' },
                    { key: 'potassium', label: 'Potassium (mg)' },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs text-gray-500 mb-1">
                        {field.label}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={(form as any)[field.key] || 0}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            [field.key]: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Adding...' : 'Add Ingredient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

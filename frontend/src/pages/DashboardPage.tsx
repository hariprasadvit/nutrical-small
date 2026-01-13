import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { productsApi, templatesApi } from '../services/api';
import { Package, FileText, PenTool, Plus } from 'lucide-react';

export default function DashboardPage() {
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.list({ limit: 5 }),
  });

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.list(),
  });

  const stats = [
    {
      label: 'Products',
      value: products?.length || 0,
      icon: Package,
      color: 'bg-blue-500',
      link: '/products',
    },
    {
      label: 'Templates',
      value: templates?.length || 0,
      icon: FileText,
      color: 'bg-green-500',
      link: '/templates',
    },
    {
      label: 'Labels Generated',
      value: 0,
      icon: PenTool,
      color: 'bg-purple-500',
      link: '/label-builder',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          to="/products"
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          New Product
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.link}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}
              >
                <stat.icon className="text-white" size={24} />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/products"
            className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <Package className="text-primary-500" size={32} />
            <span className="text-sm font-medium">Add Product</span>
          </Link>
          <Link
            to="/ingredients"
            className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <Plus className="text-primary-500" size={32} />
            <span className="text-sm font-medium">Add Ingredient</span>
          </Link>
          <Link
            to="/label-builder"
            className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <PenTool className="text-primary-500" size={32} />
            <span className="text-sm font-medium">Create Label</span>
          </Link>
          <Link
            to="/templates"
            className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <FileText className="text-primary-500" size={32} />
            <span className="text-sm font-medium">Browse Templates</span>
          </Link>
        </div>
      </div>

      {/* Recent Products */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Products</h2>
          <Link to="/products" className="text-sm text-primary-600 hover:text-primary-700">
            View all
          </Link>
        </div>
        {products && products.length > 0 ? (
          <div className="space-y-3">
            {products.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500">
                    {product.serving_size} {product.serving_unit} per serving
                  </p>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(product.created_at).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No products yet.{' '}
            <Link to="/products" className="text-primary-600 hover:underline">
              Create your first product
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

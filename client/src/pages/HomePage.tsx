import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Plus,
  FileText,
  Clock,
  Star,
  Search,
  MoreVertical,
  Folder,
  ChefHat,
  LogOut,
  Settings,
  User,
  ChevronDown,
  Copy,
  Trash2,
  Edit,
} from 'lucide-react';

// Mock data for recent labels
const MOCK_LABELS = [
  {
    id: '1',
    name: 'Chocolate Chip Cookies',
    region: 'FDA (USA)',
    lastEdited: '2 hours ago',
    thumbnail: '🍪',
    status: 'published',
  },
  {
    id: '2',
    name: 'Organic Granola',
    region: 'GSO (Saudi)',
    lastEdited: '1 day ago',
    thumbnail: '🥣',
    status: 'draft',
  },
  {
    id: '3',
    name: 'Fresh Orange Juice',
    region: 'EU',
    lastEdited: '3 days ago',
    thumbnail: '🍊',
    status: 'published',
  },
  {
    id: '4',
    name: 'Whole Wheat Bread',
    region: 'UK',
    lastEdited: '1 week ago',
    thumbnail: '🍞',
    status: 'review',
  },
];

const MOCK_TEMPLATES = [
  { id: '1', name: 'FDA Standard Vertical', region: 'USA', icon: '🇺🇸' },
  { id: '2', name: 'GSO Bilingual', region: 'GCC', icon: '🇸🇦' },
  { id: '3', name: 'EU Standard', region: 'Europe', icon: '🇪🇺' },
  { id: '4', name: 'FSSAI Format', region: 'India', icon: '🇮🇳' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'recent' | 'starred' | 'all'>('recent');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateNew = () => {
    navigate('/create');
  };

  const filteredLabels = MOCK_LABELS.filter(label =>
    label.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
                <ChefHat className="text-white" size={22} />
              </div>
              <span className="font-bold text-xl text-gray-900">
                Nutri<span className="text-emerald-600">Cal</span>
              </span>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search labels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-transparent rounded-lg focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />
              </div>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User size={18} className="text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.name || 'User'}
                </span>
                <ChevronDown size={16} className="text-gray-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="font-medium text-gray-900">{user?.name}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                    <Settings size={16} />
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-gray-500 mt-1">
            Create and manage your food labels
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <button
            onClick={handleCreateNew}
            className="p-6 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white text-left transition-all group"
          >
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus size={24} />
            </div>
            <h3 className="font-semibold text-lg">Create New Label</h3>
            <p className="text-emerald-100 text-sm mt-1">Start from scratch or use a template</p>
          </button>

          {MOCK_TEMPLATES.slice(0, 3).map((template) => (
            <button
              key={template.id}
              onClick={handleCreateNew}
              className="p-6 bg-white border border-gray-200 hover:border-emerald-300 hover:shadow-md rounded-xl text-left transition-all group"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform">
                {template.icon}
              </div>
              <h3 className="font-semibold text-gray-900">{template.name}</h3>
              <p className="text-gray-500 text-sm mt-1">{template.region}</p>
            </button>
          ))}
        </div>

        {/* Labels Section */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex gap-1">
              {[
                { id: 'recent', label: 'Recent', icon: Clock },
                { id: 'starred', label: 'Starred', icon: Star },
                { id: 'all', label: 'All Labels', icon: Folder },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Label Grid */}
          <div className="p-6">
            {filteredLabels.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto text-gray-300" size={48} />
                <h3 className="mt-4 text-gray-900 font-medium">No labels found</h3>
                <p className="text-gray-500 text-sm mt-1">
                  {searchQuery ? 'Try a different search term' : 'Create your first label to get started'}
                </p>
                <button
                  onClick={handleCreateNew}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 inline-flex items-center gap-2"
                >
                  <Plus size={18} />
                  Create Label
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredLabels.map((label) => (
                  <div
                    key={label.id}
                    className="group border border-gray-200 rounded-xl overflow-hidden hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => navigate(`/create/${label.id}`)}
                  >
                    {/* Thumbnail */}
                    <div className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-5xl">
                      {label.thumbnail}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{label.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">{label.region}</p>
                        </div>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className="p-1.5 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical size={16} className="text-gray-400" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-400">{label.lastEdited}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            label.status === 'published'
                              ? 'bg-green-100 text-green-700'
                              : label.status === 'draft'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {label.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

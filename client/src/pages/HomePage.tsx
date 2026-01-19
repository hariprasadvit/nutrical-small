import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { templatesApi } from '../services/api';
import type { Template } from '../types';
import NutricalLogo from '../assets/nutrical-logo.svg';
import {
  Plus,
  FileText,
  Clock,
  Star,
  Search,
  MoreVertical,
  Folder,
  LogOut,
  Settings,
  User,
  ChevronDown,
  Copy,
  Trash2,
  Edit,
  Layout,
  Loader2,
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

// Fallback preset templates when API is unavailable
const FALLBACK_PRESETS: Template[] = [
  {
    id: 'preset-fda-vertical',
    name: 'FDA Vertical',
    description: 'Standard FDA nutrition facts label',
    type: 'vertical',
    width: 400,
    height: 600,
    shape: 'rectangle',
    corner_radius: 0,
    language: 'en',
    elements: [],
    styles: { fontFamily: 'Arial', fontSize: 12, borderWidth: 1, borderColor: '#000000', backgroundColor: '#ffffff' },
    nutrition_config: { showCalories: true, showServingSize: true, showDailyValue: true, nutrients: [] },
    display_preferences: { hideIngredients: false, hideAllergens: false, hideBusinessDetails: false, hideSugarAlcohol: false, showAdditionalMicronutrients: false, preferSodiumOverSalt: true, preferCalorieOverJoule: true },
    is_preset: true,
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'preset-gso-bilingual',
    name: 'GSO Bilingual',
    description: 'GCC bilingual label (English/Arabic)',
    type: 'dual-column',
    width: 400,
    height: 600,
    shape: 'rectangle',
    corner_radius: 0,
    language: 'ar',
    elements: [],
    styles: { fontFamily: 'Arial', fontSize: 12, borderWidth: 1, borderColor: '#000000', backgroundColor: '#ffffff' },
    nutrition_config: { showCalories: true, showServingSize: true, showDailyValue: true, nutrients: [] },
    display_preferences: { hideIngredients: false, hideAllergens: false, hideBusinessDetails: false, hideSugarAlcohol: false, showAdditionalMicronutrients: false, preferSodiumOverSalt: true, preferCalorieOverJoule: true },
    is_preset: true,
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'preset-eu-standard',
    name: 'EU Standard',
    description: 'European Union nutrition label',
    type: 'tabular',
    width: 400,
    height: 600,
    shape: 'rectangle',
    corner_radius: 0,
    language: 'en',
    elements: [],
    styles: { fontFamily: 'Arial', fontSize: 12, borderWidth: 1, borderColor: '#000000', backgroundColor: '#ffffff' },
    nutrition_config: { showCalories: true, showServingSize: true, showDailyValue: true, nutrients: [] },
    display_preferences: { hideIngredients: false, hideAllergens: false, hideBusinessDetails: false, hideSugarAlcohol: false, showAdditionalMicronutrients: false, preferSodiumOverSalt: false, preferCalorieOverJoule: false },
    is_preset: true,
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'preset-fssai-india',
    name: 'FSSAI India',
    description: 'Indian FSSAI compliant label',
    type: 'vertical',
    width: 400,
    height: 600,
    shape: 'rectangle',
    corner_radius: 0,
    language: 'en',
    elements: [],
    styles: { fontFamily: 'Arial', fontSize: 12, borderWidth: 1, borderColor: '#000000', backgroundColor: '#ffffff' },
    nutrition_config: { showCalories: true, showServingSize: true, showDailyValue: true, nutrients: [] },
    display_preferences: { hideIngredients: false, hideAllergens: false, hideBusinessDetails: false, hideSugarAlcohol: false, showAdditionalMicronutrients: false, preferSodiumOverSalt: true, preferCalorieOverJoule: true },
    is_preset: true,
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Helper to get flag/icon for template type
const getTemplateIcon = (type: string, language: string): string => {
  if (language === 'ar' || type.toLowerCase().includes('gso')) return '🇸🇦';
  if (type.toLowerCase().includes('eu')) return '🇪🇺';
  if (type.toLowerCase().includes('fssai')) return '🇮🇳';
  if (type.toLowerCase().includes('uk')) return '🇬🇧';
  return '🇺🇸'; // Default to FDA/USA
};

// Helper to get region label for template
const getTemplateRegion = (type: string, language: string): string => {
  if (language === 'ar' || type.toLowerCase().includes('gso')) return 'GCC';
  if (type.toLowerCase().includes('eu')) return 'Europe';
  if (type.toLowerCase().includes('fssai')) return 'India';
  if (type.toLowerCase().includes('uk')) return 'UK';
  return 'USA';
};

export default function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'recent' | 'starred' | 'all'>('recent');

  // Preset templates state
  const [presetTemplates, setPresetTemplates] = useState<Template[]>([]);
  const [presetsLoading, setPresetsLoading] = useState(true);
  const [presetsError, setPresetsError] = useState<string | null>(null);

  // Fetch preset templates from API (with fallback)
  useEffect(() => {
    const fetchPresets = async () => {
      try {
        setPresetsLoading(true);
        const presets = await templatesApi.getPresets();
        // If API returns data, use it; otherwise use fallback
        if (presets && presets.length > 0) {
          setPresetTemplates(presets);
        } else {
          setPresetTemplates(FALLBACK_PRESETS);
        }
        setPresetsError(null);
      } catch (error) {
        console.error('Failed to fetch preset templates, using fallback:', error);
        // Use fallback presets when API fails
        setPresetTemplates(FALLBACK_PRESETS);
        setPresetsError(null); // Don't show error since we have fallback
      } finally {
        setPresetsLoading(false);
      }
    };

    fetchPresets();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateNew = (templateId?: string) => {
    if (templateId) {
      navigate(`/create?template=${templateId}`);
    } else {
      navigate('/create');
    }
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
            <div className="flex items-center gap-2">
              <img src={NutricalLogo} alt="NutriCal" className="h-10" />
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
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-transparent rounded-lg focus:bg-white focus:border-[#e9b03d] focus:ring-2 focus:ring-[#e9b03d]/20 outline-none transition-all"
                />
              </div>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-[#000055]/10 rounded-full flex items-center justify-center">
                  <User size={18} className="text-[#000055]" />
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
            onClick={() => handleCreateNew()}
            className="p-6 bg-[#000055] hover:bg-[#000044] rounded-xl text-white text-left transition-all group"
          >
            <div className="w-12 h-12 bg-[#e9b03d] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus size={24} className="text-[#000055]" />
            </div>
            <h3 className="font-semibold text-lg">Create New Label</h3>
            <p className="text-white/70 text-sm mt-1">Start from scratch or use a template</p>
          </button>

          {presetsLoading ? (
            // Loading skeleton for preset templates
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-6 bg-white border border-gray-200 rounded-xl animate-pulse"
                >
                  <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4" />
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </>
          ) : presetsError ? (
            // Error state
            <div className="col-span-3 p-6 bg-white border border-gray-200 rounded-xl text-center">
              <Layout className="mx-auto text-gray-300 mb-2" size={32} />
              <p className="text-gray-500 text-sm">{presetsError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-[#e9b03d] text-sm hover:underline"
              >
                Retry
              </button>
            </div>
          ) : presetTemplates.length === 0 ? (
            // No presets available
            <div className="col-span-3 p-6 bg-white border border-gray-200 rounded-xl text-center">
              <Layout className="mx-auto text-gray-300 mb-2" size={32} />
              <p className="text-gray-500 text-sm">No preset templates available</p>
            </div>
          ) : (
            // Render preset templates from API
            presetTemplates.slice(0, 3).map((template) => (
              <button
                key={template.id}
                onClick={() => handleCreateNew(template.id)}
                className="p-6 bg-white border border-gray-200 hover:border-[#e9b03d] hover:shadow-md rounded-xl text-left transition-all group"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform">
                  {getTemplateIcon(template.type, template.language)}
                </div>
                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                <p className="text-gray-500 text-sm mt-1">
                  {getTemplateRegion(template.type, template.language)} • {template.type}
                </p>
                <span className="inline-block mt-2 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                  Preset
                </span>
              </button>
            ))
          )}
        </div>

        {/* All Preset Templates Section */}
        {!presetsLoading && presetTemplates.length > 3 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">All Preset Templates</h2>
              <span className="text-sm text-gray-500">{presetTemplates.length} templates</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {presetTemplates.slice(3).map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleCreateNew(template.id)}
                  className="p-4 bg-white border border-gray-200 hover:border-[#e9b03d] hover:shadow-md rounded-xl text-left transition-all group"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-3 text-xl group-hover:scale-110 transition-transform">
                    {getTemplateIcon(template.type, template.language)}
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm truncate">{template.name}</h3>
                  <p className="text-gray-500 text-xs mt-1">
                    {getTemplateRegion(template.type, template.language)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

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
                      ? 'bg-[#e9b03d]/10 text-[#000055]'
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
                  className="mt-4 px-4 py-2 bg-[#000055] text-white rounded-lg hover:bg-[#000044] inline-flex items-center gap-2"
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
                    className="group border border-gray-200 rounded-xl overflow-hidden hover:border-[#e9b03d] hover:shadow-md transition-all cursor-pointer"
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

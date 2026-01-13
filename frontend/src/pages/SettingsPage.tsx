import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [companyInfo, setCompanyInfo] = useState({
    company_name: user?.company_name || '',
    company_name_ar: '',
    address: '',
    phone: '',
    email: user?.email || '',
  });

  const [labelDefaults, setLabelDefaults] = useState({
    default_language: 'en',
    default_template_type: 'vertical',
    show_daily_value: true,
    show_footnote: true,
  });

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement API call
    toast.success('Company info saved!');
  };

  const handleSaveDefaults = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement API call
    toast.success('Label defaults saved!');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Company Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Company Information
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          This information will appear on your nutrition labels.
        </p>

        <form onSubmit={handleSaveCompany} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={companyInfo.company_name}
                onChange={(e) =>
                  setCompanyInfo({ ...companyInfo, company_name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name (Arabic)
              </label>
              <input
                type="text"
                value={companyInfo.company_name_ar}
                onChange={(e) =>
                  setCompanyInfo({ ...companyInfo, company_name_ar: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                dir="rtl"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              value={companyInfo.address}
              onChange={(e) =>
                setCompanyInfo({ ...companyInfo, address: e.target.value })
              }
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={companyInfo.phone}
                onChange={(e) =>
                  setCompanyInfo({ ...companyInfo, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={companyInfo.email}
                onChange={(e) =>
                  setCompanyInfo({ ...companyInfo, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            Save Company Info
          </button>
        </form>
      </div>

      {/* Label Defaults */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Label Defaults
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Default settings for new nutrition labels.
        </p>

        <form onSubmit={handleSaveDefaults} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Language
              </label>
              <select
                value={labelDefaults.default_language}
                onChange={(e) =>
                  setLabelDefaults({
                    ...labelDefaults,
                    default_language: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="en">English</option>
                <option value="ar">Arabic</option>
                <option value="bilingual">Bilingual (EN + AR)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Template Type
              </label>
              <select
                value={labelDefaults.default_template_type}
                onChange={(e) =>
                  setLabelDefaults({
                    ...labelDefaults,
                    default_template_type: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="vertical">Standard Vertical</option>
                <option value="tabular">Tabular</option>
                <option value="dual-column">Dual Column</option>
                <option value="linear">Linear (Small Package)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={labelDefaults.show_daily_value}
                onChange={(e) =>
                  setLabelDefaults({
                    ...labelDefaults,
                    show_daily_value: e.target.checked,
                  })
                }
                className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Show % Daily Value</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={labelDefaults.show_footnote}
                onChange={(e) =>
                  setLabelDefaults({
                    ...labelDefaults,
                    show_footnote: e.target.checked,
                  })
                }
                className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Show DV Footnote</span>
            </label>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            Save Defaults
          </button>
        </form>
      </div>

      {/* Saudi FDA Compliance */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Saudi FDA Compliance
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Ensure your labels meet GCC food labeling regulations.
        </p>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-700">
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">Compliance Mode Active</span>
          </div>
          <p className="text-sm text-green-600 mt-1">
            All templates include mandatory nutrients and Arabic translations.
          </p>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <h4 className="font-medium mb-2">Required Elements:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Bilingual labels (Arabic + English)</li>
            <li>All mandatory nutrients displayed</li>
            <li>Allergen declarations</li>
            <li>Manufacturing/expiry dates</li>
            <li>Barcode/SKU placement</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

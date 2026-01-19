import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Tag, FileCheck, ArrowRight } from 'lucide-react';
import NutricalLogo from '../assets/nutrical-logo.svg';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    businessName: '',
    fullName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Mock login for prototype - accept any credentials
    setTimeout(() => {
      const mockUser = {
        id: '1',
        email: form.email,
        name: form.fullName || 'Food Business Owner',
        company_name: form.businessName || 'My Food Company',
        is_admin: false,
      };
      setAuth(mockUser, 'mock-token-12345');
      toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
      navigate('/');
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#000055] via-[#000044] to-[#000033] p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-xl p-2">
              <img src={NutricalLogo} alt="NutriCal" className="h-10" />
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Create compliant food labels in minutes
          </h2>
          <p className="text-[#e9b03d] text-lg">
            The easiest way for development chefs and food businesses to generate accurate, regulatory-compliant nutrition labels.
          </p>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#e9b03d] rounded-lg flex items-center justify-center flex-shrink-0">
                <Tag className="text-[#000055]" size={20} />
              </div>
              <div>
                <h3 className="text-white font-semibold">Multi-Region Support</h3>
                <p className="text-[#e9b03d]/80 text-sm">FDA, EU, GSO/GCC, UK, FSSAI - all formats supported</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#e9b03d] rounded-lg flex items-center justify-center flex-shrink-0">
                <FileCheck className="text-[#000055]" size={20} />
              </div>
              <div>
                <h3 className="text-white font-semibold">Automatic Compliance</h3>
                <p className="text-[#e9b03d]/80 text-sm">Always up-to-date with latest regulations</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-[#e9b03d]/80 text-sm">
          Trusted by 500+ food businesses in the GCC region
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img src={NutricalLogo} alt="NutriCal" className="h-12 mx-auto" />
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                {isLogin ? 'Welcome back' : 'Get started'}
              </h2>
              <p className="text-gray-500 mt-2">
                {isLogin
                  ? 'Sign in to continue creating labels'
                  : 'Create your account to start making labels'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required={!isLogin}
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none transition-all"
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={form.businessName}
                      onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none transition-all"
                      placeholder="My Bakery LLC"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none transition-all"
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#e9b03d] focus:border-[#e9b03d] outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-[#000055] focus:ring-[#e9b03d]" />
                    <span className="text-gray-600">Remember me</span>
                  </label>
                  <a href="#" className="text-[#000055] hover:text-[#e9b03d] font-medium">
                    Forgot password?
                  </a>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#000055] hover:bg-[#000044] text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Please wait...
                  </span>
                ) : (
                  <>
                    {isLogin ? 'Sign in' : 'Create account'}
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-gray-500 text-sm">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
              </span>
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-[#000055] hover:text-[#e9b03d] font-semibold text-sm"
              >
                {isLogin ? 'Sign up free' : 'Sign in'}
              </button>
            </div>
          </div>

          <p className="text-center text-gray-400 text-xs mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/common/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import IngredientsPage from './pages/IngredientsPage';
import TemplatesPage from './pages/TemplatesPage';
import LabelBuilderPage from './pages/LabelBuilderPage';
import NutritionLabelPage from './pages/NutritionLabelPage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="ingredients" element={<IngredientsPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="label-builder" element={<LabelBuilderPage />} />
          <Route path="label-builder/:templateId" element={<LabelBuilderPage />} />
          <Route path="nutrition-label" element={<NutritionLabelPage />} />
          <Route path="nutrition-label/:productId" element={<NutritionLabelPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

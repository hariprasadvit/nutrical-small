import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import type {
  AuthToken,
  User,
  Product,
  ProductCreate,
  Ingredient,
  IngredientCreate,
  Template,
  TemplateCreate,
  Label,
  LabelExportRequest,
  Allergen,
  NutritionSummary,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============== Auth ==============

export const authApi = {
  login: async (email: string, password: string): Promise<AuthToken> => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  register: async (data: { email: string; password: string; company_name?: string }): Promise<User> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  getMe: async (token?: string): Promise<User> => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const response = await api.get('/auth/me', config);
    return response.data;
  },
};

// ============== Products ==============

export const productsApi = {
  list: async (params?: { skip?: number; limit?: number; search?: string }): Promise<Product[]> => {
    const response = await api.get('/products', { params });
    return response.data;
  },
  
  get: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  
  create: async (data: ProductCreate): Promise<Product> => {
    const response = await api.post('/products', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<ProductCreate>): Promise<Product> => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
  
  getNutrition: async (id: string): Promise<NutritionSummary> => {
    const response = await api.get(`/products/${id}/nutrition`);
    return response.data;
  },
  
  addIngredient: async (
    productId: string,
    data: { ingredient_id: string; quantity: number; unit: string }
  ): Promise<void> => {
    await api.post(`/products/${productId}/ingredients`, data);
  },
  
  removeIngredient: async (productId: string, ingredientId: string): Promise<void> => {
    await api.delete(`/products/${productId}/ingredients/${ingredientId}`);
  },
};

// ============== Ingredients ==============

export const ingredientsApi = {
  list: async (params?: { skip?: number; limit?: number; search?: string; category?: string }): Promise<Ingredient[]> => {
    const response = await api.get('/ingredients', { params });
    return response.data;
  },
  
  get: async (id: string): Promise<Ingredient> => {
    const response = await api.get(`/ingredients/${id}`);
    return response.data;
  },
  
  create: async (data: IngredientCreate): Promise<Ingredient> => {
    const response = await api.post('/ingredients', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<IngredientCreate>): Promise<Ingredient> => {
    const response = await api.put(`/ingredients/${id}`, data);
    return response.data;
  },
};

// ============== Templates ==============

export const templatesApi = {
  list: async (params?: { type?: string; include_presets?: boolean }): Promise<Template[]> => {
    const response = await api.get('/templates', { params });
    return response.data;
  },
  
  getPresets: async (type?: string): Promise<Template[]> => {
    const response = await api.get('/templates/presets', { params: { type } });
    return response.data;
  },
  
  get: async (id: string): Promise<Template> => {
    const response = await api.get(`/templates/${id}`);
    return response.data;
  },
  
  create: async (data: TemplateCreate): Promise<Template> => {
    const response = await api.post('/templates', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<TemplateCreate>): Promise<Template> => {
    const response = await api.put(`/templates/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/templates/${id}`);
  },
  
  duplicate: async (id: string): Promise<Template> => {
    const response = await api.post(`/templates/${id}/duplicate`);
    return response.data;
  },
};

// ============== Labels ==============

export const labelsApi = {
  list: async (productId?: string): Promise<Label[]> => {
    const response = await api.get('/labels', { params: { product_id: productId } });
    return response.data;
  },
  
  preview: async (data: LabelExportRequest): Promise<string> => {
    const response = await api.post('/labels/preview', data, {
      responseType: 'text',
    });
    return response.data;
  },
  
  export: async (data: LabelExportRequest): Promise<Blob> => {
    const response = await api.post('/labels/export', data, {
      responseType: 'blob',
    });
    return response.data;
  },
  
  create: async (data: { product_id: string; template_id: string; name?: string }): Promise<Label> => {
    const response = await api.post('/labels', data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/labels/${id}`);
  },
};

// ============== Allergens ==============

export const allergensApi = {
  list: async (majorOnly?: boolean): Promise<Allergen[]> => {
    const response = await api.get('/allergens', { params: { major_only: majorOnly } });
    return response.data;
  },
};

export default api;

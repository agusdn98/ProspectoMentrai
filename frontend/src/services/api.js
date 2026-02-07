import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      const isAuthRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

      if (!isAuthRequest) {
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============ AUTH API ============

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  updatePassword: (data) => api.post('/auth/update-password', data),
  logout: () => api.post('/auth/logout'),
};

// ============ COMPANIES API ============

export const companiesApi = {
  getAll: (params) => api.get('/companies', { params }),
  getById: (id) => api.get(`/companies/${id}`),
  create: (data) => api.post('/companies', data),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id) => api.delete(`/companies/${id}`),
  enrich: (id) => api.post(`/companies/${id}/enrich`),
};

// ============ LISTS API ============

export const listsApi = {
  getAll: () => api.get('/lists'),
  getById: (id) => api.get(`/lists/${id}`),
  create: (data) => api.post('/lists', data),
  update: (id, data) => api.put(`/lists/${id}`, data),
  delete: (id) => api.delete(`/lists/${id}`),
  addCompanies: (id, companyIds) => api.post(`/lists/${id}/companies`, { companyIds }),
  removeCompanies: (id, companyIds) => api.delete(`/lists/${id}/companies`, { data: { companyIds } }),
  addContacts: (id, contactIds) => api.post(`/lists/${id}/contacts`, { contactIds }),
};

// ============ PROSPECTING API (Apollo Integration) ============

export const prospectingApi = {
  searchCompanies: (criteria) => api.post('/prospecting/search/companies', criteria),
  searchOpenWebCompanies: (criteria) => api.post('/prospecting/search/open-web', criteria),
  searchContacts: (criteria) => api.post('/prospecting/search/contacts', criteria),
  addCompany: (data) => api.post('/prospecting/companies', data),
  getCompanyContacts: (companyId, params) => api.get(`/prospecting/companies/${companyId}/contacts`, { params }),
  enrichContact: (contactId) => api.post(`/prospecting/contacts/${contactId}/enrich`),
};

export default api;

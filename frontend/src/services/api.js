import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Data endpoints
  async getPricingData(filters) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    
    const response = await apiClient.get(`/data/pricing-data?${params}`);
    return response.data;
  },

  async getStates() {
    const response = await apiClient.get('/data/states');
    return response.data;
  },

  async getCounties(state) {
    const response = await apiClient.get(`/data/counties/${state}`);
    return response.data;
  },

  async getZipCodes(county) {
    const response = await apiClient.get(`/data/zipcodes/${county}`);
    return response.data;
  },

  // Saved searches endpoints
  async getSavedSearches() {
    const response = await apiClient.get('/searches');
    return response.data.data || [];
  },

  async saveSearch(searchData) {
    const response = await apiClient.post('/searches', searchData);
    return response.data;
  },

  async deleteSavedSearch(searchId) {
    const response = await apiClient.delete(`/searches/${searchId}`);
    return response.data;
  },
};


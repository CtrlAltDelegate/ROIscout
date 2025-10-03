import axios from 'axios';

// Ensure API_BASE_URL always ends with /api
const baseUrl = process.env.REACT_APP_API_URL || 'https://roiscout-production.up.railway.app';
const API_BASE_URL = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

// Debug logging
console.log('🔍 Auth Service Debug:');
console.log('  REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('  baseUrl:', baseUrl);
console.log('  Final API_BASE_URL:', API_BASE_URL);

const authClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authService = {
  async signup(userData) {
    const response = await authClient.post('/auth/signup', userData);
    return response.data;
  },

  async login(credentials) {
    const response = await authClient.post('/auth/login', credentials);
    return response.data;
  },

  async googleLogin(token) {
    const response = await authClient.post('/auth/google', { token });
    return response.data;
  },

  async verifyToken() {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }

    const response = await authClient.get('/auth/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.user;
  },

  logout() {
    localStorage.removeItem('token');
  },
};

import axios from 'axios';

// Ensure API_BASE_URL always has protocol and ends with /api
let baseUrl = process.env.REACT_APP_API_URL || 'https://roiscout-production.up.railway.app';

// Add https:// if missing
if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
  baseUrl = `https://${baseUrl}`;
}

const API_BASE_URL = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

// Debug logging (remove in production)
// console.log('🔍 Auth Service Debug:', { REACT_APP_API_URL: process.env.REACT_APP_API_URL, baseUrl, API_BASE_URL });

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

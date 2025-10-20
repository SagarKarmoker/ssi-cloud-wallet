import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth tokens
api.interceptors.request.use((config) => {
  const walletToken = localStorage.getItem('walletToken');
  if (walletToken) {
    config.headers.Authorization = `Bearer ${walletToken}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - remove token and redirect to login
      localStorage.removeItem('walletToken');
      localStorage.removeItem('currentWallet');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized - only redirect if user is already logged in
      // Don't redirect on login/register pages or password change (they handle their own errors)
      if (error.response.status === 401) {
        const token = localStorage.getItem('token');
        const isAuthEndpoint = error.config.url.includes('/auth/login') ||
                               error.config.url.includes('/auth/register') ||
                               error.config.url.includes('/auth/password') ||
                               error.config.url.includes('/auth/forgot-password') ||
                               error.config.url.includes('/auth/reset-password');

        // Only redirect if there was a token (user was logged in) and it's not an auth endpoint
        if (token && !isAuthEndpoint) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }

      // Handle other error responses
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Request made but no response received
      console.error('No response received:', error.request);
    } else {
      // Error setting up the request
      console.error('Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;

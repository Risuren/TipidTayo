import axios from 'axios';

// Detect whether the user opened the app via 'localhost' or '127.0.0.1'
const host = window.location.hostname === '127.0.0.1' ? '127.0.0.1' : 'localhost';
const backendBase = `http://${host}:8000`;

const api = axios.create({
  baseURL: `${backendBase}/api`,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Bearer token if stored (dual cookie + token support)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tipidtayo_token') || sessionStorage.getItem('tipidtayo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('tipidtayo_token');
      sessionStorage.removeItem('tipidtayo_token');
    }
    return Promise.reject(error);
  }
);

export const getCsrfCookie = async () => {
  try {
    await axios.get(`${backendBase}/sanctum/csrf-cookie`, {
      withCredentials: true,
    });
  } catch (err) {
    console.warn('Failed to fetch CSRF cookie (token fallback active):', err);
  }
};

export default api;

import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api',
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach token to every request and handle FormData
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  
  // If we are uploading a file via FormData, delete the global Content-Type 
  // so the browser automatically sets 'multipart/form-data; boundary=...'
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  
  return config;
});

// Auto-refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const err = error as {
      config?: { _retry?: boolean; headers: Record<string, string> };
      response?: { status?: number };
    };
    const original = err.config;
    if (err.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}/auth/refresh`,
          { refreshToken }
        );
        const { accessToken, refreshToken: newRefresh } = res.data.data as {
          accessToken: string;
          refreshToken: string;
        };
        
        // Sync Zustand store
        const user = useAuthStore.getState().user;
        if (user) {
          useAuthStore.getState().setAuth(user, accessToken, newRefresh);
        } else {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefresh);
        }
        
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        // Sync logout to Zustand store
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
import axios from 'axios';
import useAppStore from '../store/useAppStore';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = useAppStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      useAppStore.getState().logout();
    }
    const message = error.response?.data?.error || error.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

// Auth
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Incidents
export const incidentsApi = {
  getNearby: (params) => api.get('/incidents/nearby', { params }),
  getAll: (params) => api.get('/incidents', { params }),
  getById: (id) => api.get(`/incidents/${id}`),
  create: (data) => api.post('/incidents', data),
  vote: (id, voteType) => api.post(`/incidents/${id}/vote`, { voteType }),
  delete: (id) => api.delete(`/incidents/${id}`),
  getAnalytics: (params) => api.get('/incidents/analytics', { params }),
};

// Users
export const usersApi = {
  me: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  updateLocation: (data) => api.post('/users/me/location', data),
  getLeaderboard: () => api.get('/users/leaderboard'),
  getProfile: (id) => api.get(`/users/${id}`),
  sendSOS: (data) => api.post('/users/sos', data),
};

// Media
export const mediaApi = {
  upload: (formData) => api.post('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// Prediction / AI
export const predictionApi = {
  getRisk:    (params) => api.get('/prediction/risk', { params }),
  getZone:    (params) => api.get('/prediction/zone', { params }),
  ask:        (data)   => api.post('/prediction/ask', data),
};

export default api;

import axios from 'axios';
import useAppStore from '../store/useAppStore';
  
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CALLING_AGENT_BASE = import.meta.env.VITE_CALLING_AGENT_URL || 'http://localhost:8000';

const callingAgentApi = axios.create({
  baseURL: `${CALLING_AGENT_BASE}/api/v1`,
});

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
  (error) => Promise.reject(error)
);

// Auth
export const authApi = {
  sendVerification: (data) => api.post('/auth/send-verification', data),
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
  confirm: (id) => api.post(`/incidents/${id}/confirm`),
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
  sendSOS: async (data) => {
    // 1. Existing backend API logic
    const backendRes = await api.post('/users/sos', data);
    
    // 2. Triggering FastAPI Calling Agent API (only if contacts exist)
    const contacts = data.emergency_contacts || [];
    if (contacts.length > 0) {
      try {
        await callingAgentApi.post('/sos_call', data);
      } catch (err) {
        console.error('Failed to trigger voice call agent:', err);
      }
    }
    
    return backendRes;
  },
};

// Media
export const mediaApi = {
  upload: (formData) => api.post('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// News
export const newsApi = {
  get: (params) => api.get('/news', { params }),
};

// Location sharing
export const shareApi = {
  create: (data) => api.post('/users/share-location', data),
  get: (token) => api.get(`/users/share-location/${token}`),
  update: (token, data) => api.put(`/users/share-location/${token}`, data),
  stop: (token) => api.delete(`/users/share-location/${token}`),
};

// Prediction / AI
export const predictionApi = {
  getRisk:    (params) => api.get('/prediction/risk', { params }),
  getZone:    (params) => api.get('/prediction/zone', { params }),
  ask:        (data)   => api.post('/prediction/ask', data),
};

export const sendSOS = async (sosData) => {
  try {
    const response = await callingAgentApi.post('/sos_call', sosData);
    return response.data;
  } catch (error) {
    console.error('Error sending SOS:', error);
    throw error;
  }
};

export default api;

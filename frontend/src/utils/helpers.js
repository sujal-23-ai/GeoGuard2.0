import { formatDistanceToNow } from 'date-fns';
import { INCIDENT_CATEGORIES, SEVERITY_COLORS, SEVERITY_LABELS } from './constants';

export const getCategory = (id) => INCIDENT_CATEGORIES.find((c) => c.id === id);

export const getSeverityColor = (severity) => SEVERITY_COLORS[severity] || SEVERITY_COLORS[3];
export const getSeverityLabel = (severity) => SEVERITY_LABELS[severity] || 'Unknown';

export const timeAgo = (date) => {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return 'recently';
  }
};

export const truncate = (str, len = 80) =>
  str && str.length > len ? str.slice(0, len) + '...' : str;

export const formatDistance = (meters) => {
  if (!meters) return '';
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
};

export const getRiskScore = (incidents) => {
  if (!incidents?.length) return 0;
  const weights = { 5: 1, 4: 0.8, 3: 0.5, 2: 0.3, 1: 0.1 };
  const score = incidents.slice(0, 20).reduce((acc, i) => acc + (weights[i.severity] || 0.3), 0);
  return Math.min(100, Math.round((score / 20) * 100));
};

export const debounce = (fn, ms) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};

export const getIncidentMarkerSize = (severity) => {
  const sizes = { 1: 24, 2: 28, 3: 32, 4: 38, 5: 44 };
  return sizes[severity] || 32;
};

export const groupIncidentsByCategory = (incidents) =>
  incidents.reduce((acc, i) => {
    if (!acc[i.category]) acc[i.category] = [];
    acc[i.category].push(i);
    return acc;
  }, {});

export const colorFromString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 60%)`;
};

export const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

export const getOptimizedUrl = (url, options = {}) => {
  if (!url) return '';
  if (!url.includes('cloudinary.com')) return url;
  const { width = 800, quality = 'auto', format = 'auto' } = options;
  return url.replace('/upload/', `/upload/w_${width},q_${quality},f_${format}/`);
};

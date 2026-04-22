import { io } from 'socket.io-client';
import useAppStore from '../store/useAppStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const initSocket = () => {
  if (socket?.connected) return socket;

  const token = useAppStore.getState().token;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  const store = useAppStore.getState();

  socket.on('connect', () => {
    store.setSocketConnected(true);
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', () => {
    store.setSocketConnected(false);
  });

  socket.on('new_incident', (incident) => {
    store.addLiveIncident(incident);
    store.addNotification({
      type: 'incident',
      title: 'New Incident',
      message: `${incident.category}: ${incident.title}`,
      severity: incident.severity,
    });
  });

  socket.on('update_incident', (update) => {
    store.updateLiveIncident(update);
  });

  socket.on('sos_alert', (alert) => {
    store.addNotification({
      type: 'sos',
      title: '🚨 SOS Alert',
      message: `${alert.userName} needs help!`,
      severity: 5,
      data: alert,
    });
  });

  socket.on('user_count', (count) => {
    store.setConnectedUsers(count);
  });

  socket.on('connect_error', (err) => {
    console.warn('Socket connection error:', err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const joinArea = (lng, lat, radius = 10) => {
  socket?.emit('join_area', { lng, lat, radius });
};

export const updateLocation = (lng, lat) => {
  socket?.emit('update_location', { lng, lat });
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export default { initSocket, getSocket, joinArea, updateLocation, disconnectSocket };

import { useEffect } from 'react';
import { initSocket, getSocket, joinArea } from '../services/socket';
import useAppStore from '../store/useAppStore';
import useSoundAlerts from './useSoundAlerts';

export const useSocket = () => {
  const { userLocation, isAuthenticated, addNotification, addLiveIncident, updateLiveIncident,
          setSocketConnected, setConnectedUsers, liveMode } = useAppStore();
  const { playNewIncident, playHighRisk, playSosAlert, playDangerZone } = useSoundAlerts();

  // Initial socket setup + event wiring
  useEffect(() => {
    const socket = initSocket();

    socket.on('connect',    () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('user_count', (n) => setConnectedUsers(n));

    socket.on('new_incident', (incident) => {
      addLiveIncident(incident);
      if (incident.severity >= 4) {
        playHighRisk();
        addNotification({
          type: 'incident',
          title: `High-Risk: ${incident.title}`,
          message: `Severity ${incident.severity} — ${incident.city || 'Unknown'}`,
        });
      } else {
        playNewIncident();
      }
    });

    socket.on('update_incident', (update) => {
      updateLiveIncident(update);
    });

    socket.on('sos_alert', () => {
      playSosAlert();
      addNotification({
        type: 'sos',
        title: '🚨 SOS Alert Nearby',
        message: 'A community member needs emergency help.',
      });
    });

    socket.on('danger_zone_alert', (data) => {
      playDangerZone();
      addNotification({
        type: 'danger_zone',
        title: `⚠️ Danger Zone — ${data.distanceM}m away`,
        message: data.message || data.title,
      });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('user_count');
      socket.off('new_incident');
      socket.off('update_incident');
      socket.off('sos_alert');
      socket.off('danger_zone_alert');
    };
  }, [isAuthenticated]);

  // Join area room when location changes + send location for danger alerts
  useEffect(() => {
    if (!userLocation) return;
    joinArea(userLocation.lng, userLocation.lat);
    
    // Send location to backend for danger zone checks
    const socket = getSocket();
    if (socket) {
      socket.emit('update_location', { lng: userLocation.lng, lat: userLocation.lat });
    }
  }, [userLocation]);

  // Live mode: opt in/out of high-frequency updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    if (liveMode) socket.emit('enable_live_mode');
    else          socket.emit('disable_live_mode');
  }, [liveMode]);

  return getSocket();
};

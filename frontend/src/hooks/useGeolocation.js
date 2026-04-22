import { useState, useEffect, useCallback } from 'react';
import useAppStore from '../store/useAppStore';

export const useGeolocation = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const setUserLocation = useAppStore((s) => s.setUserLocation);
  const setViewport = useAppStore((s) => s.setViewport);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const location = { lng: coords.longitude, lat: coords.latitude };
        setUserLocation(location);
        setViewport({ ...location, zoom: 13 });
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [setUserLocation, setViewport]);

  useEffect(() => {
    locate();
  }, [locate]);

  return { locate, error, loading };
};

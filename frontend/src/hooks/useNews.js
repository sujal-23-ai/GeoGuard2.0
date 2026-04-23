import { useQuery } from '@tanstack/react-query';
import { newsApi } from '../services/api';
import useAppStore from '../store/useAppStore';

export const useNews = (city = 'your area') => {
  const { userLocation } = useAppStore();
  const isDefaultArea = city === 'your area' || city === 'local area';
  const hasLocation = !!userLocation?.lat && !!userLocation?.lng;

  return useQuery({
    queryKey: ['news', city, userLocation?.lat, userLocation?.lng],
    queryFn: () => newsApi.get({ city, lat: userLocation?.lat, lng: userLocation?.lng }),
    staleTime: 1000 * 60 * 15,
    retry: 1,
    enabled: !isDefaultArea || hasLocation, // Wait for location if default area is selected
  });
};

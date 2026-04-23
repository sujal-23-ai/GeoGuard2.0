import { useQuery } from '@tanstack/react-query';
import { newsApi } from '../services/api';
import useAppStore from '../store/useAppStore';

export const useNews = (city = 'your area') => {
  const { userLocation } = useAppStore();
  return useQuery({
    queryKey: ['news', city],
    queryFn: () => newsApi.get({ city, lat: userLocation?.lat, lng: userLocation?.lng }),
    staleTime: 1000 * 60 * 15,
    retry: 1,
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentsApi } from '../services/api';
import useAppStore from '../store/useAppStore';
import { DEMO_INCIDENTS } from '../utils/constants';

export const useNearbyIncidents = () => {
  const { userLocation, filters } = useAppStore();
  const setLiveIncidents = useAppStore((s) => s.setLiveIncidents);

  return useQuery({
    queryKey: ['incidents', 'nearby', userLocation, filters],
    queryFn: async () => {
      if (!userLocation) return DEMO_INCIDENTS;
      try {
        const result = await incidentsApi.getNearby({
          lng: userLocation.lng,
          lat: userLocation.lat,
          radius: filters.radius,
          ...(filters.category && { category: filters.category }),
          ...(filters.severity && { severity: filters.severity }),
          ...(filters.since && { since: filters.since === 'all' ? 'all' : new Date(Date.now() - filters.since).toISOString() }),
        });
        const incidents = result.incidents || [];
        setLiveIncidents(incidents);
        return incidents;
      } catch {
        setLiveIncidents(DEMO_INCIDENTS);
        return DEMO_INCIDENTS;
      }
    },
    refetchInterval: 30000,
    staleTime: 15000,
    placeholderData: DEMO_INCIDENTS,
  });
};

export const useCreateIncident = () => {
  const queryClient = useQueryClient();
  const addLiveIncident = useAppStore((s) => s.addLiveIncident);

  return useMutation({
    mutationFn: incidentsApi.create,
    onSuccess: (data) => {
      addLiveIncident(data.incident);
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
};

export const useVoteIncident = () => {
  const queryClient = useQueryClient();
  const updateLiveIncident = useAppStore((s) => s.updateLiveIncident);
  return useMutation({
    mutationFn: ({ id, voteType }) => incidentsApi.vote(id, voteType),
    onMutate: async ({ id, voteType }) => {
      // Optimistic update in Zustand store
      const incident = useAppStore.getState().liveIncidents.find(i => (i.id || i._id) === id);
      if (incident) {
        const upDelta = voteType === 'up' ? 1 : 0;
        const downDelta = voteType === 'down' ? 1 : 0;
        updateLiveIncident({
          id,
          upvotes: (incident.upvotes || 0) + upDelta,
          downvotes: (incident.downvotes || 0) + downDelta,
          _userVote: voteType,
        });
      }
    },
    onSuccess: (data, { id }) => {
      // Reconcile with server truth
      updateLiveIncident({ id, upvotes: data.upvotes, downvotes: data.downvotes });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
};

export const useConfirmIncident = () => {
  const updateLiveIncident = useAppStore((s) => s.updateLiveIncident);
  return useMutation({
    mutationFn: (id) => incidentsApi.confirm(id),
    onSuccess: (data, id) => {
      updateLiveIncident({ id, confirmCount: data.confirmCount });
    },
  });
};

export const useAnalytics = (days = 7) =>
  useQuery({
    queryKey: ['analytics', days],
    queryFn: () => incidentsApi.getAnalytics({ days }),
    staleTime: 1000 * 60 * 5,
  });

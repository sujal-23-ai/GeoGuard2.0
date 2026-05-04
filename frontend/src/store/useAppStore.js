import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAppStore = create(
  persist(
    (set) => ({
      // Theme
      theme: 'dark',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      // View
      view: 'landing', // 'landing', 'app', 'share'
      setView: (view) => set({ view }),

      // Auth
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      updateUser: (updates) => set((s) => ({ user: { ...s.user, ...updates } })),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),

      // Map state
      viewport: { lng: -74.006, lat: 40.7128, zoom: 12 },
      setViewport: (viewport) => set({ viewport }),
      selectedIncident: null,
      setSelectedIncident: (incident) => set({ selectedIncident: incident }),
      showHeatmap: false,
      toggleHeatmap: () => set((s) => ({ showHeatmap: !s.showHeatmap })),
      showSatellite: false,
      toggleSatellite: () => set((s) => ({ showSatellite: !s.showSatellite })),
      showSafeZones: false,
      toggleSafeZones: () => set((s) => ({ showSafeZones: !s.showSafeZones })),

      // Filters
      filters: { category: null, severity: null, radius: 10, since: null },
      setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),
      clearFilters: () => set({ filters: { category: null, severity: null, radius: 10, since: null } }),

      // Live mode
      liveMode: false,
      toggleLiveMode: () => set((s) => ({ liveMode: !s.liveMode })),

      // AI assistant panel
      aiAssistantOpen: false,
      setAiAssistantOpen: (open) => set({ aiAssistantOpen: open }),

      // UI panels
      reportPanelOpen: false,
      setReportPanelOpen: (open) => set({ reportPanelOpen: open }),
      analyticsPanelOpen: false,
      setAnalyticsPanelOpen: (open) => set({ analyticsPanelOpen: open }),
      routingPanelOpen: false,
      setRoutingPanelOpen: (open) => set({ routingPanelOpen: open }),
      adminPanelOpen: false,
      setAdminPanelOpen: (open) => set({ adminPanelOpen: open }),
      settingsPanelOpen: false,
      setSettingsPanelOpen: (open) => set({ settingsPanelOpen: open }),
      leaderboardOpen: false,
      setLeaderboardOpen: (open) => set({ leaderboardOpen: open }),
      sosActive: false,
      setSosActive: (active) => set({ sosActive: active }),

      // News panel
      newsPanelOpen: false,
      setNewsPanelOpen: (open) => set({ newsPanelOpen: open }),

      // Location sharing
      shareActive: false,
      shareToken: null,
      shareExpiry: null,
      setShareSession: (token, expiry) => set({ shareActive: true, shareToken: token, shareExpiry: expiry }),
      stopShare: () => set({ shareActive: false, shareToken: null, shareExpiry: null }),

      // Menu state (used by LandingPage to open specific tab)
      menuOpen: false,
      setMenuOpen: (open) => set({ menuOpen: open }),
      menuInitialTab: 'menu',
      setMenuInitialTab: (tab) => set({ menuInitialTab: tab }),

      // User location
      userLocation: null,
      setUserLocation: (location) => set({ userLocation: location }),

      // Report map pick state
      pickingLocation: false,
      setPickingLocation: (picking) => set({ pickingLocation: picking }),
      reportLocation: null,
      setReportLocation: (loc) => set({ reportLocation: loc }),

      // Map focus control
      mapFocus: null,
      setMapFocus: (focus) => set({ mapFocus: focus }),

      // Incidents (real-time)
      liveIncidents: [],
      recentlyCreated: [],   // incidents created by THIS user — survive refetches
      addLiveIncident: (incident) =>
        set((s) => {
          const newId = incident.id || incident._id;
          const isDupe = (i) => {
            const iid = i.id || i._id;
            return iid && newId && iid === newId;
          };
          return {
            liveIncidents: [incident, ...s.liveIncidents.filter((i) => !isDupe(i))].slice(0, 200),
            recentlyCreated: [{ ...incident, _createdAt: Date.now() }, ...s.recentlyCreated.filter((i) => !isDupe(i))],
          };
        }),
      updateLiveIncident: (update) =>
        set((s) => {
          const matchId = (i) => i && ((i.id && i.id === update.id) || (i._id && i._id === update.id));
          
          if (update.deleted || update.isActive === false) {
            return {
              liveIncidents: s.liveIncidents.filter((i) => !matchId(i)),
              recentlyCreated: s.recentlyCreated.filter((i) => !matchId(i)),
              selectedIncident: matchId(s.selectedIncident) ? null : s.selectedIncident,
            };
          }

          return {
            liveIncidents: s.liveIncidents.map((i) => (matchId(i) ? { ...i, ...update } : i)),
            // Keep selectedIncident in sync so the detail panel updates instantly
            selectedIncident: matchId(s.selectedIncident)
              ? { ...s.selectedIncident, ...update }
              : s.selectedIncident,
          };
        }),
      setLiveIncidents: (incidents) =>
        set((s) => {
          // Keep recently-created incidents alive for 5 minutes so they
          // aren't wiped by a nearby-refetch that uses a different radius.
          const GRACE_MS = 5 * 60 * 1000;
          const now = Date.now();
          const alive = s.recentlyCreated.filter((r) => now - r._createdAt < GRACE_MS);
          const fetchedIds = new Set(incidents.map((i) => i.id || i._id));
          const extras = alive.filter((r) => !fetchedIds.has(r.id) && !fetchedIds.has(r._id));
          return {
            liveIncidents: [...incidents, ...extras].slice(0, 200),
            recentlyCreated: alive,
          };
        }),

      // Notifications
      notifications: [],
      addNotification: (n) =>
        set((s) => ({ notifications: [{ id: Date.now(), ...n }, ...s.notifications].slice(0, 10) })),
      dismissNotification: (id) =>
        set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

      // Socket
      socketConnected: false,
      setSocketConnected: (connected) => set({ socketConnected: connected }),
      connectedUsers: 0,
      setConnectedUsers: (count) => set({ connectedUsers: count }),

      // Routing
      routeOrigin: null,
      routeDestination: null,
      routeType: 'safe',
      setRoute: (origin, destination) => set({ routeOrigin: origin, routeDestination: destination }),
      setRouteType: (type) => set({ routeType: type }),
      clearRoute: () => set({ routeOrigin: null, routeDestination: null }),

      // Navigation journey
      navigation: null, // { route, distance, duration, riskLevel, transportMode }
      setNavigation: (nav) => set({ navigation: nav }),
      clearNavigation: () => set({ navigation: null, journeyActive: false }),
      journeyActive: false,
      setJourneyActive: (active) => set({ journeyActive: active }),
      journeyCompleted: false,
      setJourneyCompleted: (done) => set({ journeyCompleted: done }),

      // Profile panel
      profilePanelOpen: false,
      setProfilePanelOpen: (open) => set({ profilePanelOpen: open }),

      // Emergency contacts (persisted with user)
      emergencyContacts: [],
      setEmergencyContacts: (contacts) => set({ emergencyContacts: contacts }),
      addEmergencyContact: (contact) => set((s) => ({ emergencyContacts: [...s.emergencyContacts, contact] })),
      removeEmergencyContact: (idx) => set((s) => ({ emergencyContacts: s.emergencyContacts.filter((_, i) => i !== idx) })),
    }),
    {
      name: 'geoguard-store',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        viewport: state.viewport,
        filters: state.filters,
        theme: state.theme,
        emergencyContacts: state.emergencyContacts,
      }),
    }
  )
);

export default useAppStore;

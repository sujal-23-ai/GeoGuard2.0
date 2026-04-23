import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAppStore = create(
  persist(
    (set) => ({
      // Theme
      theme: 'dark',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

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
      addLiveIncident: (incident) =>
        set((s) => ({
          liveIncidents: [incident, ...s.liveIncidents.filter((i) => i.id !== incident.id)].slice(0, 200),
        })),
      updateLiveIncident: (update) =>
        set((s) => ({
          liveIncidents: s.liveIncidents.map((i) => (i.id === update.id ? { ...i, ...update } : i)),
        })),
      setLiveIncidents: (incidents) => set({ liveIncidents: incidents }),

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

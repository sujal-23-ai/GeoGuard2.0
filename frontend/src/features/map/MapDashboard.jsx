import { useCallback, useRef } from 'react';
import MapView from '../../components/map/MapView';
import MapControls from '../../components/map/MapControls';
import TopBar from '../../components/overlays/TopBar';
import IncidentFeed from '../../components/overlays/IncidentFeed';
import BottomBar from '../../components/overlays/BottomBar';
import IncidentDetailPanel from '../../components/overlays/IncidentDetailPanel';
import NavigationHUD from '../../components/overlays/NavigationHUD';
import FilterPanel from './FilterPanel';
import ReportPanel from '../incidents/ReportPanel';
import AnalyticsPanel from '../analytics/AnalyticsPanel';
import UserMenu from '../user/UserMenu';
import ProfilePanel from '../user/ProfilePanel';
import LeaderboardModal from '../user/LeaderboardModal';
import RoutingPanel from '../routing/RoutingPanel';
import AdminPanel from '../admin/AdminPanel';
import AiAssistant from '../ai/AiAssistant';
import NotificationToast from '../../components/overlays/NotificationToast';
import { useNearbyIncidents } from '../../hooks/useIncidents';
import { useSocket } from '../../hooks/useSocket';
import useAppStore from '../../store/useAppStore';

export default function MapDashboard() {
  const mapRef = useRef(null);

  useNearbyIncidents();
  useSocket();

  const {
    sosActive, leaderboardOpen, setLeaderboardOpen, adminPanelOpen, setAdminPanelOpen, user,
    aiAssistantOpen, setAiAssistantOpen, profilePanelOpen, setProfilePanelOpen,
    clearNavigation, setJourneyCompleted,
    menuOpen, setMenuOpen,
    selectedIncident, setSelectedIncident,
  } = useAppStore();

  const handleIncidentClick = useCallback((incident) => {
    setSelectedIncident(incident);
    // Fly to the incident location
    if (mapRef.current && incident.lng && incident.lat) {
      mapRef.current.flyTo({
        center: [incident.lng, incident.lat],
        zoom: 15,
        duration: 1200,
        essential: true,
      });
    }
  }, []);

  const handleStopJourney = useCallback(() => {
    clearNavigation();
    setJourneyCompleted(false);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: '#0B0F1A' }}>
      {/* SOS overlay */}
      {sosActive && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute inset-0 border-4 border-red-500 animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500/20 backdrop-blur border-2 border-red-500 rounded-2xl px-8 py-4 text-center">
            <div className="text-red-400 font-black text-2xl animate-pulse">🚨 SOS ACTIVE</div>
            <div className="text-white/70 text-sm mt-1">Emergency broadcast sent to nearby users</div>
          </div>
        </div>
      )}

      {/* Map — pass ref so RoutingPanel can draw on it */}
      <MapView onIncidentClick={handleIncidentClick} mapRef={mapRef} />

      {/* Floating UI */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <div className="pointer-events-auto"><TopBar onMenuOpen={() => setMenuOpen(true)} /></div>
        <div className="pointer-events-auto"><NavigationHUD onStop={handleStopJourney} /></div>
        <div className="pointer-events-auto"><IncidentFeed onIncidentClick={handleIncidentClick} /></div>
        <div className="pointer-events-auto">
          <IncidentDetailPanel incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
        </div>
        <div className="pointer-events-auto"><FilterPanel /></div>
        <div className="pointer-events-auto"><MapControls /></div>
        <div className="pointer-events-auto"><BottomBar /></div>
      </div>

      {/* Panels & modals */}
      <ReportPanel />
      <AnalyticsPanel />
      <RoutingPanel mapRef={mapRef} />
      <UserMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <ProfilePanel open={profilePanelOpen} onClose={() => setProfilePanelOpen(false)} />
      <LeaderboardModal open={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} />
      {(user?.role === 'admin' || user?.role === 'moderator') && (
        <AdminPanel open={adminPanelOpen} onClose={() => setAdminPanelOpen(false)} />
      )}
      <AiAssistant open={aiAssistantOpen} onClose={() => setAiAssistantOpen(false)} />
      <NotificationToast />
    </div>
  );
}


export const INCIDENT_CATEGORIES = [
  { id: 'accident', label: 'Accident', icon: '🚗', color: '#F97316' },
  { id: 'crime', label: 'Crime', icon: '🚨', color: '#EF4444' },
  { id: 'hazard', label: 'Hazard', icon: '⚠️', color: '#F59E0B' },
  { id: 'weather', label: 'Weather', icon: '🌧', color: '#06B6D4' },
  { id: 'fire', label: 'Fire', icon: '🔥', color: '#EF4444' },
  { id: 'medical', label: 'Medical', icon: '🏥', color: '#10B981' },
  { id: 'infrastructure', label: 'Infrastructure', icon: '🏗', color: '#8B5CF6' },
  { id: 'traffic', label: 'Traffic', icon: '🚦', color: '#F59E0B' },
  { id: 'noise', label: 'Noise', icon: '🔊', color: '#A78BFA' },
  { id: 'other', label: 'Other', icon: '📍', color: '#6B7280' },
];

export const SEVERITY_COLORS = {
  1: '#10B981',
  2: '#84CC16',
  3: '#F59E0B',
  4: '#F97316',
  5: '#EF4444',
};

export const SEVERITY_LABELS = {
  1: 'Minor',
  2: 'Low',
  3: 'Moderate',
  4: 'High',
  5: 'Critical',
};

export const BADGES = [
  { id: 'first_report', label: 'First Responder', icon: '🥇', description: 'First incident report' },
  { id: 'trusted', label: 'Trusted Reporter', icon: '⭐', description: '50+ trust score' },
  { id: 'veteran', label: 'Veteran', icon: '🎖', description: '100+ reports' },
  { id: 'sos_helper', label: 'Guardian', icon: '🛡', description: 'Responded to SOS' },
  { id: 'explorer', label: 'Explorer', icon: '🗺', description: 'Reports in 5+ cities' },
];

export const MAP_STYLES = {
  dark: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  navigation: 'mapbox://styles/mapbox/navigation-night-v1',
};

export const DEMO_INCIDENTS = [
  { id: 'd1', category: 'accident', title: 'Multi-vehicle collision', severity: 4, lng: -74.006, lat: 40.7128, address: 'Broadway & 42nd St', city: 'New York', upvotes: 12, is_verified: true, created_at: new Date(Date.now() - 1000*60*15).toISOString(), tags: ['collision','vehicle','emergency'], reporter_name: 'Demo User' },
  { id: 'd2', category: 'crime', title: 'Suspicious activity', severity: 3, lng: -74.009, lat: 40.715, address: '5th Ave', city: 'New York', upvotes: 5, is_verified: false, created_at: new Date(Date.now() - 1000*60*30).toISOString(), tags: ['suspicious','police'], reporter_name: 'SafeUser42' },
  { id: 'd3', category: 'hazard', title: 'Large pothole blocking lane', severity: 2, lng: -74.003, lat: 40.710, address: 'Park Ave', city: 'New York', upvotes: 8, is_verified: true, created_at: new Date(Date.now() - 1000*60*45).toISOString(), tags: ['road','obstacle'], reporter_name: 'CityWatcher' },
  { id: 'd4', category: 'weather', title: 'Flash flood warning', severity: 4, lng: -73.998, lat: 40.720, address: 'Hudson River Park', city: 'New York', upvotes: 23, is_verified: true, created_at: new Date(Date.now() - 1000*60*5).toISOString(), tags: ['flood','storm','warning'], reporter_name: 'WeatherAlert' },
  { id: 'd5', category: 'traffic', title: 'Major road closure', severity: 3, lng: -74.012, lat: 40.708, address: 'FDR Drive', city: 'New York', upvotes: 17, is_verified: true, created_at: new Date(Date.now() - 1000*60*60).toISOString(), tags: ['congestion','detour'], reporter_name: 'TrafficWatch' },
  { id: 'd6', category: 'fire', title: 'Building fire, multiple units', severity: 5, lng: -73.995, lat: 40.725, address: 'West Village', city: 'New York', upvotes: 31, is_verified: true, created_at: new Date(Date.now() - 1000*60*8).toISOString(), tags: ['flames','evacuation','emergency'], reporter_name: 'FDNY_Alert' },
];

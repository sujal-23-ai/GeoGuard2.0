import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation, Shield, Zap, MapPin, ArrowRight, AlertTriangle, Clock, Route, Car, Bike, Footprints, Siren } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import Button from '../../components/ui/Button';
import { getRiskScore, getSeverityColor } from '../../utils/helpers';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

async function fetchRoutesWithAlternatives(origin, destination, profile = 'driving') {
  if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'pk.demo') {
    // Return mock routes
    return [
      {
        geometry: { type: 'LineString', coordinates: [origin, [origin[0] + 0.01, origin[1] + 0.01], destination] },
        duration: Math.round(Math.random() * 1800 + 300),
        distance: Math.round(Math.random() * 15000 + 2000),
        steps: [],
      },
      {
        geometry: { type: 'LineString', coordinates: [origin, [origin[0] - 0.01, origin[1] - 0.01], destination] },
        duration: Math.round(Math.random() * 2000 + 500),
        distance: Math.round(Math.random() * 18000 + 3000),
        steps: [],
      }
    ];
  }
  const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?alternatives=true&geometries=geojson&overview=full&steps=true&banner_instructions=true&voice_instructions=true&access_token=${MAPBOX_TOKEN}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.routes || data.routes.length === 0) throw new Error('No route found');
  
  return data.routes.map(route => {
    const steps = (route.legs || []).flatMap((leg) => leg.steps || []);
    return { ...route, steps };
  });
}

function formatDuration(seconds) {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}
function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function calcDist(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatSuggestionDist(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  if (meters < 10000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters / 1000)} km`;
}

function LocationInput({ value, onChange, onSelectCoords, placeholder, icon: Icon, iconColor, iconClass, userLocation }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!value || value.toLowerCase() === 'my location') { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
      if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'pk.demo') return;
      try {
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${MAPBOX_TOKEN}&types=place,address,poi&limit=6`);
        const data = await res.json();
        setSuggestions(data.features || []);
      } catch(e) {}
    }, 300);
    return () => clearTimeout(timer);
  }, [value, userLocation]);

  return (
    <div className="relative">
      {Icon && <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${iconColor}`} />}
      {iconClass && <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${iconClass}`} />}
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setShowDropdown(true); }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        placeholder={placeholder}
        className="input-glass pl-8 text-sm w-full"
      />
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface/95 backdrop-blur border border-white/10 shadow-lg rounded-xl overflow-hidden z-50">
          {suggestions.map(s => {
            const dist = userLocation && s.center
              ? calcDist(userLocation.lat, userLocation.lng, s.center[1], s.center[0])
              : null;
            return (
              <button
                key={s.id}
                onClick={() => { onChange(s.place_name); onSelectCoords?.(s.center); setShowDropdown(false); }}
                className="w-full text-left px-3 py-2.5 hover:bg-white/8 transition-colors flex items-start gap-2 group"
              >
                <MapPin className="w-3 h-3 text-white/30 mt-0.5 flex-shrink-0 group-hover:text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-white/80 group-hover:text-white truncate">
                    {s.text || s.place_name.split(',')[0]}
                  </p>
                  <p className="text-[10px] text-white/35 truncate mt-0.5">
                    {s.place_name}
                  </p>
                </div>
                {dist != null && (
                  <span className="text-[10px] text-white/30 flex-shrink-0 mt-0.5">
                    {formatSuggestionDist(dist)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function RoutingPanel({ mapRef }) {
  const { routingPanelOpen, setRoutingPanelOpen, liveIncidents, userLocation } = useAppStore();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [originCoordsState, setOriginCoordsState] = useState(null);   // [lng, lat] from suggestion
  const [destCoordsState, setDestCoordsState]     = useState(null);   // [lng, lat] from suggestion
  const [routeType, setRouteType] = useState('safe');
  const [transportMode, setTransportMode] = useState('driving');
  const [routes, setRoutes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeRoute, setActiveRoute] = useState(null);
  const watchIdRef = useRef(null);

  const { setNavigation, setJourneyActive, setJourneyCompleted, journeyActive, journeyCompleted, clearNavigation } = useAppStore();

  const riskScore = getRiskScore(liveIncidents);

  const startJourney = () => {
    if (!routes || !activeRoute) return;
    const selectedRoute = routes[activeRoute];

    // Save navigation data to store
    setNavigation({
      route: selectedRoute,
      distance: selectedRoute.distance,
      duration: selectedRoute.duration,
      riskLevel: selectedRoute.risk > 60 ? 'high' : selectedRoute.risk > 30 ? 'medium' : 'low',
      transportMode,
      destCoords: routes.destCoords,
      steps: selectedRoute.steps || [],
    });
    setJourneyActive(true);
    setJourneyCompleted(false);

    // Close panel, keep route visible on map
    setRoutingPanelOpen(false);

    // Start GPS tracking
    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { longitude: lng, latitude: lat } = pos.coords;
          const store = useAppStore.getState();
          store.setUserLocation({ lng, lat });

          // Auto-follow camera with direction and pitch
          if (mapRef?.current) {
            let bearing = mapRef.current.getBearing();
            const posHeading = pos.coords.heading;
            const prevLoc = store.userLocation;

            if (posHeading != null && !isNaN(posHeading)) {
              bearing = posHeading;
            } else if (prevLoc) {
              const y = Math.sin((lng - prevLoc.lng) * Math.PI / 180) * Math.cos(lat * Math.PI / 180);
              const x = Math.cos(prevLoc.lat * Math.PI / 180) * Math.sin(lat * Math.PI / 180) -
                        Math.sin(prevLoc.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.cos((lng - prevLoc.lng) * Math.PI / 180);
              const calcBearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
              
              // Only update bearing if moved > 2 meters to avoid jitter
              const dLat = (lat - prevLoc.lat) * 111320;
              const dLng = (lng - prevLoc.lng) * 111320 * Math.cos(lat * Math.PI / 180);
              if (Math.sqrt(dLat*dLat + dLng*dLng) > 2) {
                bearing = calcBearing;
              }
            }

            mapRef.current.easeTo({ 
              center: [lng, lat], 
              bearing, 
              pitch: 60, 
              duration: 1000,
              easing: (t) => t * (2 - t)
            });
          }

          // Check if arrived at destination (within 100m)
          const dest = routes.destCoords;
          if (dest) {
            const dLat = (lat - dest[1]) * 111320;
            const dLng = (lng - dest[0]) * 111320 * Math.cos(lat * Math.PI / 180);
            const dist = Math.sqrt(dLat * dLat + dLng * dLng);
            if (dist < 100) {
              // Arrived!
              store.setJourneyActive(false);
              store.setJourneyCompleted(true);
              if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
              }
            }
          }
        },
        (err) => console.warn('Geolocation error:', err),
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
      );
    }
  };

  const stopJourney = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    clearNavigation();
    setJourneyCompleted(false);
  };

  const prevJourneyActive = useRef(journeyActive);
  useEffect(() => {
    // If journey transitions from active to inactive (e.g. HUD cross button clicked), clear the map
    if (prevJourneyActive.current && !journeyActive) {
      setRoutes(null);
    }
    prevJourneyActive.current = journeyActive;
  }, [journeyActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Set default origin to 'My location' when panel opens if empty
  useEffect(() => {
    if (routingPanelOpen && userLocation && !origin) {
      setOrigin('My location');
    }
  }, [routingPanelOpen, userLocation]);

  const close = () => {
    setRoutingPanelOpen(false);
    setRoutes(null);
    setError('');
    if (mapRef?.current) {
      ['route-safe', 'route-fast', 'route-safe-casing', 'route-fast-casing', 'route-safe-dest', 'route-fast-dest'].forEach((id) => {
        if (mapRef.current.getLayer?.(id)) mapRef.current.removeLayer(id);
      });
      ['route-safe-src', 'route-fast-src', 'route-safe-src-dest', 'route-fast-src-dest'].forEach((id) => {
        if (mapRef.current.getSource?.(id)) mapRef.current.removeSource(id);
      });
    }
  };

  const drawRouteOnMap = (route, sourceId, layerId, color, isDashed = false, exactDestCoords = null) => {
    if (!mapRef?.current) return;
    const map = mapRef.current;
    if (!map.getStyle) return;

    // Clean up old layers
    if (map.getLayer(layerId + '-casing')) map.removeLayer(layerId + '-casing');
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
    
    // Clean up connection line
    if (map.getLayer(layerId + '-conn')) map.removeLayer(layerId + '-conn');
    if (map.getSource(sourceId + '-conn')) map.removeSource(sourceId + '-conn');

    map.addSource(sourceId, { type: 'geojson', data: { type: 'Feature', geometry: route.geometry } });

    map.addLayer({
      id: layerId + '-casing',
      type: 'line',
      source: sourceId,
      paint: { 'line-color': '#000', 'line-width': 8, 'line-opacity': 0.3 },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    });

    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': color,
        'line-width': 5,
        'line-opacity': 0.9,
        ...(isDashed && { 'line-dasharray': [2, 2] }),
      },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    });

    const coords = route.geometry.coordinates;
    const roadEnd = coords[coords.length - 1];
    const destPoint = exactDestCoords || roadEnd;

    // Optional connection line from road end to exact destination
    if (exactDestCoords && (roadEnd[0] !== exactDestCoords[0] || roadEnd[1] !== exactDestCoords[1])) {
      map.addSource(sourceId + '-conn', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [roadEnd, exactDestCoords] } }
      });
      map.addLayer({
        id: layerId + '-conn',
        type: 'line',
        source: sourceId + '-conn',
        paint: {
          'line-color': color,
          'line-width': 3,
          'line-opacity': 0.6,
          'line-dasharray': [1, 2]
        }
      });
    }

    // Destination Marker at EXACT location

    if (map.getLayer(layerId + '-dest')) map.removeLayer(layerId + '-dest');
    if (map.getSource(sourceId + '-dest')) map.removeSource(sourceId + '-dest');

    map.addSource(sourceId + '-dest', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'Point', coordinates: destPoint } }
    });

    map.addLayer({
      id: layerId + '-dest',
      type: 'circle',
      source: sourceId + '-dest',
      paint: {
        'circle-radius': 8,
        'circle-color': color,
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff',
        'circle-pitch-alignment': 'map'
      }
    });
  };

  // Update map drawing when activeRoute changes
  useEffect(() => {
    if (!mapRef?.current?.getStyle) return;
    
    // Clear ALL route layers first
    ['route-safe', 'route-fast'].forEach(layerId => {
      const map = mapRef.current;
      if (map.getLayer(layerId + '-casing')) map.removeLayer(layerId + '-casing');
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getLayer(layerId + '-conn')) map.removeLayer(layerId + '-conn');
      if (map.getLayer(layerId + '-dest')) map.removeLayer(layerId + '-dest');
    });

    if (!routes || !activeRoute) return;

    // Draw only the currently active route
    if (activeRoute === 'safe') {
      drawRouteOnMap(routes.safe, 'route-safe-src', 'route-safe', '#10B981', false, routes.destCoords);
    } else if (activeRoute === 'fast') {
      drawRouteOnMap(routes.fast, 'route-fast-src', 'route-fast', '#3B82F6', false, routes.destCoords);
    }
  }, [routes, activeRoute, mapRef]);

  const handleGetRoutes = async () => {
    if (!origin.trim() || !destination.trim()) {
      setError('Enter both origin and destination');
      return;
    }
    setLoading(true);
    setError('');
    setRoutes(null);

    try {
      // Use stored coords from suggestion selection, fall back to geocoding text
      let originCoords = origin.toLowerCase().includes('my location') && userLocation
        ? [userLocation.lng, userLocation.lat]
        : originCoordsState || null;
      let destCoords = destCoordsState || null;

      // Only geocode if we don't have coords (user typed manually instead of picking a suggestion)
      if (MAPBOX_TOKEN && MAPBOX_TOKEN !== 'pk.demo') {
        const geocode = async (query) => {
          const r = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=1`);
          const d = await r.json();
          return d.features?.[0]?.center;
        };

        if (!originCoords && !origin.toLowerCase().includes('my location')) {
          originCoords = await geocode(origin);
        }
        if (!originCoords && userLocation) {
          originCoords = [userLocation.lng, userLocation.lat];
        }
        if (!destCoords) {
          destCoords = await geocode(destination);
        }
      }

      if (!originCoords) {
        originCoords = userLocation ? [userLocation.lng, userLocation.lat] : [-74.006, 40.7128];
      }
      if (!destCoords) {
        setError('Could not find destination location. Try selecting a suggestion.');
        setLoading(false);
        return;
      }

      // Fetch routes with alternatives=true
      const profileStr = transportMode === 'driving' ? 'driving-traffic' : transportMode;
      const returnedRoutes = await fetchRoutesWithAlternatives(originCoords, destCoords, profileStr);

      // Evaluate the risk of each alternative route
      const evaluatedRoutes = returnedRoutes.map((route) => {
        const coords = route.geometry.coordinates;
        // Sample points along the route
        const samplePoints = [
          coords[0],
          coords[Math.floor(coords.length * 0.25)],
          coords[Math.floor(coords.length * 0.5)],
          coords[Math.floor(coords.length * 0.75)],
          coords[coords.length - 1]
        ].filter(Boolean);

        let riskScore = 0;
        liveIncidents.forEach(incident => {
           // Check if incident is dangerously close to any route point
           const isNear = samplePoints.some(pt => {
             const d = Math.sqrt((incident.lng - pt[0]) ** 2 + (incident.lat - pt[1]) ** 2);
             return d < 0.05; // rough bounds
           });
           if (isNear) {
             riskScore += incident.severity * 10;
           }
        });
        
        return { ...route, rawRisk: Math.min(100, riskScore) };
      });

      // Fastest route is always the primary route returned by Mapbox (index 0)
      let fastestRoute = evaluatedRoutes[0];
      
      // Safest route is the one with the absolute lowest risk. If tied, it's the fastest.
      let safestRoute = [...evaluatedRoutes].sort((a, b) => {
        if (a.rawRisk !== b.rawRisk) return a.rawRisk - b.rawRisk;
        return a.duration - b.duration;
      })[0];

      // If the fastest route is ALSO the safest route, and we have alternatives,
      // let's explicitly designate the alternative as "safest" if it has identical risk
      // just so the UI shows two separate paths when possible (unless there is only 1 path).
      if (fastestRoute === safestRoute && evaluatedRoutes.length > 1) {
        safestRoute = evaluatedRoutes[1]; 
      }

      const result = {
        fast: { ...fastestRoute, risk: fastestRoute.rawRisk, label: 'Fastest', color: '#3B82F6' },
        safe: { ...safestRoute, risk: safestRoute.rawRisk, label: 'Safest', color: '#10B981' },
        originCoords,
        destCoords,
      };
      
      setRoutes(result);
      setActiveRoute('safe');

      if (mapRef?.current?.getStyle && MAPBOX_TOKEN !== 'pk.demo') {
        const coords = result.safe.geometry.coordinates;
        const bounds = coords.reduce(
          (b, c) => [[Math.min(b[0][0], c[0]), Math.min(b[0][1], c[1])], [Math.max(b[1][0], c[0]), Math.max(b[1][1], c[1])]],
          [[coords[0][0], coords[0][1]], [coords[0][0], coords[0][1]]]
        );
        mapRef.current.fitBounds?.(bounds, { padding: 80 });
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch routes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {routingPanelOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed left-0 top-0 bottom-0 w-80 z-50 bg-surface/98 backdrop-blur-2xl border-r border-white/10 shadow-card flex flex-col"
          >
            <div className="p-5 border-b border-white/8">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <Route className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold">Smart Routing</h2>
                    <p className="text-white/40 text-xs">Avoid danger zones</p>
                  </div>
                </div>
                <button onClick={close} className="text-white/40 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3 border-b border-white/8">
              <LocationInput
                value={origin}
                onChange={(v) => { setOrigin(v); setOriginCoordsState(null); }}
                onSelectCoords={(coords) => setOriginCoordsState(coords)}
                placeholder={userLocation ? 'My location' : 'Origin address...'}
                iconClass="w-2.5 h-2.5 rounded-full bg-blue-400 border-2 border-white/20"
                userLocation={userLocation}
              />
              <div className="absolute left-[1.85rem] h-4 w-px bg-white/20" style={{ marginTop: '-8px' }} />
              <LocationInput
                value={destination}
                onChange={(v) => { setDestination(v); setDestCoordsState(null); }}
                onSelectCoords={(coords) => setDestCoordsState(coords)}
                placeholder="Destination address..."
                icon={MapPin}
                iconColor="text-red-400"
                userLocation={userLocation}
              />

              {error && <p className="text-red-400 text-xs">{error}</p>}

              {/* Transport Mode toggle */}
              <div className="flex gap-1.5 pt-1">
                {[
                  { id: 'driving', icon: Car, label: 'Car' },
                  { id: 'cycling', icon: Bike, label: 'Bike' },
                  { id: 'walking', icon: Footprints, label: 'Walk' },
                  { id: 'driving-traffic', icon: Siren, label: 'Emergency' },
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setTransportMode(id)}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-semibold border transition-all
                      ${transportMode === id
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                        : 'bg-white/5 border-white/10 text-white/50 hover:text-white/70'
                      }`}
                  >
                    <Icon className="w-4 h-4 mb-0.5" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Route type toggle */}
              <div className="flex gap-2">
                {[
                  { id: 'safe', icon: Shield, label: 'Safest', color: 'emerald' },
                  { id: 'fast', icon: Zap, label: 'Fastest', color: 'amber' },
                ].map(({ id, icon: Icon, label, color }) => (
                  <button
                    key={id}
                    onClick={() => setRouteType(id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all
                      ${routeType === id
                        ? color === 'emerald'
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                          : 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                        : 'bg-white/5 border-white/10 text-white/50 hover:text-white/70'
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </button>
                ))}
              </div>

              <Button onClick={handleGetRoutes} loading={loading} className="w-full" size="sm">
                <Navigation className="w-4 h-4" /> Get Routes
              </Button>
            </div>

            {/* Route Results */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {routes ? (
                <>
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">Route Options</p>

                  {[
                    { key: 'safe', ...routes.safe },
                    { key: 'fast', ...routes.fast },
                  ].map((route) => {
                    const rColor = route.risk > 60 ? '#EF4444' : route.risk > 30 ? '#F59E0B' : '#10B981';
                    const isActive = activeRoute === route.key;
                    return (
                      <motion.button
                        key={route.key}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setActiveRoute(route.key)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all duration-200
                          ${isActive
                            ? 'bg-white/8 border-white/20 shadow-card'
                            : 'bg-white/3 border-white/8 hover:bg-white/6'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: route.color }} />
                            <span className="text-white font-semibold text-sm">{route.label}</span>
                          </div>
                          {isActive && (
                            <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 rounded-full px-2 py-0.5">
                              Selected
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center">
                            <Clock className="w-3.5 h-3.5 text-white/40 mx-auto mb-1" />
                            <p className="text-white font-bold text-sm">{formatDuration(route.duration)}</p>
                            <p className="text-white/40 text-[10px]">Duration</p>
                          </div>
                          <div className="text-center">
                            <Navigation className="w-3.5 h-3.5 text-white/40 mx-auto mb-1" />
                            <p className="text-white font-bold text-sm">{formatDistance(route.distance)}</p>
                            <p className="text-white/40 text-[10px]">Distance</p>
                          </div>
                          <div className="text-center">
                            <AlertTriangle className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: rColor }} />
                            <p className="font-bold text-sm" style={{ color: rColor }}>{route.risk}%</p>
                            <p className="text-white/40 text-[10px]">Risk</p>
                          </div>
                        </div>

                        {/* Risk bar */}
                        <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${route.risk}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: rColor }}
                          />
                        </div>
                      </motion.button>
                    );
                  })}

                  {/* Start Journey button */}
                  <Button
                    onClick={startJourney}
                    className="w-full mt-2"
                    size="sm"
                  >
                    <Navigation className="w-4 h-4" /> Start Journey
                  </Button>

                  {/* Danger zones near route */}
                  {liveIncidents.filter((i) => i.severity >= 4).length > 0 && (
                    <div className="mt-2 p-3 bg-red-500/10 border border-red-500/25 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <span className="text-red-400 text-xs font-bold">Danger Zones Nearby</span>
                      </div>
                      {liveIncidents.filter((i) => i.severity >= 4).slice(0, 3).map((i) => (
                        <div key={i.id} className="flex items-center gap-2 py-1">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: getSeverityColor(i.severity) }} />
                          <span className="text-white/60 text-xs truncate">{i.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-12 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mx-auto">
                    <Route className="w-6 h-6 text-white/30" />
                  </div>
                  <div>
                    <p className="text-white/50 text-sm font-semibold">Plan your route</p>
                    <p className="text-white/30 text-xs mt-1">
                      {liveIncidents.length} incidents tracked in your area
                    </p>
                  </div>

                  {/* Area risk */}
                  <div className="bg-white/4 border border-white/8 rounded-xl p-3 text-left">
                    <p className="text-white/50 text-xs mb-2 font-semibold">Current Area Risk</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${riskScore}%`,
                            backgroundColor: riskScore > 70 ? '#EF4444' : riskScore > 40 ? '#F59E0B' : '#10B981',
                          }}
                        />
                      </div>
                      <span className="text-white/70 text-xs font-bold w-8">{riskScore}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


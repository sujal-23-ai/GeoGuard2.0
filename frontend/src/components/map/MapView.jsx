import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import useAppStore from '../../store/useAppStore';
import { getSeverityColor, getCategory } from '../../utils/helpers';
import { MAP_STYLES } from '../../utils/constants';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.demo';

function setupCluster(mapInstance) {
  if (mapInstance.getSource('incidents-cluster')) return;
  mapInstance.addSource('incidents-cluster', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
    cluster: true,
    clusterMaxZoom: 10,
    clusterRadius: 50,
  });
  mapInstance.addLayer({
    id: 'cluster-circles',
    type: 'circle',
    source: 'incidents-cluster',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': ['step', ['get', 'point_count'], '#3B82F6', 5, '#F59E0B', 10, '#EF4444'],
      'circle-radius': ['step', ['get', 'point_count'], 20, 5, 28, 10, 36],
      'circle-opacity': 0.85,
      'circle-stroke-width': 2,
      'circle-stroke-color': 'rgba(255,255,255,0.3)',
    },
  });
  mapInstance.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'incidents-cluster',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 12,
    },
    paint: { 'text-color': '#ffffff' },
  });
}

const FALLBACK_STYLE = {
  version: 8,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#0B0F1A' } }],
};

export default function MapView({ onIncidentClick, mapRef: externalMapRef }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef({});
  const [mapReady, setMapReady] = useState(false);

  const { viewport, liveIncidents, userLocation, showHeatmap, showSatellite, showSafeZones, setViewport, selectedIncident } = useAppStore();

  const getMapStyle = () => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token || token === 'pk.demo') return FALLBACK_STYLE;
    return showSatellite ? MAP_STYLES.satellite : MAP_STYLES.dark;
  };

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const style = getMapStyle();

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style,
      center: [viewport.lng, viewport.lat],
      zoom: viewport.zoom,
      pitch: 45,
      bearing: -10,
      antialias: true,
    });

    // expose map instance to parent for routing
    if (externalMapRef) externalMapRef.current = map.current;

    map.current.on('load', () => {
      setMapReady(true);
      setupCluster(map.current);

      const token = import.meta.env.VITE_MAPBOX_TOKEN;
      if (token && token !== 'pk.demo') {
        try {
          map.current.addLayer({
            id: '3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 12,
            paint: {
              'fill-extrusion-color': '#1a2235',
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-opacity': 0.6,
            },
          });
        } catch {
          // buildings layer unavailable
        }
      }

      // Re-add cluster layers after style change (satellite toggle)
      map.current.on('style.load', () => setupCluster(map.current));

      // Zoom: toggle between cluster view and individual markers
      const syncClusterVis = () => {
        if (!map.current) return;
        const showClusters = map.current.getZoom() < 11;
        if (map.current.getLayer('cluster-circles')) {
          map.current.setLayoutProperty('cluster-circles', 'visibility', showClusters ? 'visible' : 'none');
          map.current.setLayoutProperty('cluster-count', 'visibility', showClusters ? 'visible' : 'none');
        }
        Object.entries(markersRef.current).forEach(([id, marker]) => {
          if (id.startsWith('__')) return;
          const el = marker.getElement();
          if (el) el.style.display = showClusters ? 'none' : '';
        });
      };
      map.current.on('zoom', syncClusterVis);

      // Click cluster to zoom in
      map.current.on('click', 'cluster-circles', (e) => {
        const features = map.current.queryRenderedFeatures(e.point, { layers: ['cluster-circles'] });
        if (!features.length) return;
        const clusterId = features[0].properties.cluster_id;
        map.current.getSource('incidents-cluster').getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          map.current.easeTo({ center: features[0].geometry.coordinates, zoom: zoom + 1 });
        });
      });
      map.current.on('mouseenter', 'cluster-circles', () => { map.current.getCanvas().style.cursor = 'pointer'; });
      map.current.on('mouseleave', 'cluster-circles', () => { map.current.getCanvas().style.cursor = ''; });
    });

    map.current.on('moveend', () => {
      if (!map.current) return;
      const center = map.current.getCenter();
      setViewport({ lng: center.lng, lat: center.lat, zoom: map.current.getZoom() });
    });

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: true, visualizePitch: true }), 'bottom-right');

    map.current.on('click', (e) => {
      const state = useAppStore.getState();
      if (state.pickingLocation) {
        state.setReportLocation({ lng: e.lngLat.lng, lat: e.lngLat.lat });
      }
    });

    return () => {
      Object.values(markersRef.current).forEach((m) => m.remove());
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update pick marker
  useEffect(() => {
    const { pickingLocation, reportLocation } = useAppStore.getState();
    if (!map.current || !mapReady) return;

    if (pickingLocation && reportLocation) {
      if (!markersRef.current['__pick__']) {
        const el = document.createElement('div');
        el.className = 'w-6 h-6 text-red-500 drop-shadow-md';
        el.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>';
        markersRef.current['__pick__'] = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([reportLocation.lng, reportLocation.lat])
          .addTo(map.current);
      } else {
        markersRef.current['__pick__'].setLngLat([reportLocation.lng, reportLocation.lat]);
      }
    } else {
      if (markersRef.current['__pick__']) {
        markersRef.current['__pick__'].remove();
        delete markersRef.current['__pick__'];
      }
    }
  });

  // update map style on toggle
  useEffect(() => {
    if (!map.current || !mapReady) return;
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token || token === 'pk.demo') return;
    map.current.setStyle(getMapStyle());
  }, [showSatellite]);

  // fly to user location ONCE on initial load
  const hasFlewToUser = useRef(false);
  useEffect(() => {
    if (!map.current || !userLocation || !mapReady || hasFlewToUser.current) return;
    hasFlewToUser.current = true;
    map.current.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 13, duration: 1500 });
  }, [userLocation, mapReady]);

  // focus on specific location (from store subscription)
  useEffect(() => {
    const unsub = useAppStore.subscribe(
      (state) => state.mapFocus,
      (mapFocus) => {
        if (!map.current || !mapFocus) return;
        map.current.flyTo({
          center: [mapFocus.lng, mapFocus.lat],
          zoom: mapFocus.zoom || 15,
          essential: true,
          duration: 1200,
        });
        useAppStore.getState().setMapFocus(null);
      }
    );
    return unsub;
  }, [mapReady]);

  // render incident markers
  useEffect(() => {
    if (!map.current || !mapReady) return;

    const current = new Set(liveIncidents.map((i) => i.id));
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      if (!current.has(id)) { marker.remove(); delete markersRef.current[id]; }
    });

    liveIncidents.forEach((incident) => {
      if (markersRef.current[incident.id]) {
        markersRef.current[incident.id].setLngLat([incident.lng, incident.lat]);
        return;
      }

      const cat = getCategory(incident.category);
      const color = getSeverityColor(incident.severity);
      const size = 28 + incident.severity * 5;

      const el = document.createElement('div');
      el.className = 'incident-marker-el';
      el.style.cssText = `
        width: ${size}px; height: ${size}px;
        border-radius: 50%;
        background: radial-gradient(circle at 40% 35%, ${color}dd, ${color}88);
        border: 2px solid ${color};
        box-shadow: 0 0 ${incident.severity * 6}px ${color}80, 0 0 ${incident.severity * 14}px ${color}30;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        font-size: ${12 + incident.severity}px;
        transition: transform 0.2s, box-shadow 0.2s;
        animation: markerPulse 2s ease-in-out infinite;
      `;
      el.innerHTML = cat?.icon || '📍';
      el.title = incident.title;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.3)';
        el.style.boxShadow = `0 0 ${incident.severity * 10}px ${color}, 0 0 ${incident.severity * 20}px ${color}60`;
        el.style.zIndex = '999';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.boxShadow = `0 0 ${incident.severity * 6}px ${color}80`;
        el.style.zIndex = '';
      });
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onIncidentClick?.(incident);
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([incident.lng, incident.lat])
        .addTo(map.current);

      markersRef.current[incident.id] = marker;
    });

    // Keep cluster source in sync
    if (!map.current.getSource('incidents-cluster')) setupCluster(map.current);
    map.current.getSource('incidents-cluster')?.setData({
      type: 'FeatureCollection',
      features: liveIncidents.map((i) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [i.lng, i.lat] },
        properties: { id: i.id, severity: i.severity },
      })),
    });
  }, [liveIncidents, mapReady, onIncidentClick]);

  // highlight selected incident marker
  useEffect(() => {
    if (!mapReady) return;
    const incidents = useAppStore.getState().liveIncidents;
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      if (id.startsWith('__')) return;
      const el = marker.getElement();
      if (!el) return;
      const incident = incidents.find((i) => i.id === id);
      if (!incident) return;
      const color = getSeverityColor(incident.severity);
      const isSelected = id === selectedIncident?.id || id === selectedIncident?._id;
      el.style.transform = isSelected ? 'scale(1.45)' : 'scale(1)';
      el.style.zIndex = isSelected ? '999' : '';
      el.style.boxShadow = isSelected
        ? `0 0 0 3px rgba(255,255,255,0.85), 0 0 ${incident.severity * 10}px ${color}, 0 0 ${incident.severity * 20}px ${color}60`
        : `0 0 ${incident.severity * 6}px ${color}80, 0 0 ${incident.severity * 14}px ${color}30`;
    });
  }, [selectedIncident, mapReady]);

  // heatmap layer
  useEffect(() => {
    if (!map.current || !mapReady) return;

    const hasSource = map.current.getSource('heatmap-data');

    if (showHeatmap && liveIncidents.length > 0) {
      const geoJson = {
        type: 'FeatureCollection',
        features: liveIncidents.map((i) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [i.lng, i.lat] },
          properties: { severity: i.severity },
        })),
      };

      if (hasSource) {
        map.current.getSource('heatmap-data').setData(geoJson);
      } else {
        map.current.addSource('heatmap-data', { type: 'geojson', data: geoJson });
        map.current.addLayer({
          id: 'heatmap-layer',
          type: 'heatmap',
          source: 'heatmap-data',
          paint: {
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'severity'], 1, 0.2, 5, 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 14, 2],
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0, 'rgba(0,0,0,0)',
              0.2, 'rgba(59,130,246,0.4)',
              0.5, 'rgba(245,158,11,0.7)',
              0.8, 'rgba(239,68,68,0.85)',
              1, 'rgba(239,68,68,1)',
            ],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 20, 14, 50],
            'heatmap-opacity': 0.75,
          },
        });
      }
    } else {
      if (map.current.getLayer('heatmap-layer')) map.current.removeLayer('heatmap-layer');
      if (map.current.getSource('heatmap-data')) map.current.removeSource('heatmap-data');
    }
  }, [showHeatmap, liveIncidents, mapReady]);

  // user location marker
  useEffect(() => {
    if (!map.current || !userLocation || !mapReady) return;

    if (markersRef.current['__user__']) {
      markersRef.current['__user__'].setLngLat([userLocation.lng, userLocation.lat]);
      return;
    }

    const el = document.createElement('div');
    el.style.cssText = `
      width: 20px; height: 20px; border-radius: 50%;
      background: #3B82F6;
      border: 3px solid white;
      box-shadow: 0 0 0 8px rgba(59,130,246,0.25), 0 0 20px rgba(59,130,246,0.5);
      animation: userPulse 2s ease-in-out infinite;
    `;

    const pulse = document.createElement('div');
    pulse.style.cssText = `
      position: absolute; inset: -12px; border-radius: 50%;
      border: 2px solid rgba(59,130,246,0.4);
      animation: ping 2s cubic-bezier(0,0,0.2,1) infinite;
    `;
    el.appendChild(pulse);

    markersRef.current['__user__'] = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map.current);
  }, [userLocation, mapReady]);

  // safe zones — hospitals, police stations, fire stations via Overpass API
  useEffect(() => {
    if (!map.current || !mapReady) return;

    const SZ = '__sz_';
    Object.keys(markersRef.current).forEach((id) => {
      if (id.startsWith(SZ)) { markersRef.current[id].remove(); delete markersRef.current[id]; }
    });

    if (!showSafeZones || !userLocation) return;

    const { lng, lat } = userLocation;
    const q = `[out:json][timeout:20];(node["amenity"="hospital"](around:5000,${lat},${lng});node["amenity"="police"](around:5000,${lat},${lng});node["amenity"="fire_station"](around:5000,${lat},${lng}););out body;`;

    fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!map.current || !mapReady) return;
        (data.elements || []).forEach((el, i) => {
          if (!el.lat || !el.lon) return;
          const amenity = el.tags?.amenity;
          const icon  = amenity === 'hospital' ? '🏥' : amenity === 'police' ? '🚔' : '🚒';
          const color = amenity === 'hospital' ? '#10B981' : amenity === 'police' ? '#3B82F6' : '#F59E0B';

          const dom = document.createElement('div');
          dom.style.cssText = `
            width: 34px; height: 34px; border-radius: 50%;
            background: ${color}20; border: 2px solid ${color}70;
            display: flex; align-items: center; justify-content: center;
            font-size: 15px; cursor: default;
            box-shadow: 0 0 10px ${color}40;
          `;
          dom.innerHTML = icon;
          dom.title = el.tags?.name || amenity;

          const id = `${SZ}${el.id || i}`;
          markersRef.current[id] = new mapboxgl.Marker({ element: dom, anchor: 'center' })
            .setLngLat([el.lon, el.lat])
            .addTo(map.current);
        });
      })
      .catch(() => {});
  }, [showSafeZones, userLocation, mapReady]);

  return (
    <>
      <style>{`
        @keyframes markerPulse {
          0%, 100% { box-shadow: 0 0 8px var(--shadow-color, rgba(59,130,246,0.5)); }
          50% { box-shadow: 0 0 20px var(--shadow-color, rgba(59,130,246,0.8)); }
        }
        @keyframes userPulse {
          0%, 100% { box-shadow: 0 0 0 6px rgba(59,130,246,0.2), 0 0 15px rgba(59,130,246,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(59,130,246,0.1), 0 0 30px rgba(59,130,246,0.6); }
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }} />
      {!mapReady && (
        <div className="absolute inset-0 bg-background flex items-center justify-center z-10">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-white/60 text-sm">Initializing Map...</p>
          </div>
        </div>
      )}
    </>
  );
}

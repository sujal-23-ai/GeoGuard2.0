import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { motion } from 'framer-motion';
import { MapPin, Clock, ExternalLink, WifiOff, Shield } from 'lucide-react';
import { shareApi } from '../../services/api';
import { initSocket } from '../../services/socket';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.demo';

const FALLBACK_STYLE = {
  version: 8,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#0B0F1A' } }],
};

function timeAgoShort(iso) {
  if (!iso) return 'unknown';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

export default function ShareLocationView({ token }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [session, setSession] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  // Refresh "X ago" label every 5 seconds
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  // Load initial session data
  useEffect(() => {
    if (!token) { setError('Invalid share link.'); return; }
    shareApi.get(token)
      .then(({ session: s }) => {
        setSession(s);
        setLastUpdated(s.updatedAt || s.createdAt);
      })
      .catch(() => setError('This share link has expired or does not exist.'));
  }, [token]);

  // Init map once session is loaded
  useEffect(() => {
    if (!session || !mapContainer.current || mapRef.current) return;

    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    const style = (token && token !== 'pk.demo') ? 'mapbox://styles/mapbox/dark-v11' : FALLBACK_STYLE;

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style,
      center: [session.lng, session.lat],
      zoom: 15,
      interactive: true,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

    mapRef.current.on('load', () => {
      const el = document.createElement('div');
      el.style.cssText = `
        width: 22px; height: 22px; border-radius: 50%;
        background: #10B981; border: 3px solid white;
        box-shadow: 0 0 0 8px rgba(16,185,129,0.25), 0 0 20px rgba(16,185,129,0.5);
        animation: sharePulse 2s ease-in-out infinite;
      `;
      const ring = document.createElement('div');
      ring.style.cssText = `position:absolute;inset:-12px;border-radius:50%;border:2px solid rgba(16,185,129,0.4);animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;`;
      el.appendChild(ring);

      markerRef.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([session.lng, session.lat])
        .addTo(mapRef.current);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [session]);

  // Socket: live position updates
  useEffect(() => {
    if (!token) return;

    const socket = initSocket();
    socket.emit('join_share_room', token);

    socket.on('share_update', (data) => {
      if (data.token !== token) return;
      setSession((s) => s ? { ...s, lat: data.lat, lng: data.lng } : s);
      setLastUpdated(data.updatedAt);

      if (markerRef.current) markerRef.current.setLngLat([data.lng, data.lat]);
      if (mapRef.current) {
        mapRef.current.easeTo({ center: [data.lng, data.lat], duration: 800 });
      }
    });

    socket.on('share_ended', () => {
      setError('The sharer has stopped sharing their location.');
    });

    return () => {
      socket.off('share_update');
      socket.off('share_ended');
    };
  }, [token]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 p-8 max-w-sm"
        >
          <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center mx-auto">
            <WifiOff className="w-6 h-6 text-red-400" />
          </div>
          <h2 className="text-white font-bold text-lg">Link Unavailable</h2>
          <p className="text-white/50 text-sm">{error}</p>
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const gmapsUrl = `https://www.google.com/maps?q=${session.lat},${session.lng}`;

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Top banner */}
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-0 left-0 right-0 z-10 p-4"
      >
        <div className="bg-surface/95 backdrop-blur-2xl border border-white/10 rounded-2xl px-4 py-3 shadow-card flex items-center gap-3 max-w-sm mx-auto">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{session.name} is sharing their location</p>
            {session.message && (
              <p className="text-white/50 text-xs truncate">{session.message}</p>
            )}
          </div>
          <div className="flex items-center gap-1 text-white/30 text-[10px] flex-shrink-0">
            <Clock className="w-3 h-3" />
            <span>{timeAgoShort(lastUpdated)}</span>
          </div>
        </div>
      </motion.div>

      {/* Map */}
      <div ref={mapContainer} className="flex-1 w-full" />

      {/* Bottom bar */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute bottom-0 left-0 right-0 z-10 p-4"
      >
        <div className="bg-surface/95 backdrop-blur-2xl border border-white/10 rounded-2xl px-4 py-3 shadow-card flex items-center gap-3 max-w-sm mx-auto">
          <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="text-white/60 text-xs font-mono flex-1 truncate">
            {session.lat.toFixed(5)}, {session.lng.toFixed(5)}
          </span>
          <a
            href={gmapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Maps <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </motion.div>

      <style>{`
        @keyframes sharePulse {
          0%, 100% { box-shadow: 0 0 0 6px rgba(16,185,129,0.2), 0 0 15px rgba(16,185,129,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(16,185,129,0.1), 0 0 30px rgba(16,185,129,0.6); }
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

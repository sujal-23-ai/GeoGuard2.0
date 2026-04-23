import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Search, Wifi, WifiOff, BarChart2, Menu, Brain, Radio, MapPin, Newspaper } from 'lucide-react';
import { useState, useEffect } from 'react';
import useAppStore from '../../store/useAppStore';
import { LiveBadge } from '../ui/Badge';

export default function TopBar({ onMenuOpen }) {
  const {
    socketConnected, connectedUsers, notifications,
    setAnalyticsPanelOpen, setNewsPanelOpen,
    liveMode, toggleLiveMode, setAiAssistantOpen,
  } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
      let mapboxResults = [];
      if (MAPBOX_TOKEN && MAPBOX_TOKEN !== 'pk.demo') {
        try {
          const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&types=place,address,poi&limit=3`);
          const data = await res.json();
          mapboxResults = data.features?.map(f => ({ type: 'location', id: f.id, text: f.place_name, center: f.center })) || [];
        } catch(e) {}
      }
      
      const { liveIncidents } = useAppStore.getState();
      const incidentResults = liveIncidents
        .filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()) || i.address?.toLowerCase().includes(searchQuery.toLowerCase()))
        .map(i => ({ type: 'incident', id: i.id, text: i.title, data: i }))
        .slice(0, 3);
        
      setSuggestions([...incidentResults, ...mapboxResults]);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelect = (s) => {
    setShowDropdown(false);
    setSearchQuery('');
    if (s.type === 'location') {
      useAppStore.getState().setMapFocus({ lng: s.center[0], lat: s.center[1], zoom: 14 });
    } else if (s.type === 'incident') {
      useAppStore.getState().setMapFocus({ lng: s.data.lng, lat: s.data.lat, zoom: 15 });
      useAppStore.getState().setSelectedIncident(s.data);
    }
  };

  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="absolute top-4 left-4 right-4 z-30 pointer-events-auto"
    >
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2.5 glass-panel rounded-2xl px-4 py-2.5 shadow-card flex-shrink-0">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm tracking-tight">GeoGuard</span>
              {/* Live mode indicator */}
              <AnimatePresence>
                {liveMode && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1"
                  >
                    <span className="w-1 h-1 rounded-full bg-red-400 animate-ping" />
                    LIVE
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {socketConnected
                ? <Wifi className="w-2.5 h-2.5 text-emerald-400" />
                : <WifiOff className="w-2.5 h-2.5 text-red-400" />
              }
              <span className="micro-label">
                {socketConnected
                  ? (connectedUsers > 0 ? `${connectedUsers} online` : 'connected')
                  : 'connecting...'}
              </span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 relative">
          <div className="glass-panel rounded-2xl shadow-card overflow-hidden">
            <div className="flex items-center px-4 py-2.5 gap-3">
              <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search locations, incidents..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                className="flex-1 bg-transparent text-sm placeholder-white/30 outline-none"
                style={{ color: 'rgb(var(--fg))', caretColor: '#3B82F6' }}
              />
              <LiveBadge />
            </div>
          </div>

          {/* Autocomplete Dropdown */}
          <AnimatePresence>
            {showDropdown && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-full left-0 right-0 mt-2 bg-surface/95 backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl overflow-hidden z-50 py-1"
              >
                {suggestions.map((s, i) => (
                  <button
                    key={`${s.id}-${i}`}
                    onClick={() => handleSelect(s)}
                    className="w-full text-left px-4 py-2.5 flex items-start gap-3 hover:bg-white/5 transition-colors"
                  >
                    <div className="mt-0.5">
                      {s.type === 'incident' ? (
                        <Shield className="w-4 h-4 text-primary" />
                      ) : (
                        <MapPin className="w-4 h-4 text-white/40" />
                      )}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium leading-tight">{s.text}</p>
                      <p className="text-white/40 text-[10px] uppercase mt-0.5 tracking-wider">
                        {s.type === 'incident' ? 'Incident' : 'Location'}
                      </p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* News */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setNewsPanelOpen(true)}
            title="Safety News"
            className="w-10 h-10 glass-panel rounded-xl flex items-center justify-center text-white/70 hover:text-white
                       shadow-card transition-all duration-200 hover:border-primary/40"
          >
            <Newspaper className="w-4 h-4" />
          </motion.button>

          {/* AI Assistant */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setAiAssistantOpen(true)}
            title="AI Safety Assistant"
            className="w-10 h-10 glass-panel rounded-xl flex items-center justify-center text-white/70 hover:text-white
                       shadow-card transition-all duration-200 hover:border-primary/40"
          >
            <Brain className="w-4 h-4" />
          </motion.button>

          {/* Live mode toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleLiveMode}
            title={liveMode ? 'Disable live mode' : 'Enable live mode'}
            className={`w-10 h-10 glass-panel rounded-xl flex items-center justify-center shadow-card transition-all duration-200
              ${liveMode ? 'text-red-400 border-red-500/40 bg-red-500/10' : 'text-white/70 hover:text-white'}`}
          >
            <Radio className="w-4 h-4" />
          </motion.button>

          {/* Analytics */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setAnalyticsPanelOpen(true)}
            title="Analytics"
            className="w-10 h-10 glass-panel rounded-xl flex items-center justify-center text-white/70 hover:text-white
                       shadow-card transition-all duration-200"
          >
            <BarChart2 className="w-4 h-4" />
          </motion.button>

          {/* Menu */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onMenuOpen}
            title="Menu"
            className="w-10 h-10 glass-panel rounded-xl flex items-center justify-center text-white/70 hover:text-white
                       shadow-card transition-all duration-200 relative"
          >
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            )}
            <Menu className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

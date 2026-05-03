import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, TrendingUp } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { getCategory, timeAgo, getSeverityColor } from '../../utils/helpers';
import { SeverityBadge } from '../ui/Badge';

import { forwardRef } from 'react';

const IncidentFeedItem = forwardRef(({ incident, onClick, index }, ref) => {
  const cat = getCategory(incident.category);
  const color = getSeverityColor(incident.severity);

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      onClick={() => onClick(incident)}
      className="relative flex items-start gap-3 p-3 rounded-xl cursor-pointer
                 hover:bg-white/[0.06] border border-transparent hover:border-white/10
                 transition-all duration-200 group overflow-hidden"
    >
      {/* Left accent bar — severity colored */}
      <div
        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ backgroundColor: color }}
      />

      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
        style={{ backgroundColor: `${color}18`, border: `1px solid ${color}35` }}
      >
        {cat?.icon || '📍'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1 mb-1">
          <p className="text-white/90 text-xs font-semibold truncate group-hover:text-white transition-colors leading-tight">
            {incident.title}
          </p>
          <SeverityBadge severity={incident.severity} className="flex-shrink-0 text-[9px] px-1.5 py-0.5" />
        </div>
        <div className="flex items-center gap-2.5">
          <span className="micro-label flex items-center gap-0.5">
            <MapPin className="w-2.5 h-2.5 opacity-60" />
            {incident.city || 'Unknown'}
          </span>
          <span className="micro-label flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5 opacity-60" />
            {timeAgo(incident.created_at)}
          </span>
        </div>
      </div>
    </motion.div>
  );
});

export default function IncidentFeed({ onIncidentClick }) {
  const liveIncidents = useAppStore((s) => s.liveIncidents);

  // Deduplicate by id/_id and take first 8
  const recent = [];
  const seen = new Set();
  for (const inc of liveIncidents) {
    const uid = inc.id || inc._id;
    if (!uid || seen.has(uid)) continue;
    seen.add(uid);
    recent.push(inc);
    if (recent.length >= 8) break;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="absolute left-4 top-24 w-72 z-20 pointer-events-auto hidden md:block"
    >
      <div className="glass-panel rounded-2xl shadow-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/8">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span className="text-white font-semibold text-sm">Live Feed</span>
          </div>
          <span className="micro-label bg-white/8 px-2 py-0.5 rounded-full text-white/50">
            {liveIncidents.length} incidents
          </span>
        </div>

        {/* Gradient divider */}
        <div className="gradient-divider" />

        <div className="p-2 max-h-80 overflow-y-auto scrollbar-thin">
          <AnimatePresence mode="popLayout">
            {recent.length > 0 ? (
              recent.map((incident, i) => (
                <IncidentFeedItem
                  key={incident.id || incident._id}
                  incident={incident}
                  onClick={onIncidentClick}
                  index={i}
                />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-8 text-center"
              >
                <MapPin className="w-6 h-6 mx-auto mb-2 opacity-20 text-white" />
                <p className="micro-label">No nearby incidents</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

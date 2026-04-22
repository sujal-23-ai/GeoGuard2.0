import { motion } from 'framer-motion';
import { Plus, Siren, Navigation } from 'lucide-react';
import { usersApi } from '../../services/api';
import useAppStore from '../../store/useAppStore';
import { getRiskScore } from '../../utils/helpers';

export default function BottomBar() {
  const { liveIncidents, setReportPanelOpen, setSosActive, sosActive, isAuthenticated } = useAppStore();
  const riskScore = getRiskScore(liveIncidents);
  const riskColor = riskScore > 70 ? '#EF4444' : riskScore > 40 ? '#F59E0B' : '#10B981';
  const maxSeverity = liveIncidents.length > 0 ? Math.max(...liveIncidents.map((i) => i.severity)) : 0;
  const riskExplain = liveIncidents.length === 0
    ? 'No active incidents'
    : `${liveIncidents.length} incident${liveIncidents.length !== 1 ? 's' : ''} · max sev ${maxSeverity}`;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.3 }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto"
    >
      <div className="flex items-center gap-3 bg-surface/95 backdrop-blur-2xl border border-white/10 rounded-2xl px-4 py-3 shadow-card">
        {/* Risk Score */}
        <div className="flex items-center gap-2 pr-3 border-r border-white/10">
          <div className="relative w-8 h-8">
            <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
              <circle
                cx="16" cy="16" r="12" fill="none"
                stroke={riskColor}
                strokeWidth="3"
                strokeDasharray={`${(riskScore / 100) * 75.4} 75.4`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold" style={{ color: riskColor }}>
              {riskScore}
            </span>
          </div>
          <div>
            <div className="text-[9px] text-white/40 uppercase tracking-wider">Risk</div>
            <div className="text-xs font-semibold" style={{ color: riskColor }}>
              {riskScore > 70 ? 'High' : riskScore > 40 ? 'Medium' : 'Low'}
            </div>
            <div className="text-[9px] text-white/30 max-w-[90px] truncate">{riskExplain}</div>
          </div>
        </div>

        {/* Report Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setReportPanelOpen(true)}
          className="flex items-center gap-2 bg-primary/20 border border-primary/40 rounded-xl px-4 py-2
                     text-primary hover:bg-primary/30 hover:border-primary/60 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-semibold">Report</span>
        </motion.button>

        {/* SOS Button */}
        {isAuthenticated && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              const newState = !sosActive;
              setSosActive(newState);
              if (newState) {
                try {
                  const loc = useAppStore.getState().userLocation || { lng: -74.006, lat: 40.7128 };
                  await usersApi.sendSOS({ lng: loc.lng, lat: loc.lat });
                } catch (err) {
                  console.error('Failed to send SOS:', err);
                }
              }
            }}
            className={`flex items-center gap-2 border rounded-xl px-4 py-2 transition-all duration-200
              ${sosActive
                ? 'bg-red-500 border-red-400 text-white shadow-glow-red animate-pulse'
                : 'bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25'
              }`}
          >
            <Siren className="w-4 h-4" />
            <span className="text-sm font-semibold">{sosActive ? 'ACTIVE' : 'SOS'}</span>
          </motion.button>
        )}

        {/* Stats */}
        <div className="flex items-center gap-1.5 pl-3 border-l border-white/10 text-white/40">
          <Navigation className="w-3.5 h-3.5" />
          <span className="text-xs">{liveIncidents.length}</span>
        </div>
      </div>
    </motion.div>
  );
}

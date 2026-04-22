import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, Clock, AlertTriangle, X, CheckCircle, Shield } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

function formatDuration(seconds) {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}
function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export default function NavigationHUD({ onStop }) {
  const { navigation, journeyActive, journeyCompleted } = useAppStore();

  return (
    <AnimatePresence>
      {/* Active navigation HUD */}
      {journeyActive && navigation && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto"
        >
          <div className="bg-surface/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-card px-5 py-3 flex items-center gap-4 min-w-[340px]">
            {/* Pulsing navigation icon */}
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
              <Navigation className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>

            {/* Stats */}
            <div className="flex-1 grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-white font-bold text-sm">{formatDistance(navigation.distance)}</p>
                <p className="text-white/40 text-[9px] uppercase tracking-wider">Distance</p>
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-sm">{formatDuration(navigation.duration)}</p>
                <p className="text-white/40 text-[9px] uppercase tracking-wider">ETA</p>
              </div>
              <div className="text-center">
                <p className={`font-bold text-sm ${
                  navigation.riskLevel === 'high' ? 'text-red-400' :
                  navigation.riskLevel === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {navigation.riskLevel === 'high' ? '⚠️ High' :
                   navigation.riskLevel === 'medium' ? '⚡ Med' : '✅ Low'}
                </p>
                <p className="text-white/40 text-[9px] uppercase tracking-wider">Risk</p>
              </div>
            </div>

            {/* Stop button */}
            <button
              onClick={onStop}
              className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors flex-shrink-0"
              title="Stop navigation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Journey completed overlay */}
      {journeyCompleted && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onStop} />
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="relative bg-surface/98 backdrop-blur-2xl border border-emerald-500/30 rounded-3xl shadow-card p-8 text-center max-w-sm mx-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-white font-black text-xl mb-2">You've arrived safely ✅</h2>
            <p className="text-white/50 text-sm mb-6">
              Your journey has been completed. Stay safe out there!
            </p>
            <div className="flex gap-3">
              <button
                onClick={onStop}
                className="flex-1 py-2.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-xl text-sm font-semibold hover:bg-emerald-500/30 transition-colors"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

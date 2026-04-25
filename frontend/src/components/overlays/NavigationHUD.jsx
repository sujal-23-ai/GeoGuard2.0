import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navigation, Clock, AlertTriangle, X, CheckCircle,
  ArrowUp, ArrowUpRight, ArrowRight, ArrowDownRight,
  ArrowDown, ArrowDownLeft, ArrowLeft, ArrowUpLeft,
  CornerUpRight, CornerUpLeft, RotateCcw, Flag, MapPin, ChevronRight,
} from 'lucide-react';
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

/* ── Map a Mapbox maneuver modifier/type to an icon ──── */
const MANEUVER_ICONS = {
  'turn-right':       CornerUpRight,
  'turn-left':        CornerUpLeft,
  'sharp right':      ArrowDownRight,
  'sharp left':       ArrowDownLeft,
  'slight right':     ArrowUpRight,
  'slight left':      ArrowUpLeft,
  'straight':         ArrowUp,
  'right':            CornerUpRight,
  'left':             CornerUpLeft,
  'uturn':            RotateCcw,
  'depart':           Navigation,
  'arrive':           Flag,
  'roundabout':       RotateCcw,
  'rotary':           RotateCcw,
  'merge':            ArrowUp,
  'fork':             ArrowUpRight,
  'continue':         ArrowUp,
};

function getManeuverIcon(step) {
  if (!step) return ArrowUp;
  const modifier = step.maneuver?.modifier || '';
  const type = step.maneuver?.type || '';

  // Check modifier first
  if (modifier.includes('uturn'))        return RotateCcw;
  if (modifier.includes('sharp right'))  return ArrowDownRight;
  if (modifier.includes('sharp left'))   return ArrowDownLeft;
  if (modifier.includes('slight right')) return ArrowUpRight;
  if (modifier.includes('slight left'))  return ArrowUpLeft;
  if (modifier.includes('right'))        return CornerUpRight;
  if (modifier.includes('left'))         return CornerUpLeft;
  if (modifier.includes('straight'))     return ArrowUp;

  // Fallback to type
  if (type === 'arrive')    return Flag;
  if (type === 'depart')    return Navigation;
  if (type === 'roundabout' || type === 'rotary') return RotateCcw;

  return MANEUVER_ICONS[type] || ArrowUp;
}

function getManeuverColor(step) {
  if (!step) return '#10B981';
  const type = step.maneuver?.type || '';
  if (type === 'arrive') return '#3B82F6';
  if (type === 'depart') return '#10B981';
  const modifier = step.maneuver?.modifier || '';
  if (modifier.includes('uturn')) return '#F59E0B';
  return '#10B981';
}

/* ── Find the current step based on user location ──── */
function findCurrentStep(steps, userLocation) {
  if (!steps?.length || !userLocation) return { current: steps?.[0] || null, next: steps?.[1] || null, index: 0 };

  let closestIdx = 0;
  let closestDist = Infinity;

  for (let i = 0; i < steps.length; i++) {
    const loc = steps[i].maneuver?.location;
    if (!loc) continue;
    const dLat = (userLocation.lat - loc[1]) * 111320;
    const dLng = (userLocation.lng - loc[0]) * 111320 * Math.cos(userLocation.lat * Math.PI / 180);
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    if (dist < closestDist) {
      closestDist = dist;
      closestIdx = i;
    }
  }

  // If we're within 30m of the step, advance to the next one
  if (closestDist < 30 && closestIdx < steps.length - 1) {
    closestIdx += 1;
  }

  return {
    current: steps[closestIdx] || null,
    next: steps[closestIdx + 1] || null,
    index: closestIdx,
    distToStep: closestDist,
  };
}

export default function NavigationHUD({ onStop }) {
  const { navigation, journeyActive, journeyCompleted, userLocation } = useAppStore();

  const stepInfo = useMemo(
    () => findCurrentStep(navigation?.steps, userLocation),
    [navigation?.steps, userLocation]
  );

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
          <div className="bg-surface/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-card overflow-hidden min-w-[380px] max-w-[440px]">

            {/* ── Current maneuver instruction ─────────── */}
            {stepInfo.current && (
              <motion.div
                key={stepInfo.index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 pt-3 pb-2 flex items-center gap-3"
              >
                {/* Arrow icon */}
                <motion.div
                  initial={{ scale: 0.5, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${getManeuverColor(stepInfo.current)}20`,
                    border: `1.5px solid ${getManeuverColor(stepInfo.current)}50`,
                  }}
                >
                  {(() => {
                    const Icon = getManeuverIcon(stepInfo.current);
                    return <Icon className="w-6 h-6" style={{ color: getManeuverColor(stepInfo.current) }} />;
                  })()}
                </motion.div>

                {/* Instruction text */}
                <div className="flex-1 min-w-0">
                  {stepInfo.current.distance != null && (
                    <p className="text-white font-black text-lg leading-tight">
                      {formatDistance(stepInfo.current.distance)}
                    </p>
                  )}
                  <p className="text-white/60 text-xs leading-snug mt-0.5 line-clamp-2">
                    {stepInfo.current.maneuver?.instruction || stepInfo.current.name || 'Continue ahead'}
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── Next maneuver preview ───────────────── */}
            {stepInfo.next && (
              <div className="mx-4 mb-2 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/4 border border-white/6">
                <span className="text-white/25 text-[9px] uppercase tracking-wider font-semibold">Then</span>
                {(() => {
                  const NextIcon = getManeuverIcon(stepInfo.next);
                  return <NextIcon className="w-3 h-3 text-white/40" />;
                })()}
                <span className="text-white/40 text-[10px] truncate flex-1">
                  {stepInfo.next.maneuver?.instruction || stepInfo.next.name || 'Continue'}
                </span>
                {stepInfo.next.distance != null && (
                  <span className="text-white/30 text-[10px] flex-shrink-0">
                    {formatDistance(stepInfo.next.distance)}
                  </span>
                )}
              </div>
            )}

            {/* ── Stats bar ──────────────────────────── */}
            <div className="flex items-center gap-1 px-4 py-2.5 border-t border-white/8">
              {/* Pulsing navigation icon */}
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mr-1">
                <Navigation className="w-4 h-4 text-emerald-400 animate-pulse" />
              </div>

              {/* Stats */}
              <div className="flex-1 grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-white font-bold text-xs">{formatDistance(navigation.distance)}</p>
                  <p className="text-white/35 text-[8px] uppercase tracking-wider">Distance</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-xs">{formatDuration(navigation.duration)}</p>
                  <p className="text-white/35 text-[8px] uppercase tracking-wider">ETA</p>
                </div>
                <div className="text-center">
                  <p className={`font-bold text-xs ${
                    navigation.riskLevel === 'high' ? 'text-red-400' :
                    navigation.riskLevel === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {navigation.riskLevel === 'high' ? '⚠️ High' :
                     navigation.riskLevel === 'medium' ? '⚡ Med' : '✅ Low'}
                  </p>
                  <p className="text-white/35 text-[8px] uppercase tracking-wider">Risk</p>
                </div>
              </div>

              {/* Stop button */}
              <button
                onClick={onStop}
                className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors flex-shrink-0 ml-1"
                title="Stop navigation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Step progress ───────────────────────── */}
            {navigation.steps?.length > 0 && (
              <div className="px-4 pb-2.5">
                <div className="flex items-center gap-1">
                  <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-emerald-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(2, (stepInfo.index / navigation.steps.length) * 100)}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="text-[9px] text-white/25 flex-shrink-0 ml-1">
                    {stepInfo.index + 1}/{navigation.steps.length}
                  </span>
                </div>
              </div>
            )}
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

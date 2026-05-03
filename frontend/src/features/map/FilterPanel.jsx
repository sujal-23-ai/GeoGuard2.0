import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, Check } from 'lucide-react';
import { useState } from 'react';
import useAppStore from '../../store/useAppStore';
import { INCIDENT_CATEGORIES, SEVERITY_COLORS, SEVERITY_LABELS } from '../../utils/constants';
import Button from '../../components/ui/Button';

export default function FilterPanel() {
  const [open, setOpen] = useState(false);
  const { filters, setFilters, clearFilters } = useAppStore();
  const hasFilters = filters.category || filters.severity || filters.since;

  const TIME_OPTS = [
    { label: 'Live (6h)', ms: null },
    { label: '24h', ms: 86_400_000 },
    { label: 'Last Month', ms: 2_592_000_000 },
    { label: 'Till Date', ms: 'all' },
  ];

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className={`absolute top-24 right-4 z-20 pointer-events-auto
                   flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold
                   transition-all duration-200 shadow-card
                   ${hasFilters
                     ? 'bg-primary text-white border border-primary/50 shadow-glow-blue'
                     : 'bg-surface/95 backdrop-blur-xl border border-white/10 text-white/70 hover:text-white hover:border-white/20'
                   }`}
      >
        <SlidersHorizontal className="w-4 h-4" />
        {hasFilters ? 'Filtered' : 'Filter'}
        {hasFilters && (
          <span className="w-5 h-5 rounded-full bg-white/20 text-white text-[10px] font-bold flex items-center justify-center">
            {[filters.category, filters.severity, filters.since].filter(Boolean).length}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40"
            />

            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-36 right-4 z-50 w-72 pointer-events-auto"
            >
              <div className="bg-surface/98 backdrop-blur-2xl border border-white/12 rounded-2xl shadow-card overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-white/8">
                  <span className="text-white font-semibold text-sm">Filters</span>
                  <div className="flex items-center gap-2">
                    {hasFilters && (
                      <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300">
                        Clear all
                      </button>
                    )}
                    <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {/* Category */}
                  <div>
                    <label className="text-xs text-white/50 mb-2 block font-semibold">Category</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {INCIDENT_CATEGORIES.map((cat) => {
                        const active = filters.category === cat.id;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => setFilters({ category: active ? null : cat.id })}
                            className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[9px] font-semibold transition-all
                              ${active ? 'scale-105' : 'bg-white/4 hover:bg-white/8 text-white/60'}`}
                            style={active ? {
                              backgroundColor: `${cat.color}25`,
                              border: `1px solid ${cat.color}60`,
                              color: cat.color,
                            } : { border: '1px solid transparent' }}
                          >
                            <span className="text-base">{cat.icon}</span>
                            <span className="truncate w-full text-center">{cat.label}</span>
                            {active && <Check className="w-2.5 h-2.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Severity */}
                  <div>
                    <label className="text-xs text-white/50 mb-2 block font-semibold">Min Severity</label>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((s) => {
                        const active = filters.severity === s;
                        const color = SEVERITY_COLORS[s];
                        return (
                          <button
                            key={s}
                            onClick={() => setFilters({ severity: active ? null : s })}
                            className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                            style={{
                              backgroundColor: active ? `${color}30` : 'rgba(255,255,255,0.05)',
                              border: `1px solid ${active ? color + '60' : 'transparent'}`,
                              color: active ? color : 'rgba(255,255,255,0.5)',
                            }}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time window */}
                  <div>
                    <label className="text-xs text-white/50 mb-2 block font-semibold">Time Window</label>
                    <div className="flex gap-1.5">
                      {TIME_OPTS.map(({ label, ms }) => {
                        const active = filters.since === ms;
                        return (
                          <button
                            key={label}
                            onClick={() => setFilters({ since: active ? null : ms })}
                            className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                            style={{
                              backgroundColor: active ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)',
                              border: `1px solid ${active ? 'rgba(99,102,241,0.5)' : 'transparent'}`,
                              color: active ? '#818CF8' : 'rgba(255,255,255,0.5)',
                            }}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Radius */}
                  <div>
                    <label className="text-xs text-white/50 mb-2 block font-semibold flex justify-between">
                      Radius <span className="text-white/70">{filters.radius} km</span>
                    </label>
                    <input
                      type="range" min={1} max={50} step={1}
                      value={filters.radius}
                      onChange={(e) => setFilters({ radius: parseInt(e.target.value) })}
                      className="w-full accent-primary"
                    />
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setOpen(false)}
                    className="w-full"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

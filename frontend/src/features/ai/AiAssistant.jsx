import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, Send, MapPin, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import Button from '../../components/ui/Button';
import useAppStore from '../../store/useAppStore';
import axios from 'axios';

const RISK_CONFIG = {
  low:    { color: '#10b981', icon: CheckCircle,    label: 'Safe',    bg: 'bg-emerald-500/10 border-emerald-500/25' },
  medium: { color: '#f59e0b', icon: AlertTriangle,  label: 'Caution', bg: 'bg-amber-500/10 border-amber-500/25' },
  high:   { color: '#ef4444', icon: AlertTriangle,  label: 'Danger',  bg: 'bg-red-500/10 border-red-500/25' },
};

const SUGGESTED = [
  'Is it safe to go downtown right now?',
  'Any incidents near me?',
  'Best route to avoid danger?',
  'What\'s the risk level in my area?',
];

export default function AiAssistant({ open, onClose }) {
  const { userLocation } = useAppStore();
  const [query, setQuery]     = useState('');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const ask = async (q = query) => {
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    const loc = userLocation || { lat: 40.7128, lng: -74.006 };
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const { data } = await axios.post(`${apiUrl}/api/prediction/ask`, {
        question: q,
        lat: loc.lat,
        lng: loc.lng,
      });
      setResult(data);
    } catch {
      setError('AI service unavailable — using demo data.');
      // Demo fallback
      setResult({
        risk_level: 'medium',
        risk_score: 42,
        message: '🟡 Moderate activity detected nearby. A few incidents reported in the last 24 hours.',
        main_concern: 'traffic',
        incident_count: 3,
        recommendation: 'Proceed with caution and stay alert',
      });
    } finally {
      setLoading(false);
    }
  };

  const cfg = result ? RISK_CONFIG[result.risk_level] || RISK_CONFIG.low : null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="w-full max-w-md bg-surface/98 backdrop-blur-2xl border border-white/12 rounded-3xl shadow-card overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/8">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-sm">AI Safety Assistant</h2>
                    <p className="text-white/40 text-xs">Ask about area risk or safe routes</p>
                  </div>
                </div>
                <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Query input */}
                <div className="flex gap-2">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && ask()}
                    placeholder="Is it safe to go to...?"
                    className="input-glass text-sm flex-1"
                  />
                  <Button onClick={() => ask()} loading={loading} size="md" className="px-4">
                    {loading ? null : <Send className="w-4 h-4" />}
                  </Button>
                </div>

                {/* Location indicator */}
                <div className="flex items-center gap-2 text-white/40 text-xs">
                  <MapPin className="w-3 h-3" />
                  <span>
                    {userLocation
                      ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                      : 'Default location (enable GPS for accuracy)'}
                  </span>
                </div>

                {/* Suggestions */}
                {!result && !loading && (
                  <div className="space-y-2">
                    <p className="micro-label">SUGGESTED QUESTIONS</p>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED.map((s) => (
                        <button
                          key={s}
                          onClick={() => { setQuery(s); ask(s); }}
                          className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Loading */}
                {loading && (
                  <div className="flex items-center gap-3 py-4">
                    <Loader className="w-5 h-5 text-primary animate-spin" />
                    <span className="text-white/60 text-sm">Analysing area data...</span>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <p className="text-amber-400 text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                {/* Result */}
                {result && cfg && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl border p-4 space-y-3 ${cfg.bg}`}
                  >
                    <div className="flex items-center gap-3">
                      <cfg.icon className="w-5 h-5" style={{ color: cfg.color }} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-sm">{cfg.label} Zone</span>
                          <span className="micro-label px-2 py-0.5 rounded-full bg-white/10" style={{ color: cfg.color }}>
                            RISK {result.risk_score}%
                          </span>
                        </div>
                        <p className="text-white/70 text-xs mt-0.5">{result.message}</p>
                      </div>
                    </div>

                    {/* Risk bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="micro-label">RISK LEVEL</span>
                        <span className="micro-label">{result.risk_score}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${result.risk_score}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: cfg.color }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {result.incident_count !== undefined && (
                        <div className="bg-white/5 rounded-xl p-2.5">
                          <div className="micro-label mb-1">NEARBY INCIDENTS</div>
                          <div className="text-white font-bold text-lg">{result.incident_count}</div>
                        </div>
                      )}
                      {result.main_concern && (
                        <div className="bg-white/5 rounded-xl p-2.5">
                          <div className="micro-label mb-1">MAIN CONCERN</div>
                          <div className="text-white font-semibold text-sm capitalize">{result.main_concern}</div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-start gap-2 bg-white/5 rounded-xl p-3">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-white/80 text-xs leading-relaxed">{result.recommendation}</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

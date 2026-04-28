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
  const [query, setQuery]       = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const ask = async (q = query) => {
    if (!q.trim()) return;
    
    const userMsg = { id: Date.now(), type: 'user', text: q };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);
    setError('');

    const loc = userLocation || { lat: 40.7128, lng: -74.006 };
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const { data } = await axios.post(`${apiUrl}/api/prediction/ask`, {
        question: q,
        lat: loc.lat,
        lng: loc.lng,
      });
      setMessages(prev => [...prev, { id: Date.now() + 1, type: 'ai', data }]);
    } catch {
      setError('AI service unavailable — using demo data.');
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        data: {
          risk_level: 'medium',
          risk_score: 42,
          message: '🟡 Moderate activity detected nearby. A few incidents reported in the last 24 hours.',
          main_concern: 'traffic',
          incident_count: 3,
          recommendation: 'Proceed with caution and stay alert',
        }
      }]);
    } finally {
      setLoading(false);
    }
  };

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

              <div className="p-5 flex flex-col gap-4 max-h-[75vh]">
                
                {/* Chat History */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin min-h-[300px]">
                  {messages.length === 0 && !loading && (
                    <div className="space-y-4 mt-2">
                      {/* Location indicator */}
                      <div className="flex items-center gap-2 text-white/40 text-xs bg-white/5 p-3 rounded-xl">
                        <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>
                          {userLocation
                            ? `Location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                            : 'Default location (enable GPS for accuracy)'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <p className="micro-label">SUGGESTED QUESTIONS</p>
                        <div className="flex flex-col gap-2">
                          {SUGGESTED.map((s) => (
                            <button
                              key={s}
                              onClick={() => { ask(s); }}
                              className="text-sm px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all text-left flex items-center justify-between group"
                            >
                              {s}
                              <Send className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {messages.map((msg) => {
                    if (msg.type === 'user') {
                      return (
                        <div key={msg.id} className="flex justify-end">
                          <div className="bg-primary/20 text-white text-sm px-4 py-3 rounded-2xl rounded-tr-sm max-w-[85%] border border-primary/20">
                            {msg.text}
                          </div>
                        </div>
                      );
                    } else {
                      const cfg = RISK_CONFIG[msg.data.risk_level] || RISK_CONFIG.low;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`rounded-2xl border p-4 space-y-3 max-w-[95%] ${cfg.bg}`}
                        >
                          <div className="flex items-center gap-3">
                            <cfg.icon className="w-5 h-5" style={{ color: cfg.color }} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-bold text-sm">{cfg.label} Zone</span>
                                <span className="micro-label px-2 py-0.5 rounded-full bg-white/10" style={{ color: cfg.color }}>
                                  RISK {msg.data.risk_score}%
                                </span>
                              </div>
                              <p className="text-white/70 text-xs mt-0.5">{msg.data.message}</p>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="micro-label">RISK LEVEL</span>
                              <span className="micro-label">{msg.data.risk_score}%</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${msg.data.risk_score}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: cfg.color }}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1">
                            {msg.data.incident_count !== undefined && (
                              <div className="bg-white/5 rounded-xl p-2.5">
                                <div className="micro-label mb-1">NEARBY INCIDENTS</div>
                                <div className="text-white font-bold text-lg">{msg.data.incident_count}</div>
                              </div>
                            )}
                            {msg.data.main_concern && (
                              <div className="bg-white/5 rounded-xl p-2.5">
                                <div className="micro-label mb-1">MAIN CONCERN</div>
                                <div className="text-white font-semibold text-sm capitalize">{msg.data.main_concern}</div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-start gap-2 bg-white/5 rounded-xl p-3">
                            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                            <p className="text-white/80 text-xs leading-relaxed">{msg.data.recommendation}</p>
                          </div>
                        </motion.div>
                      );
                    }
                  })}

                  {loading && (
                    <div className="flex items-center gap-3 py-4 text-white/60 text-sm">
                      <Loader className="w-5 h-5 text-primary animate-spin" />
                      Analysing area data...
                    </div>
                  )}

                  {error && (
                    <p className="text-amber-400 text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                      {error}
                    </p>
                  )}
                </div>

                {/* Query input */}
                <div className="flex gap-2 shrink-0 pt-3 border-t border-white/10">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && ask()}
                    placeholder="Ask about area risk or safe routes..."
                    className="input-glass text-sm flex-1"
                  />
                  <Button onClick={() => ask()} disabled={loading || !query.trim()} size="md" className="px-4">
                    {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

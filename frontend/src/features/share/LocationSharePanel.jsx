import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Copy, Check, Share2, StopCircle, Clock, Shield } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { shareApi } from '../../services/api';

function CountdownTimer({ expiry }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const tick = () => {
      const ms = new Date(expiry) - Date.now();
      if (ms <= 0) { setRemaining('Expired'); return; }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setRemaining(`${m}m ${s.toString().padStart(2, '0')}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiry]);

  return <span>{remaining}</span>;
}

export default function LocationSharePanel({ open, onClose }) {
  const { userLocation, isAuthenticated, shareActive, shareToken, shareExpiry, setShareSession, stopShare } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [message, setMessage] = useState('');
  const posUpdateRef = useRef(null);

  // Keep sharing position updated every 15 seconds
  useEffect(() => {
    if (!shareActive || !shareToken) { clearInterval(posUpdateRef.current); return; }

    const push = async () => {
      const loc = useAppStore.getState().userLocation;
      if (!loc) return;
      try { await shareApi.update(shareToken, { lat: loc.lat, lng: loc.lng }); } catch { /* silent */ }
    };

    posUpdateRef.current = setInterval(push, 15000);
    return () => clearInterval(posUpdateRef.current);
  }, [shareActive, shareToken]);

  const handleStart = useCallback(async () => {
    if (!userLocation) return;
    setLoading(true);
    try {
      const data = await shareApi.create({
        lat: userLocation.lat,
        lng: userLocation.lng,
        message: message || undefined,
      });
      setShareSession(data.token, data.expiresAt);
      setShareUrl(data.shareUrl);
    } catch {
      setShareUrl('');
    } finally {
      setLoading(false);
    }
  }, [userLocation, message, setShareSession]);

  const handleStop = useCallback(async () => {
    if (!shareToken) return;
    try { await shareApi.stop(shareToken); } catch { /* silent */ }
    stopShare();
    setShareUrl('');
  }, [shareToken, stopShare]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shareUrl]);

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
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="w-full max-w-sm bg-surface/98 backdrop-blur-2xl border border-white/12 rounded-3xl shadow-card overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/8">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <Share2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-sm">Share My Location</h2>
                    <p className="text-white/40 text-xs">Temporary 30-min link</p>
                  </div>
                </div>
                <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {!isAuthenticated && (
                  <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                    <Shield className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <p className="text-amber-300 text-xs">Sign in to share your location</p>
                  </div>
                )}

                {isAuthenticated && !shareActive && (
                  <>
                    {/* Current position */}
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-3">
                      <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-white/60 text-xs">
                        {userLocation
                          ? `${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}`
                          : 'Enable GPS to share your location'}
                      </span>
                    </div>

                    {/* Optional message */}
                    <div>
                      <label className="text-xs text-white/50 mb-1.5 block">Message (optional)</label>
                      <input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="e.g. Follow me to the meetup"
                        maxLength={80}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white
                                   placeholder-white/30 outline-none focus:border-primary/40 transition-colors"
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleStart}
                      disabled={!userLocation || loading}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm
                                 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400
                                 hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <Share2 className="w-4 h-4" />
                      {loading ? 'Creating link...' : 'Start Sharing'}
                    </motion.button>
                  </>
                )}

                {isAuthenticated && shareActive && shareUrl && (
                  <>
                    {/* Active share */}
                    <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-emerald-400 text-xs font-semibold">Sharing Active</span>
                        <div className="ml-auto flex items-center gap-1 text-white/40 text-[10px]">
                          <Clock className="w-3 h-3" />
                          <CountdownTimer expiry={shareExpiry} />
                        </div>
                      </div>
                    </div>

                    {/* Share link */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-white/50">Share link</label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white/60 truncate font-mono">
                          {shareUrl}
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={handleCopy}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                            copied
                              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                              : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
                          }`}
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </motion.button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCopy}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary/20 border border-primary/40
                                   text-primary hover:bg-primary/30 transition-all"
                      >
                        {copied ? 'Copied!' : 'Copy Link'}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleStop}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500/15 border border-red-500/30
                                   text-red-400 hover:bg-red-500/25 transition-all flex items-center justify-center gap-2"
                      >
                        <StopCircle className="w-4 h-4" />
                        Stop
                      </motion.button>
                    </div>
                  </>
                )}

                {/* SOS note */}
                <div className="flex items-start gap-2 bg-white/4 rounded-xl p-3">
                  <Shield className="w-3.5 h-3.5 text-white/30 flex-shrink-0 mt-0.5" />
                  <p className="text-white/30 text-[10px] leading-relaxed">
                    Location link expires in 30 minutes. Anyone with the link can view your live position.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

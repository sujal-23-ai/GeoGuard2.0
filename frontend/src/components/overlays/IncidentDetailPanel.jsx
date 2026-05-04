import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ThumbsUp, ThumbsDown, MapPin, Clock, User, Shield, Eye, EyeOff, Play, ChevronLeft, ChevronRight, Brain, RefreshCw, Trash2 } from 'lucide-react';
import { SeverityBadge, CategoryBadge } from '../ui/Badge';
import { getCategory, timeAgo } from '../../utils/helpers';
import { useVoteIncident, useConfirmIncident, useDeleteIncident } from '../../hooks/useIncidents';
import useAppStore from '../../store/useAppStore';
import { getOptimizedUrl } from '../../utils/helpers';

/* ── Media viewer ────────────────────────────────────────── */
function MediaGallery({ mediaMeta = [], mediaUrls = [] }) {
  const [idx, setIdx]           = useState(0);
  const [revealed, setRevealed] = useState({});

  // Build unified media list
  const items = mediaMeta.length > 0
    ? mediaMeta
    : mediaUrls.map(url => ({ url, thumbnail: url, type: 'image', isSensitive: false }));

  if (!items.length) return null;

  const current = items[idx];
  const isHidden = current.isSensitive && !revealed[idx];

  return (
    <div className="space-y-2">
      <div className="micro-label flex items-center gap-2">
        MEDIA EVIDENCE
        <span className="text-white/30">({items.length} file{items.length > 1 ? 's' : ''})</span>
      </div>

      {/* Main viewer */}
      <div className="relative rounded-xl overflow-hidden bg-white/5 aspect-video">
        {current.type === 'video' ? (
          <div className="w-full h-full flex items-center justify-center bg-black/40">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Play className="w-5 h-5 text-white ml-0.5" />
            </div>
          </div>
        ) : (
          <img
            src={current.thumbnail || current.url}
            alt="incident media"
            className={`w-full h-full object-cover transition-all duration-300 ${isHidden ? 'blur-xl scale-105' : ''}`}
          />
        )}

        {/* Blur overlay / reveal */}
        {current.isSensitive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            {isHidden ? (
              <>
                <span className="text-xs text-red-300 bg-red-500/20 border border-red-500/30 px-2 py-0.5 rounded-full">
                  Sensitive Content
                </span>
                <button
                  onClick={() => setRevealed(r => ({ ...r, [idx]: true }))}
                  className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white bg-black/40 px-3 py-1.5 rounded-xl transition-all"
                >
                  <Eye className="w-3.5 h-3.5" /> Click to reveal
                </button>
              </>
            ) : (
              <button
                onClick={() => setRevealed(r => ({ ...r, [idx]: false }))}
                className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/50 flex items-center justify-center text-white/60 hover:text-white"
              >
                <EyeOff className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Navigation arrows */}
        {items.length > 1 && (
          <>
            <button onClick={() => setIdx(i => Math.max(0, i - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-black/50 flex items-center justify-center text-white/80 hover:text-white disabled:opacity-30"
              disabled={idx === 0}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setIdx(i => Math.min(items.length - 1, i + 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-black/50 flex items-center justify-center text-white/80 hover:text-white disabled:opacity-30"
              disabled={idx === items.length - 1}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {items.length > 1 && (
        <div className="flex gap-1.5">
          {items.map((m, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`w-12 h-9 rounded-lg overflow-hidden border-2 transition-all
                ${i === idx ? 'border-primary scale-105' : 'border-white/15 hover:border-white/30'}`}
            >
              <img src={m.thumbnail || m.url} alt="" className={`w-full h-full object-cover ${m.isSensitive ? 'blur-sm' : ''}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── AI confidence badge ─────────────────────────────────── */
function AiConfidence({ score, riskLevel }) {
  if (score === null || score === undefined) return null;
  const pct = Math.round(score * 100);
  const color = riskLevel === 'high' ? '#ef4444' : riskLevel === 'medium' ? '#f59e0b' : '#10b981';

  return (
    <div className="flex items-center gap-2 bg-white/5 rounded-xl p-2.5">
      <Brain className="w-3.5 h-3.5 text-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="micro-label">AI CONFIDENCE</span>
          <span className="text-[10px] font-bold" style={{ color }}>{pct}%</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
      </div>
      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full"
        style={{ backgroundColor: `${color}20`, color }}>
        {riskLevel}
      </span>
    </div>
  );
}

/* ── Animated vote count ─────────────────────────────────── */
function AnimatedCount({ value }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={value}
        initial={{ y: -8, opacity: 0, scale: 0.7 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 8, opacity: 0, scale: 0.7 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        className="text-xs tabular-nums inline-block min-w-[1ch] text-center"
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

/* ── Main component ──────────────────────────────────────── */
export default function IncidentDetailPanel({ onClose }) {
  // Read directly from store so optimistic updates are reflected instantly
  const incident = useAppStore((s) => s.selectedIncident);
  const { isAuthenticated, user } = useAppStore();
  const voteMutation = useVoteIncident();
  const confirmMutation = useConfirmIncident();
  const deleteMutation = useDeleteIncident();
  const cat = getCategory(incident?.category);

  const isOwner = user && incident && 
    (incident.userId?._id === user._id || incident.userId === user._id || incident.userId === user.id);

  const handleVote = (voteType) => {
    if (!isAuthenticated || !incident) return;
    voteMutation.mutate({ id: incident.id || incident._id, voteType });
  };

  return (
    <AnimatePresence>
      {incident && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="absolute top-4 right-4 w-80 z-30 pointer-events-auto"
        >
          <div className="bg-surface/97 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-card overflow-hidden max-h-[calc(100vh-5rem)] flex flex-col">
            {/* Header */}
            <div className="relative p-4 border-b border-white/8 flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${cat?.color || '#3B82F6'}18, transparent)` }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-2xl">{cat?.icon || '📍'}</span>
                  <div className="min-w-0">
                    <h3 className="text-white font-bold text-sm truncate">{incident.title}</h3>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <CategoryBadge {...cat} />
                      <SeverityBadge severity={incident.severity} />
                      {incident.isVerified && (
                        <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                          <Shield className="w-2.5 h-2.5" /> Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={onClose} className="text-white/40 hover:text-white transition-colors flex-shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto scrollbar-thin flex-1 p-4 space-y-3">
              {/* Meta row */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className="flex items-center gap-1.5 text-white/50 text-xs">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{incident.address || incident.city || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/50 text-xs">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span>{timeAgo(incident.created_at || incident.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/50 text-xs col-span-2">
                  <User className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{incident.reporter_name || 'Anonymous'}</span>
                  {incident.reporter_trust && (
                    <span className="text-primary text-[9px] font-semibold ml-auto">
                      Trust {incident.reporter_trust}
                    </span>
                  )}
                </div>
              </div>

              {/* Last updated */}
              <div className="text-[9px] text-white/25 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                Updated {timeAgo(incident.updatedAt || incident.created_at)}
              </div>

              {/* Description */}
              {incident.description && (
                <p className="text-white/70 text-xs leading-relaxed border-l-2 border-white/10 pl-3">
                  {incident.description}
                </p>
              )}

              {/* AI Confidence */}
              <AiConfidence
                score={incident.aiConfidence ?? incident.ai_confidence}
                riskLevel={incident.riskLevel ?? incident.risk_level}
              />

              {/* Media gallery */}
              <MediaGallery
                mediaMeta={incident.mediaMeta || incident.media_meta || []}
                mediaUrls={incident.mediaUrls || incident.media_urls || []}
              />

              {/* AI Tags */}
              {(incident.aiTags?.length > 0 || incident.ai_tags?.length > 0) && (
                <div className="flex flex-wrap gap-1.5">
                  {(incident.aiTags || incident.ai_tags || []).map(tag => (
                    <span key={tag} className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* ── Votes ─────────────────────────────────── */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/8">
                {/* Upvote */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleVote('up')}
                  disabled={!isAuthenticated}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-semibold text-xs transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${incident._userVote === 'up'
                      ? 'bg-emerald-400/20 border border-emerald-400/40 text-emerald-400'
                      : 'bg-transparent hover:bg-emerald-400/10 text-emerald-400/70 hover:text-emerald-400 border border-transparent hover:border-emerald-400/20'
                    }`}
                >
                  <motion.div
                    key={`up-${incident._userVote === 'up'}`}
                    initial={{ scale: 1 }}
                    animate={incident._userVote === 'up' ? { scale: [1, 1.4, 1], rotate: [0, -15, 0] } : {}}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </motion.div>
                  <AnimatedCount value={incident.upvotes || 0} />
                </motion.button>

                {/* Downvote */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleVote('down')}
                  disabled={!isAuthenticated}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-semibold text-xs transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${incident._userVote === 'down'
                      ? 'bg-red-400/20 border border-red-400/40 text-red-400'
                      : 'bg-transparent hover:bg-red-400/10 text-red-400/70 hover:text-red-400 border border-transparent hover:border-red-400/20'
                    }`}
                >
                  <motion.div
                    key={`down-${incident._userVote === 'down'}`}
                    initial={{ scale: 1 }}
                    animate={incident._userVote === 'down' ? { scale: [1, 1.4, 1], rotate: [0, 15, 0] } : {}}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </motion.div>
                  <AnimatedCount value={incident.downvotes || 0} />
                </motion.button>
              </div>

              {/* ── Confirm still happening ───────────────── */}
              {isAuthenticated && (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => confirmMutation.mutate(incident.id || incident._id)}
                  disabled={confirmMutation.isPending}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-semibold text-xs
                    text-amber-400 hover:bg-amber-400/10 border border-amber-400/20 hover:border-amber-400/40
                    transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <motion.div
                    animate={confirmMutation.isPending ? { rotate: 360 } : {}}
                    transition={confirmMutation.isPending ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : {}}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </motion.div>
                  <span>
                    Still Happening
                    {(incident.confirmCount || 0) > 0 && (
                      <motion.span
                        key={incident.confirmCount}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="ml-1"
                      >
                        · {incident.confirmCount} confirmed
                      </motion.span>
                    )}
                  </span>
                </motion.button>
              )}

              {/* ── Delete Report (Owner Only) ─────────────── */}
              {isOwner && (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this report?')) {
                      deleteMutation.mutate(incident.id || incident._id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-semibold text-xs
                    text-red-400 hover:bg-red-400/10 border border-red-400/20 hover:border-red-400/40
                    transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Report</span>
                </motion.button>
              )}

              {!isAuthenticated && (
                <p className="text-center text-white/30 text-[9px]">Sign in to vote or confirm</p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

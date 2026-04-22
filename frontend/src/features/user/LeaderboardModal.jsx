import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Star, Shield, Medal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../../services/api';
import { getInitials, colorFromString } from '../../utils/helpers';
import { BADGES } from '../../utils/constants';
import useAppStore from '../../store/useAppStore';

const RANK_STYLES = {
  1: { bg: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/40', icon: '🥇', textColor: 'text-amber-400' },
  2: { bg: 'from-slate-400/20 to-slate-500/10', border: 'border-slate-400/40', icon: '🥈', textColor: 'text-slate-300' },
  3: { bg: 'from-amber-700/20 to-amber-800/10', border: 'border-amber-700/40', icon: '🥉', textColor: 'text-amber-600' },
};

function LeaderRow({ user, rank, currentUserId }) {
  const style = RANK_STYLES[rank] || {};
  const isMe = currentUserId && user._id === currentUserId;
  const badges = Array.isArray(user.badges) ? user.badges : [];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.04 }}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all
        ${rank <= 3
          ? `bg-gradient-to-r ${style.bg} ${style.border}`
          : isMe
            ? 'bg-primary/10 border-primary/25'
            : 'bg-white/3 border-white/8'
        }`}
    >
      {/* Rank */}
      <div className="w-8 text-center flex-shrink-0">
        {rank <= 3 ? (
          <span className="text-xl">{style.icon}</span>
        ) : (
          <span className={`text-sm font-bold ${isMe ? 'text-primary' : 'text-white/40'}`}>#{rank}</span>
        )}
      </div>

      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
        style={{ background: colorFromString(user.name || '') }}
      >
        {user.avatarUrl
          ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-xl object-cover" />
          : getInitials(user.name)
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={`font-semibold text-sm truncate ${isMe ? 'text-primary' : 'text-white'}`}>
            {user.name} {isMe && <span className="text-[10px] text-primary/70">(you)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Shield className="w-2.5 h-2.5 text-blue-400" />
          <span className="text-white/40 text-[10px]">{user.trustScore ?? 100} trust</span>
          {badges.slice(0, 2).map((b) => {
            const def = BADGES.find((bd) => bd.id === (b.id || b));
            return def ? (
              <span key={b.id || b} title={def.label} className="text-xs">{def.icon}</span>
            ) : null;
          })}
        </div>
      </div>

      {/* Points */}
      <div className="text-right flex-shrink-0">
        <div className={`font-black text-sm ${rank <= 3 ? style.textColor : isMe ? 'text-primary' : 'text-white'}`}>
          {(user.points || 0).toLocaleString()}
        </div>
        <div className="text-white/30 text-[10px]">pts</div>
      </div>
    </motion.div>
  );
}

export default function LeaderboardModal({ open, onClose }) {
  const { user } = useAppStore();

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => usersApi.getLeaderboard(),
    enabled: open,
    staleTime: 1000 * 60 * 2,
  });

  const leaders = data?.leaders || [];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="fixed inset-4 md:inset-auto md:top-[10%] md:left-1/2 md:-translate-x-1/2 md:w-[420px] md:max-h-[80vh] z-50 flex flex-col"
          >
            <div className="bg-surface/98 backdrop-blur-2xl border border-white/12 rounded-3xl shadow-card flex flex-col overflow-hidden h-full md:max-h-[80vh]">
              {/* Header */}
              <div className="relative p-5 border-b border-white/8 flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-white font-bold text-lg">Leaderboard</h2>
                      <p className="text-white/40 text-xs">Top community reporters</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Top 3 podium */}
              {!isLoading && leaders.length >= 3 && (
                <div className="flex items-end justify-center gap-4 px-6 pt-5 pb-4 border-b border-white/8 flex-shrink-0">
                  {[leaders[1], leaders[0], leaders[2]].map((leader, podiumIdx) => {
                    const rank = [2, 1, 3][podiumIdx];
                    const heights = ['h-16', 'h-20', 'h-14'];
                    const style = RANK_STYLES[rank];
                    return (
                      <div key={leader._id} className="flex flex-col items-center gap-1.5 flex-1">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs"
                          style={{ background: colorFromString(leader.name || '') }}
                        >
                          {getInitials(leader.name)}
                        </div>
                        <span className="text-white text-xs font-semibold truncate max-w-[70px] text-center">{leader.name}</span>
                        <span className={`text-[10px] font-black ${style.textColor}`}>{leader.points?.toLocaleString()} pts</span>
                        <div className={`w-full ${heights[podiumIdx]} rounded-t-xl bg-gradient-to-t ${style.bg} border-t ${style.border} flex items-center justify-center text-2xl`}>
                          {style.icon}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Full list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
                {isLoading ? (
                  <div className="py-12 flex items-center justify-center">
                    <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : leaders.length > 0 ? (
                  leaders.map((leader, i) => (
                    <LeaderRow key={leader._id} user={leader} rank={i + 1} currentUserId={user?._id || user?.id} />
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <Medal className="w-10 h-10 text-white/20 mx-auto mb-3" />
                    <p className="text-white/40 text-sm">No reporters yet</p>
                    <p className="text-white/25 text-xs mt-1">Report incidents to join the leaderboard</p>
                  </div>
                )}
              </div>

              {/* My rank footer */}
              {user && leaders.length > 0 && (
                <div className="p-4 border-t border-white/8 bg-primary/5 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary" />
                      <span className="text-white/70 text-sm">Your rank</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white/50 text-sm">{(user.points || 0).toLocaleString()} pts</span>
                      <span className="text-primary font-bold text-sm">
                        #{leaders.findIndex((l) => l._id === (user._id || user.id)) + 1 || '—'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { BADGES } from '../../utils/constants';

export function BadgeCard({ badge, earned = false, compact = false }) {
  const def = BADGES.find((b) => b.id === (badge?.id || badge)) || { label: 'Unknown', icon: '🏅', description: '' };

  if (compact) {
    return (
      <div
        title={`${def.label}: ${def.description}`}
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all
          ${earned ? 'bg-amber-500/15 border border-amber-500/30' : 'bg-white/5 border border-white/10 grayscale opacity-40'}`}
      >
        {def.icon}
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className={`p-3 rounded-xl border transition-all
        ${earned
          ? 'bg-amber-500/10 border-amber-500/30'
          : 'bg-white/3 border-white/8 opacity-50'
        }`}
    >
      <div className="flex items-start gap-2.5">
        <span className={`text-xl flex-shrink-0 ${!earned && 'grayscale'}`}>{def.icon}</span>
        <div className="min-w-0">
          <p className={`text-xs font-bold truncate ${earned ? 'text-amber-300' : 'text-white/40'}`}>{def.label}</p>
          <p className="text-white/30 text-[10px] mt-0.5 leading-tight">{def.description}</p>
          {earned && badge?.awardedAt && (
            <p className="text-amber-500/60 text-[9px] mt-1">
              Earned {new Date(badge.awardedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        {!earned && (
          <span className="ml-auto text-[9px] text-white/25 font-semibold bg-white/5 px-1.5 py-0.5 rounded-full flex-shrink-0">
            Locked
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default function BadgesDisplay({ earnedBadges = [], compact = false }) {
  const earnedIds = earnedBadges.map((b) => b?.id || b);

  if (compact) {
    return (
      <div className="flex gap-1.5 flex-wrap">
        {BADGES.map((badge) => (
          <BadgeCard key={badge.id} badge={badge.id} earned={earnedIds.includes(badge.id)} compact />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-amber-400" />
        <span className="text-white/70 text-sm font-semibold">
          Badges
          <span className="text-white/30 text-xs ml-1.5">({earnedIds.length}/{BADGES.length} earned)</span>
        </span>
      </div>
      <div className="space-y-2">
        {BADGES.map((badge) => (
          <BadgeCard
            key={badge.id}
            badge={earnedBadges.find((b) => (b?.id || b) === badge.id) || badge.id}
            earned={earnedIds.includes(badge.id)}
          />
        ))}
      </div>
    </div>
  );
}

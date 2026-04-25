import { motion, AnimatePresence } from 'framer-motion';
import { X, LogOut, LogIn, Trophy, Settings, Shield, Bell, MapPin, ChevronRight, Star, Route, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import useAppStore from '../../store/useAppStore';
import AuthModal from '../auth/AuthModal';
import BadgesDisplay from './BadgesDisplay';
import { getInitials, colorFromString } from '../../utils/helpers';

function NotificationItem({ n, onDismiss }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-xl bg-white/4 border border-white/8">
      <span className="text-base">{n.type === 'sos' ? '🚨' : n.type === 'incident' ? '⚠️' : 'ℹ️'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-white/90 text-xs font-semibold">{n.title}</p>
        <p className="text-white/50 text-[10px] truncate">{n.message}</p>
      </div>
      <button onClick={() => onDismiss(n.id)} className="text-white/30 hover:text-white/60">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function UserMenu({ open, onClose }) {
  const {
    user, isAuthenticated, logout,
    notifications, dismissNotification,
    setLeaderboardOpen, setRoutingPanelOpen, setAdminPanelOpen,
    setProfilePanelOpen, setSettingsPanelOpen,
    menuInitialTab, setMenuInitialTab,
  } = useAppStore();
  const [authOpen, setAuthOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('menu');

  useEffect(() => {
    if (open && menuInitialTab && menuInitialTab !== 'menu') {
      setActiveTab(menuInitialTab);
      setMenuInitialTab('menu');
    } else if (!open) {
      setActiveTab('menu');
    }
  }, [open, menuInitialTab]);

  const handleAction = (action) => {
    action();
    onClose();
  };

  const menuItems = [
    { icon: MapPin, label: 'Map Dashboard', action: () => handleAction(() => {}) },
    ...(isAuthenticated ? [{ icon: Shield, label: 'My Profile', action: () => handleAction(() => setProfilePanelOpen(true)) }] : []),
    { icon: Route, label: 'Smart Routing', action: () => handleAction(() => setRoutingPanelOpen(true)) },
    { icon: Trophy, label: 'Leaderboard', action: () => handleAction(() => setLeaderboardOpen(true)) },
    { icon: Bell, label: 'Notifications', action: () => setActiveTab('notifications') },
    ...(user?.role === 'admin' || user?.role === 'moderator'
      ? [{ icon: Lock, label: 'Admin Panel', action: () => handleAction(() => setAdminPanelOpen(true)), highlight: true }]
      : []
    ),
    { icon: Settings, label: 'Settings', action: () => handleAction(() => setSettingsPanelOpen(true)) },
  ];

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black z-40"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed right-0 top-0 bottom-0 w-72 z-50 bg-surface/98 backdrop-blur-2xl border-l border-white/10 shadow-card flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/8 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white font-bold">Menu</span>
                  <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ background: colorFromString(user?.name || '') }}
                      >
                        {getInitials(user?.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{user?.name}</p>
                        <p className="text-white/40 text-xs truncate">{user?.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Star className="w-3 h-3 text-amber-400" />
                          <span className="text-amber-400 text-[10px] font-semibold">{user?.points || 0} pts</span>
                          <Shield className="w-3 h-3 text-primary" />
                          <span className="text-primary text-[10px] font-semibold">{user?.trustScore || user?.trust_score || 100} trust</span>
                        </div>
                      </div>
                    </div>

                    {/* Badges compact row */}
                    <BadgesDisplay earnedBadges={user?.badges || []} compact />
                  </div>
                ) : (
                  <button
                    onClick={() => { setAuthOpen(true); }}
                    className="w-full flex items-center gap-3 p-3 bg-primary/10 border border-primary/25 rounded-xl hover:bg-primary/20 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <LogIn className="w-4 h-4 text-white/60" />
                    </div>
                    <div className="text-left">
                      <p className="text-white text-sm font-semibold">Sign In</p>
                      <p className="text-white/40 text-xs">Join the safety network</p>
                    </div>
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-3 border-b border-white/8 flex-shrink-0">
                {['menu', 'notifications', ...(isAuthenticated ? ['badges'] : [])].map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 capitalize
                      ${activeTab === t ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
                  >
                    {t === 'notifications'
                      ? `Alerts${notifications.length > 0 ? ` (${notifications.length})` : ''}`
                      : t}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                {activeTab === 'menu' && (
                  <nav className="space-y-1">
                    {menuItems.map(({ icon: Icon, label, action, highlight }) => (
                      <button
                        key={label}
                        onClick={action}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group
                          ${highlight
                            ? 'hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20'
                            : 'hover:bg-white/8'
                          }`}
                      >
                        <Icon className={`w-4 h-4 transition-colors ${highlight ? 'text-purple-400' : 'text-white/50 group-hover:text-white'}`} />
                        <span className={`text-sm font-medium transition-colors ${highlight ? 'text-purple-400' : 'text-white/70 group-hover:text-white'}`}>
                          {label}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-white/20 ml-auto group-hover:text-white/50 transition-colors" />
                      </button>
                    ))}

                    {isAuthenticated && (
                      <button
                        onClick={() => { logout(); onClose(); }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 transition-all group mt-4 border border-transparent hover:border-red-500/20"
                      >
                        <LogOut className="w-4 h-4 text-red-400/70 group-hover:text-red-400 transition-colors" />
                        <span className="text-red-400/70 text-sm font-medium group-hover:text-red-400 transition-colors">Sign Out</span>
                      </button>
                    )}
                  </nav>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-2">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <NotificationItem key={n.id} n={n} onDismiss={dismissNotification} />
                      ))
                    ) : (
                      <div className="py-10 text-center text-white/30 text-sm">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No notifications
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'badges' && isAuthenticated && (
                  <BadgesDisplay earnedBadges={user?.badges || []} />
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

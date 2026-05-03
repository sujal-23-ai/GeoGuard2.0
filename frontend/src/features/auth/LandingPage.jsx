import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Shield, Zap, Map, Users, AlertTriangle, ArrowRight, Activity, Sun, Moon } from 'lucide-react';
import { InteractiveMarketGlobe } from '../../components/globe/globe';
import Button from '../../components/ui/Button';
import AuthModal from './AuthModal';
import useAppStore from '../../store/useAppStore';
import UserMenu from '../user/UserMenu';
import ProfilePanel from '../user/ProfilePanel';
import SettingsPanel from '../user/SettingsPanel';

/* ── Animated counter ──────────────────────────────────── */
function Counter({ end, suffix = '' }) {
  const [n, setN] = useState(0);
  
  useEffect(() => {
    let current = 0;
    const step = end / 90;
    const t = setInterval(() => {
      current += step;
      if (current >= end) {
        setN(end);
        clearInterval(t);
      } else {
        setN(Math.floor(current));
      }
    }, 22);
    
    return () => clearInterval(t);
  }, [end]);
  
  return <span>{n.toLocaleString()}{suffix}</span>;
}

/* ── Parallax tilt card ────────────────────────────────── */
function TiltCard({ children, className = '' }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotX = useSpring(useTransform(y, [-60, 60], [6, -6]), { stiffness: 300, damping: 30 });
  const rotY = useSpring(useTransform(x, [-60, 60], [-6, 6]), { stiffness: 300, damping: 30 });

  const handleMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - r.left - r.width / 2);
    y.set(e.clientY - r.top - r.height / 2);
  };
  const reset = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ rotateX: rotX, rotateY: rotY, transformPerspective: 900 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Data ──────────────────────────────────────────────── */
const FEATURES = [
  { icon: Zap,           color: '#3B82F6', label: 'REAL-TIME',   title: 'Live Intelligence',    desc: 'WebSocket-pushed incident updates. Know the moment something happens near you.', action: 'notifications' },
  { icon: Map,           color: '#06B6D4', label: 'MAPPING',     title: '3D Map Experience',    desc: 'Immersive map with heatmaps, clustering, and custom incident layers.', action: 'map' },
  { icon: Users,         color: '#8B5CF6', label: 'COMMUNITY',   title: 'Crowdsourced Safety',  desc: 'Community-verified reports with trust scoring and gamification system.', action: 'map' },
  { icon: Shield,        color: '#10B981', label: 'ROUTING',     title: 'Smart Safe Routes',    desc: 'AI-powered routes that dynamically avoid danger zones in real time.', action: 'routing' },
  { icon: AlertTriangle, color: '#F59E0B', label: 'EMERGENCY',   title: 'SOS Mode',             desc: 'One-tap emergency broadcast to all community members nearby.', action: 'sos' },
  { icon: Activity,      color: '#F43F5E', label: 'ANALYTICS',   title: 'Deep Analytics',       desc: 'Rich dashboards for risk scoring, trend analysis, and city insights.', action: 'analytics' },
];

const STATS = [
  { label: 'ACTIVE USERS',       value: 24800,   suffix: '+' },
  { label: 'INCIDENTS TRACKED',  value: 1200000, suffix: '+' },
  { label: 'CITIES COVERED',     value: 340,     suffix: '' },
  { label: 'AVG RESPONSE',       value: 3,       suffix: 's' },
];

/* ── Main component ────────────────────────────────────── */
export default function LandingPage({ onEnterApp }) {
  const [authOpen, setAuthOpen] = useState(false);
  const { 
    theme, toggleTheme, isAuthenticated, user, logout, 
    setAnalyticsPanelOpen, setRoutingPanelOpen, setSosActive, 
    menuOpen, setMenuOpen, setMenuInitialTab,
    profilePanelOpen, setProfilePanelOpen,
    settingsPanelOpen, setSettingsPanelOpen
  } = useAppStore();
  const isDark = theme !== 'light';

  const handleFeatureClick = (action) => {
    if (action === 'analytics') setAnalyticsPanelOpen(true);
    else if (action === 'routing') setRoutingPanelOpen(true);
    else if (action === 'sos') setSosActive(true);
    else if (action === 'notifications') { setMenuInitialTab('notifications'); setMenuOpen(true); }
    onEnterApp();
  };

  return (
    <div className={`min-h-screen overflow-auto transition-colors duration-300 ${isDark ? 'bg-[#0B0F1A] text-white' : 'bg-[#F0F4F8] text-[#0F172A]'}`}>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">

        {/* Grid mesh */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: isDark
              ? 'linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)'
              : 'linear-gradient(rgba(0,0,0,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.05) 1px,transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />

        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-[120px]" />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-cyan-500/8 blur-[100px]" />
        </div>

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span className={`font-bold text-lg tracking-tight ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
              GeoGuard
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200
                ${isDark ? 'bg-white/8 hover:bg-white/12 text-white/70 border border-white/10' : 'bg-black/5 hover:bg-black/10 text-black/60 border border-black/10'}`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {isAuthenticated ? (
              <div className="flex items-center gap-3 ml-2">
                <img 
                  src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`} 
                  alt="User" 
                  className="w-8 h-8 rounded-full border border-white/20 cursor-pointer hover:border-primary/50 transition-colors" 
                  onClick={() => setMenuOpen(true)}
                  title="Open Menu"
                />
                <Button variant="ghost" size="sm" onClick={logout} className={isDark ? '' : '!text-[#0F172A]'}>Logout</Button>
                <Button size="sm" onClick={onEnterApp}>Launch App</Button>
              </div>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => setAuthOpen(true)}
                  className={isDark ? '' : '!text-[#0F172A] !border-black/15 !bg-black/5 hover:!bg-black/10'}>
                  Sign In
                </Button>
                <Button size="sm" onClick={onEnterApp}>Launch App</Button>
              </>
            )}
          </div>
        </nav>

        {/* Hero body: text left, globe right */}
        <div className="relative z-10 flex-1 flex items-center max-w-7xl mx-auto w-full px-6 pb-12 pt-4">
          {/* Text */}
          <div className="flex-1 max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="space-y-6"
            >
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 border text-sm font-semibold
                bg-primary/10 border-primary/25 text-primary">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                Real-Time Safety Intelligence
              </div>

              <h1 className={`text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                Stay Safe.{' '}
                <span className="bg-gradient-to-r from-primary to-accent-cyan bg-clip-text text-transparent">
                  Stay Ahead.
                </span>
              </h1>

              <p className={`text-lg leading-relaxed ${isDark ? 'text-white/55' : 'text-[#0F172A]/55'}`}>
                Real-time crowdsourced safety intelligence powered by community,
                AI analysis, and live map visualization. Know what's happening
                around you before it affects you.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button size="lg" onClick={onEnterApp} className="min-w-44">
                  Open Live Map <ArrowRight className="w-4 h-4" />
                </Button>
                {!isAuthenticated && (
                  <Button variant={isDark ? 'secondary' : 'primary'} size="lg" onClick={() => setAuthOpen(true)} className={`min-w-44 ${!isDark ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg' : ''}`}>
                    Create Free Account
                  </Button>
                )}
              </div>

              {/* Inline stats */}
              <div className="flex items-center gap-6 pt-2">
                {[{ v: '24K+', l: 'Users' }, { v: '340', l: 'Cities' }, { v: '3s', l: 'Response' }].map(({ v, l }) => (
                  <div key={l}>
                    <div className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>{v}</div>
                    <div className="micro-label mt-0.5">{l}</div>
                  </div>
                ))}
                <div className={`w-px h-8 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  <span className={`text-xs font-semibold ${isDark ? 'text-white/60' : 'text-[#0F172A]/60'}`}>Live now</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 3D Globe */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
            className="hidden lg:flex flex-1 items-center justify-center h-[580px]"
          >
            <div className="relative w-full h-full max-w-[560px] flex items-center justify-center">
              {/* Glow behind globe */}
              <div className="absolute inset-1/4 rounded-full bg-blue-500/20 blur-[60px] pointer-events-none" />
              <div className="w-[480px] h-[480px]">
                <InteractiveMarketGlobe />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────── */}
      <section className={`relative py-14 px-6 ${isDark ? 'border-y border-white/8' : 'border-y border-black/8'}`}>
        <div className="gradient-divider absolute top-0 inset-x-0" />
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="text-center"
            >
              <div className={`text-3xl md:text-4xl font-black mb-1 ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                <Counter end={s.value} suffix={s.suffix} />
              </div>
              <div className="micro-label">{s.label}</div>
            </motion.div>
          ))}
        </div>
        <div className="gradient-divider absolute bottom-0 inset-x-0" />
      </section>

      {/* ── Features ────────────────────────────────────── */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="micro-label mb-3 text-primary">CAPABILITIES</div>
          <h2 className={`text-4xl font-black mb-4 ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
            Everything you need to stay safe
          </h2>
          <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-white/50' : 'text-[#0F172A]/50'}`}>
            Built for communities, powered by real-time data and AI intelligence.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, color, label, title, desc, action }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              onClick={() => handleFeatureClick(action)}
              className="cursor-pointer"
            >
              <TiltCard className="h-full">
                <div className={`relative h-full p-6 rounded-2xl border transition-all duration-300 overflow-hidden group
                  ${isDark
                    ? 'bg-white/[0.03] border-white/8 hover:border-white/15 hover:bg-white/[0.06]'
                    : 'bg-white border-black/8 hover:border-black/15 hover:shadow-card-light'
                  }`}
                  style={{ '--accent-color': color }}
                >
                  {/* Left accent bar */}
                  <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ backgroundColor: color }} />

                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${color}18`, border: `1px solid ${color}35` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>

                  <div className="micro-label mb-2" style={{ color: `${color}cc` }}>{label}</div>
                  <h3 className={`font-bold text-base mb-2 ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>{title}</h3>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-white/50' : 'text-[#0F172A]/50'}`}>{desc}</p>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="py-24 px-6 text-center max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <div className="micro-label text-primary mb-4">GET STARTED</div>
          <h2 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
            Start protecting your community today
          </h2>
          <p className={isDark ? 'text-white/50' : 'text-[#0F172A]/50'}>
            Join thousands of people making their neighborhoods safer together.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
            <Button size="lg" onClick={onEnterApp}>
              Launch Map Now <ArrowRight className="w-5 h-5" />
            </Button>
            {!isAuthenticated && (
              <Button variant={isDark ? 'secondary' : 'primary'} size="lg" onClick={() => setAuthOpen(true)} className={!isDark ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg' : ''}>
                Create Free Account
              </Button>
            )}
          </div>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className={`border-t py-8 px-6 text-center text-sm ${isDark ? 'border-white/8 text-white/30' : 'border-black/8 text-[#0F172A]/35'}`}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className={`font-semibold ${isDark ? 'text-white/60' : 'text-[#0F172A]/60'}`}>GeoGuard</span>
        </div>
        <p>Real-Time Safety Intelligence Platform</p>
      </footer>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <UserMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <ProfilePanel open={profilePanelOpen} onClose={() => setProfilePanelOpen(false)} />
      <SettingsPanel open={settingsPanelOpen} onClose={() => setSettingsPanelOpen(false)} />
    </div>
  );
}

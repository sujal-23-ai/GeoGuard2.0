import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sun, Moon, Map, Eye, EyeOff, Radio, Bell, BellOff,
  Shield, Sliders, MapPin, Layers, Flame, ChevronDown, ChevronUp,
  Volume2, VolumeX, Navigation, Info, ExternalLink, Zap
} from 'lucide-react';
import useAppStore from '../../store/useAppStore';

/* ── tiny reusable toggle ─────────────────────────────────── */
function Toggle({ enabled, onChange, accentClass = 'bg-primary' }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none
        ${enabled ? accentClass : 'bg-white/10'}`}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md
          ${enabled ? 'left-[22px]' : 'left-0.5'}`}
      />
    </button>
  );
}

/* ── slider for numeric values ────────────────────────────── */
function RangeSlider({ value, min, max, step, onChange, unit, accentColor = '#3B82F6' }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-white/50 text-xs">
          {min} {unit}
        </span>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${accentColor}22`, color: accentColor }}
        >
          {value} {unit}
        </span>
        <span className="text-white/50 text-xs">
          {max} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${pct}%, rgba(255,255,255,0.1) ${pct}%, rgba(255,255,255,0.1) 100%)`,
        }}
      />
    </div>
  );
}

/* ── collapsible section ──────────────────────────────────── */
function Section({ title, icon: Icon, iconColor, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.03] transition-colors"
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${iconColor}18`, border: `1px solid ${iconColor}30` }}
        >
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
        <span className="text-white text-sm font-semibold flex-1 text-left">{title}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-white/30" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/30" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── setting row ──────────────────────────────────────────── */
function SettingRow({ icon: Icon, label, description, children }) {
  return (
    <div className="flex items-center gap-3">
      {Icon && <Icon className="w-4 h-4 text-white/40 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-white/90 text-xs font-medium">{label}</p>
        {description && <p className="text-white/40 text-[10px] mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export default function SettingsPanel({ open, onClose }) {
  const {
    theme, toggleTheme,
    showHeatmap, toggleHeatmap,
    showSatellite, toggleSatellite,
    showSafeZones, toggleSafeZones,
    liveMode, toggleLiveMode,
    filters, setFilters,
  } = useAppStore();

  /* local settings (not in store — UI-only prefs) */
  const [notifSound, setNotifSound] = useState(true);
  const [notifSOS, setNotifSOS] = useState(true);
  const [notifIncident, setNotifIncident] = useState(true);
  const [notifCommunity, setNotifCommunity] = useState(false);
  const [autoLocate, setAutoLocate] = useState(true);

  const isDark = theme === 'dark';

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed right-0 top-0 bottom-0 w-80 z-50 bg-surface/98 backdrop-blur-2xl border-l border-white/10 shadow-card flex flex-col"
          >
            {/* ── header ─────────────────────────────────── */}
            <div className="p-5 border-b border-white/8 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
                    <Sliders className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-base">Settings</h2>
                    <p className="text-white/40 text-[10px]">Customize your experience</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/40 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* ── scrollable content ─────────────────────── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">

              {/* ─ appearance ──────────────────────────────── */}
              <Section title="Appearance" icon={Sun} iconColor="#F59E0B">
                <SettingRow
                  icon={isDark ? Moon : Sun}
                  label="Dark Mode"
                  description="Toggle between dark and light themes"
                >
                  <Toggle
                    enabled={isDark}
                    onChange={toggleTheme}
                    accentClass="bg-indigo-500"
                  />
                </SettingRow>

                {/* theme preview strip */}
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => { if (!isDark) toggleTheme(); }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all border
                      ${isDark
                        ? 'bg-white/10 border-white/20 text-white'
                        : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:border-white/15'
                      }`}
                  >
                    <Moon className="w-3.5 h-3.5 mx-auto mb-1" />
                    Dark
                  </button>
                  <button
                    onClick={() => { if (isDark) toggleTheme(); }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all border
                      ${!isDark
                        ? 'bg-white/10 border-white/20 text-white'
                        : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:border-white/15'
                      }`}
                  >
                    <Sun className="w-3.5 h-3.5 mx-auto mb-1" />
                    Light
                  </button>
                </div>
              </Section>

              {/* ─ map preferences ─────────────────────────── */}
              <Section title="Map Preferences" icon={Map} iconColor="#3B82F6">
                <SettingRow
                  icon={Flame}
                  label="Heatmap Overlay"
                  description="Show incident density heatmap"
                >
                  <Toggle
                    enabled={showHeatmap}
                    onChange={toggleHeatmap}
                    accentClass="bg-orange-500"
                  />
                </SettingRow>

                <SettingRow
                  icon={Layers}
                  label="Satellite View"
                  description="Switch to satellite map tiles"
                >
                  <Toggle
                    enabled={showSatellite}
                    onChange={toggleSatellite}
                    accentClass="bg-emerald-500"
                  />
                </SettingRow>

                <SettingRow
                  icon={Shield}
                  label="Safe Zones"
                  description="Highlight verified safe areas"
                >
                  <Toggle
                    enabled={showSafeZones}
                    onChange={toggleSafeZones}
                    accentClass="bg-cyan-500"
                  />
                </SettingRow>

                <SettingRow
                  icon={Zap}
                  label="Live Mode"
                  description="Real-time incident updates via WebSocket"
                >
                  <Toggle
                    enabled={liveMode}
                    onChange={toggleLiveMode}
                    accentClass="bg-rose-500"
                  />
                </SettingRow>

                <SettingRow
                  icon={Navigation}
                  label="Auto-Locate"
                  description="Center map on your location on startup"
                >
                  <Toggle
                    enabled={autoLocate}
                    onChange={setAutoLocate}
                    accentClass="bg-violet-500"
                  />
                </SettingRow>
              </Section>

              {/* ─ alert radius ────────────────────────────── */}
              <Section title="Alert Radius" icon={MapPin} iconColor="#EF4444" defaultOpen={true}>
                <p className="text-white/50 text-[10px]">
                  Set how far from your location you want to receive incident alerts.
                </p>
                <RangeSlider
                  value={filters.radius || 10}
                  min={1}
                  max={50}
                  step={1}
                  unit="km"
                  accentColor="#EF4444"
                  onChange={(v) => setFilters({ radius: v })}
                />
              </Section>

              {/* ─ notifications ───────────────────────────── */}
              <Section title="Notifications" icon={Bell} iconColor="#8B5CF6">
                <SettingRow
                  icon={notifSound ? Volume2 : VolumeX}
                  label="Sound Alerts"
                  description="Play audio for critical notifications"
                >
                  <Toggle
                    enabled={notifSound}
                    onChange={setNotifSound}
                    accentClass="bg-purple-500"
                  />
                </SettingRow>

                <div className="gradient-divider" />

                <SettingRow
                  icon={Bell}
                  label="SOS Alerts"
                  description="Notify when someone nearby sends SOS"
                >
                  <Toggle
                    enabled={notifSOS}
                    onChange={setNotifSOS}
                    accentClass="bg-red-500"
                  />
                </SettingRow>

                <SettingRow
                  icon={Eye}
                  label="Nearby Incidents"
                  description="Alerts for new incidents in your radius"
                >
                  <Toggle
                    enabled={notifIncident}
                    onChange={setNotifIncident}
                    accentClass="bg-amber-500"
                  />
                </SettingRow>

                <SettingRow
                  icon={notifCommunity ? Eye : EyeOff}
                  label="Community Updates"
                  description="Votes, confirmations & comments"
                >
                  <Toggle
                    enabled={notifCommunity}
                    onChange={setNotifCommunity}
                    accentClass="bg-teal-500"
                  />
                </SettingRow>
              </Section>

              {/* ─ about ───────────────────────────────────── */}
              <Section title="About GeoGuard" icon={Info} iconColor="#6366F1" defaultOpen={false}>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">GeoGuard 2.0</p>
                      <p className="text-white/40 text-[10px]">Community Safety Platform</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/[0.04] rounded-xl p-2.5 text-center">
                      <p className="text-white/90 text-xs font-bold">v2.0.0</p>
                      <p className="text-white/40 text-[9px]">Version</p>
                    </div>
                    <div className="bg-white/[0.04] rounded-xl p-2.5 text-center">
                      <p className="text-white/90 text-xs font-bold">2026</p>
                      <p className="text-white/40 text-[9px]">Release</p>
                    </div>
                  </div>

                  <p className="text-white/40 text-[10px] leading-relaxed">
                    GeoGuard is a real-time geospatial safety intelligence platform.
                    Report incidents, navigate safely, and protect your community
                    with AI-powered risk analysis.
                  </p>

                  <a
                    href="https://github.com/sujal-23-ai/GeoGuard2.0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 bg-white/[0.04] rounded-xl hover:bg-white/[0.08] transition-colors group"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-white/40 group-hover:text-white/70 transition-colors" />
                    <span className="text-white/60 text-xs group-hover:text-white/90 transition-colors">
                      View on GitHub
                    </span>
                  </a>
                </div>
              </Section>
            </div>

            {/* ── footer ─────────────────────────────────── */}
            <div className="p-4 border-t border-white/8 flex-shrink-0">
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-primary/10 border border-primary/25 text-primary rounded-xl text-xs font-semibold hover:bg-primary/20 transition-all active:scale-[0.98]"
              >
                Done
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

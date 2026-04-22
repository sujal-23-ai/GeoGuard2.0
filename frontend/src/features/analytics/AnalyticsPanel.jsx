import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, BarChart2, PieChart, Activity } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import useAppStore from '../../store/useAppStore';
import { useAnalytics } from '../../hooks/useIncidents';
import { INCIDENT_CATEGORIES, SEVERITY_COLORS } from '../../utils/constants';
import { getRiskScore } from '../../utils/helpers';

const COLORS = ['#3B82F6', '#06B6D4', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#F97316', '#A78BFA', '#34D399', '#6B7280'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface/95 border border-white/10 rounded-xl p-2.5 text-xs shadow-card">
      <p className="text-white/60 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#3B82F6' }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

function StatCard({ title, value, icon: Icon, color, trend }) {
  return (
    <div className="bg-white/4 border border-white/8 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/50 text-xs">{title}</span>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {trend && <div className="text-xs text-emerald-400 mt-1">{trend}</div>}
    </div>
  );
}

export default function AnalyticsPanel() {
  const { analyticsPanelOpen, setAnalyticsPanelOpen, liveIncidents } = useAppStore();
  const { data: analytics, isLoading } = useAnalytics(7);
  const riskScore = getRiskScore(liveIncidents);

  const categoryData = (analytics?.byCategory || []).map((item, i) => ({
    name: INCIDENT_CATEGORIES.find((c) => c.id === item.category)?.label || item.category,
    count: parseInt(item.count),
    fill: COLORS[i % COLORS.length],
  }));

  const hourlyData = (analytics?.byHour || []).map((item) => ({
    hour: `${parseInt(item.hour)}:00`,
    incidents: parseInt(item.count),
  }));

  const severityData = (analytics?.bySeverity || []).map((item) => ({
    name: ['', 'Minor', 'Low', 'Moderate', 'High', 'Critical'][item.severity] || `S${item.severity}`,
    value: parseInt(item.count),
    fill: SEVERITY_COLORS[item.severity] || '#6B7280',
  }));

  return (
    <AnimatePresence>
      {analyticsPanelOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAnalyticsPanelOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-4 md:inset-8 z-50 max-w-4xl mx-auto"
          >
            <div className="bg-surface/98 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-card h-full flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <BarChart2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg">Safety Analytics</h2>
                    <p className="text-white/40 text-xs">Last 7 days • Real-time data</p>
                  </div>
                </div>
                <button onClick={() => setAnalyticsPanelOpen(false)} className="text-white/40 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <StatCard title="Total Incidents" value={analytics?.total || liveIncidents.length} icon={Activity} color="#3B82F6" trend="+12% vs last week" />
                      <StatCard title="Risk Score" value={riskScore} icon={TrendingUp} color={riskScore > 70 ? '#EF4444' : riskScore > 40 ? '#F59E0B' : '#10B981'} />
                      <StatCard title="Active Now" value={liveIncidents.filter((i) => i.severity >= 3).length} icon={BarChart2} color="#8B5CF6" />
                      <StatCard title="Categories" value={categoryData.length} icon={PieChart} color="#06B6D4" />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Category Chart */}
                      <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
                        <h3 className="text-white/70 text-sm font-semibold mb-4 flex items-center gap-2">
                          <BarChart2 className="w-4 h-4 text-primary" /> By Category
                        </h3>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={categoryData} barSize={18}>
                            <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                              {categoryData.map((entry, i) => <Cell key={i} fill={entry.fill} fillOpacity={0.85} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Severity Pie */}
                      <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
                        <h3 className="text-white/70 text-sm font-semibold mb-4 flex items-center gap-2">
                          <PieChart className="w-4 h-4 text-accent-cyan" /> By Severity
                        </h3>
                        <ResponsiveContainer width="100%" height={180}>
                          <RePieChart>
                            <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} strokeWidth={0}>
                              {severityData.map((entry, i) => <Cell key={i} fill={entry.fill} fillOpacity={0.85} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </RePieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap gap-2 justify-center mt-2">
                          {severityData.map((d) => (
                            <span key={d.name} className="flex items-center gap-1 text-[10px] text-white/50">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                              {d.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Hourly Chart */}
                    {hourlyData.length > 0 && (
                      <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
                        <h3 className="text-white/70 text-sm font-semibold mb-4 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-accent-purple" /> Incidents by Hour (24h)
                        </h3>
                        <ResponsiveContainer width="100%" height={140}>
                          <AreaChart data={hourlyData}>
                            <defs>
                              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="hour" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} interval={3} />
                            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="incidents" stroke="#8B5CF6" fill="url(#areaGrad)" strokeWidth={2} dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

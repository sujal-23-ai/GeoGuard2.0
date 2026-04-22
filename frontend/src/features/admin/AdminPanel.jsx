import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Users, AlertTriangle, CheckCircle, XCircle, Eye, EyeOff, ChevronRight, Activity, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import useAppStore from '../../store/useAppStore';
import { getCategory, timeAgo, getSeverityColor } from '../../utils/helpers';
import { SeverityBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getIncidents: (params) => api.get('/admin/incidents', { params }),
  verifyIncident: (id) => api.patch(`/admin/incidents/${id}/verify`),
  toggleIncident: (id) => api.patch(`/admin/incidents/${id}/toggle`),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUser: (id) => api.patch(`/admin/users/${id}/toggle`),
  setRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
};

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white/4 border border-white/8 rounded-xl p-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20`, border: `1px solid ${color}30` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <div className="text-xl font-black text-white">{value ?? '—'}</div>
        <div className="text-white/40 text-[10px]">{label}</div>
      </div>
    </div>
  );
}

function IncidentRow({ incident, onVerify, onToggle, verifyLoading, toggleLoading }) {
  const cat = getCategory(incident.category);
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/3 border border-white/8 hover:bg-white/6 transition-all">
      <span className="text-lg flex-shrink-0">{cat?.icon || '📍'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-white/90 text-xs font-semibold truncate">{incident.title}</p>
          <SeverityBadge severity={incident.severity} className="flex-shrink-0 text-[9px] px-1.5 py-0.5" />
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-white/40 text-[10px]">{incident.reporter_name || 'Anonymous'}</span>
          <span className="text-white/40 text-[10px]">{timeAgo(incident.createdAt)}</span>
          {incident.city && <span className="text-white/40 text-[10px]">{incident.city}</span>}
          {incident.isVerified && <span className="text-emerald-400 text-[10px] font-semibold">✓ Verified</span>}
          {!incident.isActive && <span className="text-red-400 text-[10px] font-semibold">Hidden</span>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!incident.isVerified && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onVerify(incident._id)}
            disabled={verifyLoading}
            title="Verify"
            className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/25 transition-all disabled:opacity-50"
          >
            <CheckCircle className="w-3.5 h-3.5" />
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => onToggle(incident._id)}
          disabled={toggleLoading}
          title={incident.isActive ? 'Hide' : 'Show'}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-50
            ${incident.isActive
              ? 'bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25'
              : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
            }`}
        >
          {incident.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </motion.button>
      </div>
    </div>
  );
}

function UserRow({ user, onToggle, onRoleChange, toggleLoading }) {
  const [roleOpen, setRoleOpen] = useState(false);

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/8 hover:bg-white/6 transition-all">
      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
        {user.name?.[0]?.toUpperCase() || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-white/90 text-xs font-semibold truncate">{user.name}</p>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full
            ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
              user.role === 'moderator' ? 'bg-blue-500/20 text-blue-400' :
              'bg-white/10 text-white/50'}`}>
            {user.role}
          </span>
          {!user.isActive && <span className="text-red-400 text-[9px] font-bold">Banned</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-white/40 text-[10px] truncate">{user.email}</span>
          <span className="text-amber-400 text-[10px]">{user.points || 0} pts</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Role picker */}
        <div className="relative">
          <button
            onClick={() => setRoleOpen(!roleOpen)}
            className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center hover:bg-blue-500/25 transition-all"
            title="Change role"
          >
            <Shield className="w-3.5 h-3.5" />
          </button>
          <AnimatePresence>
            {roleOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -5 }}
                className="absolute right-0 bottom-full mb-1 bg-surface/98 border border-white/15 rounded-xl shadow-card overflow-hidden z-10 min-w-[100px]"
              >
                {['user', 'moderator', 'admin'].map((role) => (
                  <button
                    key={role}
                    onClick={() => { onRoleChange(user._id, role); setRoleOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-white/10 transition-all
                      ${user.role === role ? 'text-primary' : 'text-white/70'}`}
                  >
                    {role}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => onToggle(user._id)}
          disabled={toggleLoading}
          title={user.isActive ? 'Ban user' : 'Unban user'}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-50
            ${user.isActive
              ? 'bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25'
              : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
            }`}
        >
          {user.isActive ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
        </motion.button>
      </div>
    </div>
  );
}

export default function AdminPanel({ open, onClose }) {
  const { user } = useAppStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [incidentPage, setIncidentPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const qc = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminApi.getStats,
    enabled: open,
    staleTime: 30000,
  });

  const { data: incidentsData, isLoading: loadingIncidents } = useQuery({
    queryKey: ['admin', 'incidents', incidentPage],
    queryFn: () => adminApi.getIncidents({ page: incidentPage, limit: 15 }),
    enabled: open && activeTab === 'incidents',
  });

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin', 'users', userPage, search],
    queryFn: () => adminApi.getUsers({ page: userPage, limit: 15, search }),
    enabled: open && activeTab === 'users',
  });

  const verifyMutation = useMutation({
    mutationFn: adminApi.verifyIncident,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'incidents'] }),
  });

  const toggleIncidentMutation = useMutation({
    mutationFn: adminApi.toggleIncident,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'incidents'] }),
  });

  const toggleUserMutation = useMutation({
    mutationFn: adminApi.toggleUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => adminApi.setRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const TABS = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
    { id: 'users', label: 'Users', icon: Users },
  ];

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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-4 md:inset-8 xl:inset-16 z-50 max-w-5xl mx-auto"
          >
            <div className="bg-surface/98 backdrop-blur-2xl border border-white/12 rounded-3xl shadow-card h-full flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/8 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg">Admin Panel</h2>
                    <p className="text-white/40 text-xs">Signed in as {user?.name} · {user?.role}</p>
                  </div>
                </div>
                <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-3 border-b border-white/8 flex-shrink-0">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
                      ${activeTab === id ? 'bg-primary/20 text-primary border border-primary/30' : 'text-white/50 hover:text-white hover:bg-white/8'}`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
                {/* Overview */}
                {activeTab === 'overview' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      <StatCard label="Total Users" value={stats?.totalUsers} icon={Users} color="#8B5CF6" />
                      <StatCard label="Active Users" value={stats?.activeUsers} icon={Users} color="#10B981" />
                      <StatCard label="Total Reports" value={stats?.totalIncidents} icon={AlertTriangle} color="#3B82F6" />
                      <StatCard label="Active Reports" value={stats?.activeIncidents} icon={Eye} color="#F59E0B" />
                      <StatCard label="Verified" value={stats?.verifiedIncidents} icon={CheckCircle} color="#10B981" />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <button
                        onClick={() => setActiveTab('incidents')}
                        className="flex items-center justify-between p-4 bg-white/4 border border-white/8 rounded-2xl hover:bg-white/7 hover:border-white/15 transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">Moderate Incidents</p>
                            <p className="text-white/40 text-xs">Verify, hide, or approve reports</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/30" />
                      </button>

                      <button
                        onClick={() => setActiveTab('users')}
                        className="flex items-center justify-between p-4 bg-white/4 border border-white/8 rounded-2xl hover:bg-white/7 hover:border-white/15 transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">Manage Users</p>
                            <p className="text-white/40 text-xs">Roles, bans, and trust scores</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/30" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Incidents */}
                {activeTab === 'incidents' && (
                  <div className="space-y-3">
                    {loadingIncidents ? (
                      <div className="py-12 flex justify-center">
                        <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      </div>
                    ) : (
                      <>
                        {(incidentsData?.incidents || []).map((incident) => (
                          <IncidentRow
                            key={incident._id}
                            incident={incident}
                            onVerify={(id) => verifyMutation.mutate(id)}
                            onToggle={(id) => toggleIncidentMutation.mutate(id)}
                            verifyLoading={verifyMutation.isPending}
                            toggleLoading={toggleIncidentMutation.isPending}
                          />
                        ))}

                        {incidentsData && (
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-white/40 text-xs">{incidentsData.total} total</span>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => setIncidentPage(p => Math.max(1, p - 1))} disabled={incidentPage <= 1}>Prev</Button>
                              <span className="text-white/50 text-xs self-center">Page {incidentPage}</span>
                              <Button variant="ghost" size="sm" onClick={() => setIncidentPage(p => p + 1)} disabled={incidentPage * 15 >= incidentsData.total}>Next</Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Users */}
                {activeTab === 'users' && (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setUserPage(1); }}
                        placeholder="Search users by name or email..."
                        className="input-glass pl-10 text-sm"
                      />
                    </div>

                    {loadingUsers ? (
                      <div className="py-12 flex justify-center">
                        <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      </div>
                    ) : (
                      <>
                        {(usersData?.users || []).map((u) => (
                          <UserRow
                            key={u._id}
                            user={u}
                            onToggle={(id) => toggleUserMutation.mutate(id)}
                            onRoleChange={(id, role) => roleMutation.mutate({ id, role })}
                            toggleLoading={toggleUserMutation.isPending}
                          />
                        ))}

                        {usersData && (
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-white/40 text-xs">{usersData.total} total users</span>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage <= 1}>Prev</Button>
                              <span className="text-white/50 text-xs self-center">Page {userPage}</span>
                              <Button variant="ghost" size="sm" onClick={() => setUserPage(p => p + 1)} disabled={userPage * 15 >= usersData.total}>Next</Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

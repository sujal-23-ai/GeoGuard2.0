import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Users, AlertTriangle, CheckCircle, XCircle, Eye, EyeOff, ChevronRight, Activity, Search, Trash2, Edit3, BellRing } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import useAppStore from '../../store/useAppStore';
import { getCategory, timeAgo } from '../../utils/helpers';
import { SeverityBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getIncidents: (params) => api.get('/admin/incidents', { params }),
  verifyIncident: (id) => api.patch(`/admin/incidents/${id}/verify`),
  toggleIncident: (id) => api.patch(`/admin/incidents/${id}/toggle`),
  deleteIncident: (id) => api.delete(`/admin/incidents/${id}`),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUser: (id) => api.patch(`/admin/users/${id}/toggle`),
  setRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  setTrust: (id, trustScore) => api.patch(`/admin/users/${id}/trust`, { trustScore }),
  getSosAlerts: (params) => api.get('/admin/sos', { params }),
  resolveSos: (id) => api.patch(`/admin/sos/${id}/resolve`),
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

function IncidentRow({ incident, onVerify, onToggle, onDelete, verifyLoading, toggleLoading, deleteLoading }) {
  const cat = getCategory(incident.category);
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/3 border border-white/8 hover:bg-white/6 transition-all group">
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
      <div className="flex items-center gap-1.5 flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
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
              ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25'
              : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
            }`}
        >
          {incident.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if(window.confirm('Are you sure you want to permanently delete this incident?')) {
              onDelete(incident._id);
            }
          }}
          disabled={deleteLoading}
          title="Delete Incident"
          className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center hover:bg-red-500/25 transition-all disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </div>
  );
}

function UserRow({ user, onToggle, onRoleChange, onTrustChange, toggleLoading }) {
  const [roleOpen, setRoleOpen] = useState(false);
  const [editingTrust, setEditingTrust] = useState(false);
  const [trustVal, setTrustVal] = useState(user.trustScore);

  const submitTrust = () => {
    onTrustChange(user._id, parseInt(trustVal, 10));
    setEditingTrust(false);
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/8 hover:bg-white/6 transition-all group">
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
          
          {editingTrust ? (
            <div className="flex items-center gap-1">
               <input type="number" value={trustVal} onChange={e => setTrustVal(e.target.value)} className="w-12 text-[10px] bg-black/50 border border-white/20 rounded px-1 text-white" />
               <button onClick={submitTrust} className="text-emerald-400 hover:text-emerald-300"><CheckCircle className="w-3 h-3" /></button>
               <button onClick={() => setEditingTrust(false)} className="text-white/40 hover:text-white/70"><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <span className="text-emerald-400 text-[10px] flex items-center gap-1 cursor-pointer hover:underline" onClick={() => setEditingTrust(true)} title="Edit Trust Score">
              {user.trustScore} trust <Edit3 className="w-2.5 h-2.5 inline opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
          )}
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
          onClick={() => {
            if(window.confirm(`Are you sure you want to ${user.isActive ? 'ban' : 'unban'} ${user.name}?`)) {
               onToggle(user._id);
            }
          }}
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

function SosRow({ alert, onResolve, resolveLoading }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/3 border border-red-500/20 hover:bg-white/6 transition-all">
      <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500 font-bold text-xs flex-shrink-0 animate-pulse">
        <BellRing className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-white/90 text-xs font-semibold truncate">SOS from {alert.userName}</p>
          {alert.isResolved && <span className="text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10">Resolved</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-white/40 text-[10px]">{timeAgo(alert.createdAt)}</span>
          <span className="text-white/50 text-[10px] truncate">{alert.lat.toFixed(4)}, {alert.lng.toFixed(4)}</span>
        </div>
        {alert.message && <p className="text-white/60 text-[11px] mt-1">{alert.message}</p>}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!alert.isResolved && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onResolve(alert._id)}
            disabled={resolveLoading}
            title="Mark as Resolved"
            className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/25 transition-all disabled:opacity-50"
          >
            <CheckCircle className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </div>
    </div>
  );
}

export default function AdminPanel({ open, onClose }) {
  const { user, addNotification } = useAppStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [incidentPage, setIncidentPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [sosPage, setSosPage] = useState(1);
  const qc = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminApi.getStats,
    enabled: open,
    staleTime: 30000,
  });

  const { data: incidentsData, isLoading: loadingIncidents } = useQuery({
    queryKey: ['admin', 'incidents', incidentPage],
    queryFn: () => adminApi.getIncidents({ page: incidentPage, limit: 10 }),
    enabled: open && activeTab === 'incidents',
  });

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin', 'users', userPage, search],
    queryFn: () => adminApi.getUsers({ page: userPage, limit: 10, search }),
    enabled: open && activeTab === 'users',
  });

  const { data: sosData, isLoading: loadingSos } = useQuery({
    queryKey: ['admin', 'sos', sosPage],
    queryFn: () => adminApi.getSosAlerts({ page: sosPage, limit: 10 }),
    enabled: open && activeTab === 'sos',
  });

  const verifyMutation = useMutation({
    mutationFn: adminApi.verifyIncident,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'incidents'] });
      addNotification({ type: 'success', title: 'Verified', message: 'Incident has been verified.' });
    },
    onError: (err) => {
      addNotification({ type: 'error', title: 'Verification Failed', message: err.response?.data?.error || err.message });
    }
  });

  const toggleIncidentMutation = useMutation({
    mutationFn: adminApi.toggleIncident,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'incidents'] });
      addNotification({ type: 'success', title: 'Updated', message: 'Incident visibility toggled.' });
    },
    onError: (err) => {
      addNotification({ type: 'error', title: 'Update Failed', message: err.response?.data?.error || err.message });
    }
  });

  const deleteIncidentMutation = useMutation({
    mutationFn: adminApi.deleteIncident,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'incidents'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      addNotification({ type: 'success', title: 'Deleted', message: 'Incident deleted permanently.' });
    },
    onError: (err) => {
      addNotification({ type: 'error', title: 'Deletion Failed', message: err.response?.data?.error || err.message });
    }
  });

  const toggleUserMutation = useMutation({
    mutationFn: adminApi.toggleUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      addNotification({ type: 'success', title: 'Updated', message: 'User status updated.' });
    },
    onError: (err) => {
      addNotification({ type: 'error', title: 'Update Failed', message: err.response?.data?.error || err.message });
    }
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => adminApi.setRole(id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      addNotification({ type: 'success', title: 'Updated', message: 'User role updated.' });
    },
    onError: (err) => {
      addNotification({ type: 'error', title: 'Role Update Failed', message: err.response?.data?.error || err.message });
    }
  });

  const trustMutation = useMutation({
    mutationFn: ({ id, trustScore }) => adminApi.setTrust(id, trustScore),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      addNotification({ type: 'success', title: 'Updated', message: 'User trust score updated.' });
    },
    onError: (err) => {
      addNotification({ type: 'error', title: 'Trust Update Failed', message: err.response?.data?.error || err.message });
    }
  });

  const resolveSosMutation = useMutation({
    mutationFn: adminApi.resolveSos,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'sos'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      addNotification({ type: 'success', title: 'Resolved', message: 'SOS Alert marked as resolved.' });
    },
    onError: (err) => {
      addNotification({ type: 'error', title: 'Failed to Resolve', message: err.response?.data?.error || err.message });
    }
  });

  const TABS = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'sos', label: 'SOS Alerts', icon: BellRing },
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
                    <h2 className="text-white font-bold text-lg">Admin Workspace</h2>
                    <p className="text-white/40 text-xs">Manage community safety & trust</p>
                  </div>
                </div>
                <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-3 border-b border-white/8 flex-shrink-0 overflow-x-auto scrollbar-hide">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex-shrink-0
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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      <StatCard label="Total Users" value={stats?.totalUsers} icon={Users} color="#8B5CF6" />
                      <StatCard label="Active Users" value={stats?.activeUsers} icon={Users} color="#10B981" />
                      <StatCard label="Total Reports" value={stats?.totalIncidents} icon={AlertTriangle} color="#3B82F6" />
                      <StatCard label="Active Reports" value={stats?.activeIncidents} icon={Eye} color="#F59E0B" />
                      <StatCard label="Verified Reports" value={stats?.verifiedIncidents} icon={CheckCircle} color="#10B981" />
                      <StatCard label="Recent (7d)" value={stats?.recentIncidents} icon={Activity} color="#06B6D4" />
                      <StatCard label="Total SOS" value={stats?.totalSos} icon={BellRing} color="#EF4444" />
                      <StatCard label="Unresolved SOS" value={stats?.unresolvedSos} icon={AlertTriangle} color="#EF4444" />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
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
                      
                      <button
                        onClick={() => setActiveTab('sos')}
                        className="flex items-center justify-between p-4 bg-white/4 border border-white/8 rounded-2xl hover:bg-white/7 hover:border-white/15 transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                            <BellRing className="w-5 h-5 text-red-400" />
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">SOS Alerts</p>
                            <p className="text-white/40 text-xs">View and resolve emergencies</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/30" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Incidents */}
                {activeTab === 'incidents' && (
                  <div className="space-y-3 h-full flex flex-col">
                    {loadingIncidents ? (
                      <div className="py-12 flex justify-center">
                        <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="space-y-3">
                        {(incidentsData?.incidents || []).map((incident) => (
                          <IncidentRow
                            key={incident._id}
                            incident={incident}
                            onVerify={(id) => verifyMutation.mutate(id)}
                            onToggle={(id) => toggleIncidentMutation.mutate(id)}
                            onDelete={(id) => deleteIncidentMutation.mutate(id)}
                            verifyLoading={verifyMutation.isPending}
                            toggleLoading={toggleIncidentMutation.isPending}
                            deleteLoading={deleteIncidentMutation.isPending}
                          />
                        ))}
                        </div>

                        {incidentsData && (
                          <div className="flex items-center justify-between pt-4 mt-auto">
                            <span className="text-white/40 text-xs">{incidentsData.total} total</span>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => setIncidentPage(p => Math.max(1, p - 1))} disabled={incidentPage <= 1}>Prev</Button>
                              <span className="text-white/50 text-xs self-center">Page {incidentPage}</span>
                              <Button variant="ghost" size="sm" onClick={() => setIncidentPage(p => p + 1)} disabled={incidentPage * 10 >= incidentsData.total}>Next</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Users */}
                {activeTab === 'users' && (
                  <div className="space-y-3 h-full flex flex-col">
                    <div className="relative shrink-0">
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
                      <div className="flex-1 flex flex-col justify-between overflow-y-auto">
                        <div className="space-y-3">
                        {(usersData?.users || []).map((u) => (
                          <UserRow
                            key={u._id}
                            user={u}
                            onToggle={(id) => toggleUserMutation.mutate(id)}
                            onRoleChange={(id, role) => roleMutation.mutate({ id, role })}
                            onTrustChange={(id, trustScore) => trustMutation.mutate({ id, trustScore })}
                            toggleLoading={toggleUserMutation.isPending}
                          />
                        ))}
                        </div>

                        {usersData && (
                          <div className="flex items-center justify-between pt-4 mt-auto">
                            <span className="text-white/40 text-xs">{usersData.total} total users</span>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage <= 1}>Prev</Button>
                              <span className="text-white/50 text-xs self-center">Page {userPage}</span>
                              <Button variant="ghost" size="sm" onClick={() => setUserPage(p => p + 1)} disabled={userPage * 10 >= usersData.total}>Next</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* SOS Alerts */}
                {activeTab === 'sos' && (
                  <div className="space-y-3 h-full flex flex-col">
                    {loadingSos ? (
                      <div className="py-12 flex justify-center">
                        <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col justify-between overflow-y-auto">
                        <div className="space-y-3">
                        {(sosData?.alerts || []).length === 0 ? (
                           <div className="text-center text-white/40 py-10">No SOS Alerts found</div>
                        ) : (
                          (sosData?.alerts || []).map((alert) => (
                            <SosRow
                              key={alert._id}
                              alert={alert}
                              onResolve={(id) => resolveSosMutation.mutate(id)}
                              resolveLoading={resolveSosMutation.isPending}
                            />
                          ))
                        )}
                        </div>

                        {sosData && sosData.total > 0 && (
                          <div className="flex items-center justify-between pt-4 mt-auto">
                            <span className="text-white/40 text-xs">{sosData.total} total SOS</span>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => setSosPage(p => Math.max(1, p - 1))} disabled={sosPage <= 1}>Prev</Button>
                              <span className="text-white/50 text-xs self-center">Page {sosPage}</span>
                              <Button variant="ghost" size="sm" onClick={() => setSosPage(p => p + 1)} disabled={sosPage * 10 >= sosData.total}>Next</Button>
                            </div>
                          </div>
                        )}
                      </div>
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

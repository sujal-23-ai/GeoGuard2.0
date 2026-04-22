import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Shield, Star, MapPin, Phone, Plus, Trash2, Award, BarChart2, User as UserIcon } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { usersApi } from '../../services/api';
import { getInitials, colorFromString } from '../../utils/helpers';

export default function ProfilePanel({ open, onClose }) {
  const { user, isAuthenticated, updateUser, emergencyContacts, addEmergencyContact, removeEmergencyContact } = useAppStore();
  const [newContact, setNewContact] = useState({ name: '', phone: '' });
  const [uploading, setUploading] = useState(false);

  if (!isAuthenticated || !user) return null;

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await usersApi.updateProfile({ avatarUrl: URL.createObjectURL(file) });
      if (res.user) updateUser(res.user);
    } catch (err) {
      console.error('Avatar upload failed:', err);
    }
    setUploading(false);
  };

  const handleAddContact = () => {
    if (!newContact.name.trim() || !newContact.phone.trim()) return;
    addEmergencyContact({ ...newContact, id: Date.now() });
    setNewContact({ name: '', phone: '' });
  };

  const reportCount = user.reportCount || user.report_count || 0;
  const accuracy = user.accuracy || user.accuracyRate || 85;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed right-0 top-0 bottom-0 w-80 z-50 bg-surface/98 backdrop-blur-2xl border-l border-white/10 shadow-card flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/8 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold">Profile</h2>
                <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Avatar & Name */}
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-lg overflow-hidden"
                    style={{ background: user.avatarUrl ? 'transparent' : colorFromString(user.name || '') }}
                  >
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(user.name)
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-5 h-5 text-white" />
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-white font-bold text-base">{user.name}</p>
                  <p className="text-white/40 text-xs">{user.email}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 font-semibold capitalize">
                      {user.role || 'user'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="p-4 border-b border-white/8 grid grid-cols-3 gap-2 flex-shrink-0">
              <div className="text-center p-2 bg-white/4 rounded-xl">
                <Shield className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-white font-bold text-sm">{user.trustScore || 100}</p>
                <p className="text-white/40 text-[9px]">Trust Score</p>
              </div>
              <div className="text-center p-2 bg-white/4 rounded-xl">
                <BarChart2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <p className="text-white font-bold text-sm">{reportCount}</p>
                <p className="text-white/40 text-[9px]">Reports</p>
              </div>
              <div className="text-center p-2 bg-white/4 rounded-xl">
                <Award className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <p className="text-white font-bold text-sm">{accuracy}%</p>
                <p className="text-white/40 text-[9px]">Accuracy</p>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {/* Points & Badges */}
              <div className="bg-white/4 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span className="text-white text-xs font-semibold">{user.points || 0} Points</span>
                </div>
                {(user.badges?.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {user.badges.map((b, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {b.icon || '🏆'} {b.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Emergency Contacts */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Phone className="w-4 h-4 text-red-400" />
                  <span className="text-white text-xs font-bold uppercase tracking-wider">Emergency Contacts</span>
                </div>

                {emergencyContacts.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    {emergencyContacts.map((c, i) => (
                      <div key={c.id || i} className="flex items-center gap-2 p-2.5 bg-white/4 rounded-xl border border-white/8">
                        <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                          <UserIcon className="w-3.5 h-3.5 text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold truncate">{c.name}</p>
                          <p className="text-white/40 text-[10px]">{c.phone}</p>
                        </div>
                        <button
                          onClick={() => removeEmergencyContact(i)}
                          className="text-white/30 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/30 text-xs mb-3">No emergency contacts added yet</p>
                )}

                {/* Add contact form */}
                <div className="space-y-2">
                  <input
                    value={newContact.name}
                    onChange={(e) => setNewContact((c) => ({ ...c, name: e.target.value }))}
                    placeholder="Contact name..."
                    className="input-glass text-xs w-full"
                  />
                  <input
                    value={newContact.phone}
                    onChange={(e) => setNewContact((c) => ({ ...c, phone: e.target.value }))}
                    placeholder="Phone number..."
                    className="input-glass text-xs w-full"
                  />
                  <button
                    onClick={handleAddContact}
                    disabled={!newContact.name.trim() || !newContact.phone.trim()}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-red-500/15 border border-red-500/30 text-red-400 rounded-xl text-xs font-semibold hover:bg-red-500/25 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Contact
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

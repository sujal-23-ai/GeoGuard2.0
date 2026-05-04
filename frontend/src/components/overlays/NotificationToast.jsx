import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Bell, Shield } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const TYPE_CFG = {
  incident: { Icon: AlertTriangle, color: '#f59e0b', bg: 'bg-amber-500/15 border-amber-500/30' },
  sos: { Icon: Bell, color: '#ef4444', bg: 'bg-red-500/15 border-red-500/30' },
  danger_zone: { Icon: AlertTriangle, color: '#ef4444', bg: 'bg-red-500/15 border-red-500/30' },
  default: { Icon: Shield, color: '#3b82f6', bg: 'bg-blue-500/15 border-blue-500/30' },
};

export default function NotificationToast() {
  const { notifications } = useAppStore();
  const [toast, setToast] = useState(null);
  const prevLenRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (notifications.length > prevLenRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast(notifications[0]);
      timerRef.current = setTimeout(() => setToast(null), 4500);
    }
    prevLenRef.current = notifications.length;
  }, [notifications]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const cfg = toast ? (TYPE_CFG[toast.type] || TYPE_CFG.default) : null;

  return (
    <div className="absolute top-20 right-4 z-50 w-80 pointer-events-auto">
      <AnimatePresence>
        {toast && cfg && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className={`flex items-start gap-3 p-3.5 rounded-2xl border backdrop-blur-2xl shadow-card bg-surface/95 ${cfg.bg}`}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${cfg.color}20`, border: `1px solid ${cfg.color}40` }}
            >
              <cfg.Icon className="w-4 h-4" style={{ color: cfg.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold leading-tight">{toast.title}</p>
              <p className="text-white/50 text-[10px] mt-0.5 truncate">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-white/30 hover:text-white/70 transition-colors flex-shrink-0 mt-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

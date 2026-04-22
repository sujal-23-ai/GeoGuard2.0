import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Info, CheckCircle, Zap } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const icons = {
  incident: AlertTriangle,
  sos: Zap,
  success: CheckCircle,
  info: Info,
  error: AlertTriangle,
};

const colors = {
  incident: 'border-amber-500/40 bg-amber-500/10',
  sos: 'border-red-500/60 bg-red-500/15',
  success: 'border-emerald-500/40 bg-emerald-500/10',
  info: 'border-blue-500/40 bg-blue-500/10',
  error: 'border-red-500/40 bg-red-500/10',
};

function ToastItem({ notification }) {
  const dismiss = useAppStore((s) => s.dismissNotification);
  const Icon = icons[notification.type] || Info;

  useEffect(() => {
    const timer = setTimeout(() => dismiss(notification.id), notification.type === 'sos' ? 8000 : 5000);
    return () => clearTimeout(timer);
  }, [notification.id, dismiss, notification.type]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl max-w-sm shadow-card
        ${colors[notification.type] || colors.info}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5 text-white/80" />
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm">{notification.title}</p>
        <p className="text-white/60 text-xs mt-0.5 truncate">{notification.message}</p>
      </div>
      <button onClick={() => dismiss(notification.id)} className="text-white/40 hover:text-white/70 flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export default function ToastContainer() {
  const notifications = useAppStore((s) => s.notifications);

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="sync">
        {notifications.map((n) => (
          <div key={n.id} className="pointer-events-auto">
            <ToastItem notification={n} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LandingPage from '../features/auth/LandingPage';
import MapDashboard from '../features/map/MapDashboard';
import ShareLocationView from '../features/share/ShareLocationView';
import ToastContainer from '../components/ui/Toast';
import useAppStore from '../store/useAppStore';
import { authApi } from '../services/api';

export default function App() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const [isLoading, setIsLoading] = useState(true);
  const [shareToken, setShareToken] = useState(null);
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    const html = document.documentElement;
    const isMap = view === 'app';
    html.classList.toggle('dark', isMap || theme === 'dark');
    html.classList.toggle('light', !isMap && theme === 'light');
  }, [theme, view]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const sToken = params.get('shareToken');
    const existingToken = useAppStore.getState().token;

    if (sToken) {
      setShareToken(sToken);
      setView('share');
      setIsLoading(false);
      return;
    }

    if (token) {
      useAppStore.setState({ token });
      authApi.me().then(({ user }) => {
        useAppStore.getState().setAuth(user, token);
      }).catch(() => { useAppStore.getState().logout(); });
      window.history.replaceState({}, '', '/');
    } else if (existingToken) {
      authApi.me().then(({ user }) => {
        useAppStore.getState().setAuth(user, existingToken);
      }).catch(() => { useAppStore.getState().logout(); });
    }

    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <div className="absolute inset-0 rounded-2xl border-2 border-primary/30 animate-ping" />
          </div>
          <div className="text-center">
            <div className="text-white font-bold text-xl tracking-tight">GeoGuard</div>
            <div className="text-white/40 text-sm mt-1">Loading safety intelligence...</div>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                className="w-2 h-2 rounded-full bg-primary"
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-background">
      <AnimatePresence mode="wait">
        {view === 'share' ? (
          <ShareLocationView key="share" token={shareToken} />
        ) : view === 'landing' ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full overflow-auto"
          >
            <LandingPage onEnterApp={() => setView('app')} />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full"
          >
            <MapDashboard />
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer />
    </div>
  );
}






















// working
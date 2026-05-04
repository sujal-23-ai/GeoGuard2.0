import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import Button from '../../components/ui/Button';
import { authApi } from '../../services/api';
import useAppStore from '../../store/useAppStore';

export default function AuthModal({ open, onClose }) {
  const [mode, setMode] = useState('login');
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [otp, setOtp] = useState('');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAppStore((s) => s.setAuth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const data = await authApi.login({ email: form.email, password: form.password });
        setAuth(data.user, data.token);
        onClose();
      } else {
        if (step === 'form') {
          // Request OTP
          await authApi.sendVerification({ email: form.email });
          setStep('otp');
        } else {
          // Submit OTP and Register
          const data = await authApi.register({ ...form, otp });
          setAuth(data.user, data.token);
          onClose();
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="w-full max-w-sm bg-surface/98 backdrop-blur-2xl border border-white/12 rounded-3xl shadow-card overflow-hidden">
              {/* Header */}
              <div className="relative p-6 pb-0">
                <div className="absolute inset-0 bg-glow-blue opacity-20" />
                <div className="relative flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-white font-bold text-lg">GeoGuard</h2>
                      <p className="text-white/40 text-xs">{mode === 'login' ? 'Welcome back' : 'Join the network'}</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="relative flex bg-white/5 rounded-xl p-1 gap-1 mb-6">
                  {['login', 'register'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setMode(m); setStep('form'); setOtp(''); setError(''); }}
                      className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200
                        ${mode === m ? 'bg-primary text-white shadow-glow-blue' : 'text-white/50 hover:text-white/80'}`}
                    >
                      {m === 'login' ? 'Sign In' : 'Sign Up'}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-3">
                {mode === 'register' && step === 'otp' ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-white/70">
                        We sent a 6-digit code to <span className="font-semibold text-white">{form.email}</span>.
                      </p>
                    </div>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={otp} 
                        onChange={(e) => setOtp(e.target.value)} 
                        placeholder="Enter 6-digit OTP" 
                        required
                        maxLength={6}
                        className="input-glass text-center tracking-[0.5em] text-lg font-bold w-full" 
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setStep('form')}
                      className="text-xs text-primary hover:text-primary/80 w-full text-center"
                    >
                      Change email or edit details
                    </button>
                  </div>
                ) : (
                  <>
                    {mode === 'register' && (
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input value={form.name} onChange={update('name')} placeholder="Full Name" required
                          className="input-glass pl-10 text-sm" />
                      </div>
                    )}

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input type="email" value={form.email} onChange={update('email')} placeholder="Email" required
                        className="input-glass pl-10 text-sm" />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={form.password} onChange={update('password')} placeholder="Password" required
                        className="input-glass pl-10 pr-10 text-sm"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </>
                )}

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {error}
                  </motion.p>
                )}

                <Button type="submit" loading={loading} className="w-full mt-4" size="lg">
                  {mode === 'login' ? 'Sign In' : (step === 'otp' ? 'Verify & Register' : 'Continue')}
                </Button>

                <div className="relative flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-white/30 text-xs">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleGoogleLogin}
                  className="w-full"
                  size="lg"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>

                <p className="text-center text-white/30 text-xs">
                  By continuing, you agree to our Terms & Privacy Policy
                </p>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

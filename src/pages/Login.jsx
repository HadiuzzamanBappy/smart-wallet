import React, { useState } from 'react';
import { registerUser, loginUser, loginWithGoogle } from '../services/authService';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Zap, DollarSign, Euro, CircleDollarSign } from 'lucide-react';

// Base UI Components
import Button from '../components/UI/base/Button';
import IconBox from '../components/UI/base/IconBox';
import GlassCard from '../components/UI/base/GlassCard';

const Login = ({ onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: ''
  });
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (isLogin) {
        result = await loginUser(formData.email, formData.password);
      } else {
        result = await registerUser(formData.email, formData.password, formData.displayName);
      }

      if (!result.success) {
        setError(result.error);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await loginWithGoogle();
      if (!result.success) {
        setError(result.error);
      }
    } catch {
      setError('Identity authentication failure');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-paper-50 dark:bg-ink-950 relative overflow-hidden p-4 font-sans transition-colors duration-500">
      {/* Animated Floating Assets Infrastructure */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes floatMoney {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.15; }
          90% { opacity: 0.15; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
        .floating-asset {
          position: absolute;
          bottom: -100px;
          pointer-events: none;
          z-index: 1;
        }
      `}} />

      {/* Floating Money Background Icons */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-20">
        {[...Array(12)].map((_, i) => {
          const Icon = i % 3 === 0 ? DollarSign : i % 3 === 1 ? Euro : CircleDollarSign;
          const left = Math.random() * 100;
          const duration = 25 + Math.random() * 20;
          const delay = Math.random() * 15;
          const size = 16 + Math.random() * 20;

          return (
            <div
              key={i}
              className="floating-asset text-primary-500 dark:text-primary-400"
              style={{
                left: `${left}%`,
                animation: `floatMoney ${duration}s infinite linear`,
                animationDelay: `${delay}s`,
              }}
            >
              <Icon size={size} strokeWidth={1} />
            </div>
          );
        })}
      </div>

      {/* Subtle Atmospheric Glow - Nexus Atmosphere */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-500/[0.05] dark:bg-primary-500/[0.08] rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-secondary-500/[0.05] dark:bg-secondary-500/[0.07] rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="w-full max-w-[380px] relative z-10">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="fixed top-6 left-6 z-50 p-2.5 text-ink-400 hover:text-ink-900 dark:text-paper-700 dark:hover:text-paper-50 bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-paper-200 dark:border-white/10 rounded-2xl transition-all hover:scale-110 active:scale-95 shadow-xl shadow-ink-950/5"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Compact Branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <IconBox icon={Zap} variant="glass" color="primary" size="lg" className="mb-4" />
          <h1 className="text-h2 font-black text-ink-900 dark:text-paper-50 tracking-tight leading-none mb-2">Wallet Tracker</h1>
          <div className="flex items-center gap-2">
            <span className="h-px w-4 bg-primary-500/30"></span>
            <p className="text-overline text-ink-400 dark:text-paper-700 font-black tracking-[0.2em] uppercase">Financial Suite</p>
            <span className="h-px w-4 bg-primary-500/30"></span>
          </div>
        </div>

        <GlassCard
          className="overflow-hidden border-paper-200 dark:border-white/5 shadow-2xl relative"
          padding="p-6 sm:p-8"
          rounded="rounded-3xl"
        >

          <div className="mb-8 text-center">
            <h2 className="text-h5 font-black text-ink-900 dark:text-paper-50 tracking-tight mb-1">
              {isLogin ? 'Access Portal' : 'Initialize Node'}
            </h2>
            <p className="text-label text-ink-400 dark:text-paper-700 font-medium">
              {isLogin ? 'Secure Suite Credentials' : 'Create Intelligence Node'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-error-500/5 dark:bg-error-500/10 border border-error-500/20 text-error-600 dark:text-error-400 text-label font-bold tracking-tight rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="w-1.5 h-1.5 rounded-full bg-error-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] mt-1" />
              <span className="flex-1">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-overline text-ink-400 dark:text-paper-700 font-black uppercase tracking-widest px-1">
                  Identity Label
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300 dark:text-paper-800 group-focus-within:text-primary-500 transition-colors" />
                  <input
                    type="text"
                    name="displayName"
                    placeholder="Operator Name"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-paper-100/50 dark:bg-white/[0.02] border border-paper-100 dark:border-white/5 text-ink-900 dark:text-paper-50 text-body font-bold placeholder-ink-300 dark:placeholder-paper-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/40 transition-all"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-overline text-ink-400 dark:text-paper-700 font-black uppercase tracking-widest px-1">
                Access Point
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300 dark:text-paper-800 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="email"
                  name="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-paper-100/50 dark:bg-white/[0.02] border border-paper-100 dark:border-white/5 text-ink-900 dark:text-paper-50 text-body font-bold placeholder-ink-300 dark:placeholder-paper-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/40 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-overline text-ink-400 dark:text-paper-700 font-black uppercase tracking-widest px-1">
                Security Key
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300 dark:text-paper-800 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-11 py-3 rounded-2xl bg-paper-100/50 dark:bg-white/[0.02] border border-paper-100 dark:border-white/5 text-ink-900 dark:text-paper-50 text-body font-bold placeholder-ink-300 dark:placeholder-paper-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/40 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-900 dark:text-paper-800 dark:hover:text-paper-50 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              loading={loading}
              fullWidth
              color="primary"
              className="mt-6 !py-4 shadow-2xl shadow-primary-500/20 rounded-2xl text-overline font-black tracking-[0.2em]"
            >
              {isLogin ? 'Authenticate' : 'Initialize Node'}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-paper-100 dark:border-white/5 space-y-4">
            <Button
              onClick={handleGoogleLogin}
              disabled={loading}
              fullWidth
              variant="soft"
              color="ink"
              className="group !py-4 bg-paper-100/50 dark:bg-white/[0.02] border-paper-100 dark:border-white/10 rounded-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-center gap-3 relative z-10">
                <svg className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-label font-bold text-ink-700 dark:text-paper-600">Identity Portal</span>
              </div>
            </Button>

            <div className="text-center pt-2">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-label text-ink-400 dark:text-paper-700 hover:text-primary-500 dark:hover:text-primary-400 font-bold transition-all underline underline-offset-4 decoration-primary-500/20"
              >
                {isLogin ? "Request Access Code" : "Return to Authenticator"}
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Footer info */}
        <div className="mt-8 text-center opacity-40">
          <p className="text-overline text-ink-300 dark:text-paper-900 font-black tracking-widest">
            &copy; {new Date().getFullYear()} Wallet Tracker
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;